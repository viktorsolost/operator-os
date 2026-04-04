'use strict';

// ---------------------------------------------------------------------------
// Connector Planner
// Accepts resolved enabled connectors, validates the stage/dependency graph,
// produces a deterministic execution plan, and executes it with a summary.
// ---------------------------------------------------------------------------

const { VALID_STAGES } = require('./manifest_schema');

// ---------------------------------------------------------------------------
// validateDependencyGraph
// ---------------------------------------------------------------------------

/**
 * Validate the dependency graph for a set of connector manifests.
 * Checks for: invalid stages, cross-stage deps, missing deps, self-references, cycles.
 * Returns { valid: boolean, errors: string[] }.
 */
function validateDependencyGraph(connectors) {
  const errors = [];
  const idToConnector = new Map();

  for (const c of connectors) {
    idToConnector.set(c.id, c);
  }

  for (const c of connectors) {
    // Valid stage check
    if (!VALID_STAGES.includes(c.stage)) {
      errors.push(`Connector '${c.id}' has invalid stage '${c.stage}'`);
    }

    if (!Array.isArray(c.after) || c.after.length === 0) continue;

    for (const dep of c.after) {
      // Self-reference
      if (dep === c.id) {
        errors.push(`Connector '${c.id}' references itself in 'after'`);
        continue;
      }

      // Missing dependency
      if (!idToConnector.has(dep)) {
        errors.push(`Connector '${c.id}' references non-existent connector '${dep}' in 'after'`);
        continue;
      }

      // Cross-stage dependency
      const depConnector = idToConnector.get(dep);
      if (depConnector.stage !== c.stage) {
        errors.push(`Connector '${c.id}' (stage '${c.stage}') has cross-stage dependency on '${dep}' (stage '${depConnector.stage}')`);
      }
    }
  }

  // Cycle detection per stage using DFS
  if (errors.length === 0) {
    const byStage = new Map();
    for (const c of connectors) {
      if (!byStage.has(c.stage)) byStage.set(c.stage, []);
      byStage.get(c.stage).push(c);
    }

    for (const [stage, stageConnectors] of byStage) {
      const cycleErrors = detectCycles(stageConnectors, stage);
      for (const e of cycleErrors) errors.push(e);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Detect cycles in after constraints within a single stage.
 * Returns array of error strings.
 */
function detectCycles(connectors, stage) {
  const errors = [];
  const idToConnector = new Map();
  for (const c of connectors) idToConnector.set(c.id, c);

  // DFS-based cycle detection
  // States: 0 = unvisited, 1 = in progress, 2 = done
  const state = new Map();
  for (const c of connectors) state.set(c.id, 0);

  function dfs(id, path) {
    if (state.get(id) === 2) return false;
    if (state.get(id) === 1) {
      // Found cycle — identify cycle members
      const cycleStart = path.indexOf(id);
      const cycle = path.slice(cycleStart).concat(id);
      errors.push(`Cycle detected in stage '${stage}': ${cycle.join(' -> ')}`);
      return true;
    }

    state.set(id, 1);
    path.push(id);

    const connector = idToConnector.get(id);
    const deps = Array.isArray(connector.after) ? connector.after : [];
    for (const dep of deps) {
      if (!idToConnector.has(dep)) continue; // Already caught by validateDependencyGraph
      if (dfs(dep, path)) return true;
    }

    path.pop();
    state.set(id, 2);
    return false;
  }

  for (const c of connectors) {
    if (state.get(c.id) === 0) {
      dfs(c.id, []);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Topological sort within a priority group
// ---------------------------------------------------------------------------

/**
 * Given connectors in the same priority tier, produce a topologically sorted
 * order respecting `after` constraints, with alphabetical tiebreaking.
 *
 * The algorithm proceeds in waves (BFS layers):
 *   1. Collect all nodes with zero in-degree (no unmet deps), sort alphabetically.
 *   2. Emit that entire wave before computing the next wave.
 *   3. Repeat until all nodes are emitted.
 *
 * This ensures nodes with no deps always appear before nodes that only become
 * ready after some other node is processed, matching the spec ordering of
 * [A, C, B] for: A(no deps), C(no deps), B(after A).
 *
 * Assumes no cycles (validated upstream).
 */
function topoSortWithinPriority(connectors) {
  const idToConnector = new Map();
  for (const c of connectors) idToConnector.set(c.id, c);

  // Build in-degree map and adjacency list (only within this priority group)
  const inDegree = new Map();
  const dependents = new Map(); // dep -> list of connectors that depend on dep

  for (const c of connectors) {
    if (!inDegree.has(c.id)) inDegree.set(c.id, 0);
    if (!dependents.has(c.id)) dependents.set(c.id, []);
  }

  for (const c of connectors) {
    const deps = Array.isArray(c.after) ? c.after : [];
    for (const dep of deps) {
      if (!idToConnector.has(dep)) continue; // Cross-stage or missing — already validated
      inDegree.set(c.id, (inDegree.get(c.id) || 0) + 1);
      dependents.get(dep).push(c.id);
    }
  }

  const result = [];

  // BFS by wave: emit an entire alphabetically-sorted wave before advancing
  let wave = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) wave.push(id);
  }
  wave.sort();

  while (wave.length > 0) {
    const nextWave = [];

    for (const id of wave) {
      result.push(idToConnector.get(id));

      for (const nid of (dependents.get(id) || [])) {
        if (!idToConnector.has(nid)) continue;
        inDegree.set(nid, inDegree.get(nid) - 1);
        if (inDegree.get(nid) === 0) nextWave.push(nid);
      }
    }

    nextWave.sort();
    wave = nextWave;
  }

  return result;
}

// ---------------------------------------------------------------------------
// buildExecutionPlan
// ---------------------------------------------------------------------------

/**
 * Build a deterministic execution plan from enabled connector manifests.
 * Returns { valid: boolean, plan: Array, errors: string[] }.
 */
function buildExecutionPlan(enabledConnectors) {
  // Validate dependency graph first
  const { valid, errors } = validateDependencyGraph(enabledConnectors);
  if (!valid) {
    return { valid: false, plan: [], errors };
  }

  // Build plan with all 4 stages (even if empty)
  const plan = VALID_STAGES.map(stage => {
    // Get connectors in this stage
    const stageConnectors = enabledConnectors.filter(c => c.stage === stage);

    // Group by priority
    const priorityGroups = new Map();
    for (const c of stageConnectors) {
      if (!priorityGroups.has(c.priority)) priorityGroups.set(c.priority, []);
      priorityGroups.get(c.priority).push(c);
    }

    // Sort priority groups ascending
    const sortedPriorities = Array.from(priorityGroups.keys()).sort((a, b) => a - b);

    // Within each priority group, topo-sort with alphabetical tiebreaking
    const orderedConnectors = [];
    for (const priority of sortedPriorities) {
      const group = priorityGroups.get(priority);
      const sorted = topoSortWithinPriority(group);
      for (const c of sorted) orderedConnectors.push(c);
    }

    return { stage, connectors: orderedConnectors };
  });

  return { valid: true, plan, errors: [] };
}

// ---------------------------------------------------------------------------
// executeStages
// ---------------------------------------------------------------------------

/**
 * Execute a plan built by buildExecutionPlan.
 * executorFn(connector, stage) returns { success: boolean, error?: string, data?: any }.
 * Returns a run summary.
 */
function executeStages(plan, executorFn) {
  const startTotal = Date.now();
  const stageResults = [];

  let sourceSyncSuccesses = 0;
  let derivationCompleted = false;
  let skipDerivation = false;

  for (const stageGroup of plan) {
    const { stage, connectors } = stageGroup;

    // If this is derivation and we must skip it
    if (stage === 'derivation' && skipDerivation) {
      stageResults.push({ stage, results: [] });
      continue;
    }

    const results = [];

    for (const connector of connectors) {
      const startMs = Date.now();
      let outcome;
      try {
        outcome = executorFn(connector, stage);
      } catch (err) {
        outcome = { success: false, error: err.message };
      }
      const duration_ms = Date.now() - startMs;

      const entry = {
        connector_id: connector.id,
        success: outcome.success,
        duration_ms,
      };
      if (!outcome.success && outcome.error) entry.error = outcome.error;
      results.push(entry);

      if (stage === 'source_sync' && outcome.success) sourceSyncSuccesses++;
    }

    stageResults.push({ stage, results });

    // After source_sync: check if we need to skip derivation
    if (stage === 'source_sync' && connectors.length > 0 && sourceSyncSuccesses === 0) {
      skipDerivation = true;
    }

    if (stage === 'derivation') {
      derivationCompleted = true;
    }
  }

  const total_ms = Date.now() - startTotal;

  // Determine overall success:
  // source_sync stage had connectors and at least one succeeded, AND derivation completed or was empty/skipped
  const sourceSyncStage = plan.find(s => s.stage === 'source_sync');
  const hasSourceSyncConnectors = sourceSyncStage && sourceSyncStage.connectors.length > 0;

  let success;
  if (!hasSourceSyncConnectors) {
    // No source_sync connectors — success if derivation was not forcibly skipped
    success = !skipDerivation;
  } else {
    // source_sync had connectors: need at least one success
    const derivationStage = plan.find(s => s.stage === 'derivation');
    const hasDerivationConnectors = derivationStage && derivationStage.connectors.length > 0;
    if (sourceSyncSuccesses > 0) {
      // Derivation must complete (or be empty)
      success = !hasDerivationConnectors || derivationCompleted;
    } else {
      success = false;
    }
  }

  return {
    stages: stageResults,
    success,
    total_ms,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  buildExecutionPlan,
  executeStages,
  validateDependencyGraph,
};

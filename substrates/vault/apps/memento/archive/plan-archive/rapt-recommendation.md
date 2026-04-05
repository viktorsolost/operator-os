# RAPT Token Expiry — Recommendation

## Root Cause

Google Workspace enforces session control policies on all OAuth tokens for accounts under a managed domain. The 3 Workspace accounts (viktor@cultural-affairs.com, viktor@eternogallery.com, info@ephemeralethernal.com) are subject to admin-enforced session length limits, typically 16-24 hours. When the session expires, Google returns an `invalid_grant` error and the refresh token cannot be silently refreshed. Manual browser re-authentication is required.

The personal Gmail account (viktor.so.lost@gmail.com) is NOT affected despite having identical OAuth scopes, including `cloud-platform`. This confirms the root cause is the Workspace admin session control policy, not the OAuth scope selection. Consumer Gmail accounts are not subject to Workspace session policies.

Two separate Workspace domains are involved:
- cultural-affairs.com (covers gws-ca and likely gws-eterno)
- ephemeralethernal.com (covers gws-info)

Each domain has its own Admin Console and session policy.

## Current Behavior

- The pipeline calls `gws` via `execFile`, passing `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` per account
- When a token has expired, the subprocess returns an error
- The pipeline handles this gracefully: logs, records a failure, continues to next account
- Morning digest surfaces re-auth commands for failed accounts
- Net effect: overnight runs silently skip expired accounts, producing empty sections

## Constraint

Viktor does not have Google Workspace Super Admin access on the company accounts. This eliminates the two most reliable fixes (admin session policy change and service account with domain-wide delegation), since both require Super Admin.

## Available Fixes

### 1. Ask the domain admin to extend or disable session control

- **Reliability**: High
- **Effort**: Low (admin console change, no code)
- **Requires admin access**: Yes — Super Admin for cultural-affairs.com AND ephemeralethernal.com
- **How it works**: Admin Console > Security > Access and data control > Google Cloud session control. Set session length to maximum (24h) or disable. Removes the hard expiry on refresh tokens.
- **Drawbacks**: Maximum is 24 hours on newer orgs, which still may not cover overnight gaps. The admin may not want to relax this for security reasons. Need to identify who the admin is for each domain.
- **Viktor's access**: No. Needs to request from whoever manages the Workspace.

### 2. Ask the domain admin to set up a service account with domain-wide delegation

- **Reliability**: Very High — tokens never expire for automation
- **Effort**: High (GCP setup + code changes to pipeline)
- **Requires admin access**: Yes — Super Admin must grant domain-wide delegation
- **How it works**: A GCP service account authenticates with a private key and impersonates user emails. No refresh tokens, no RAPT, no session limits.
- **Drawbacks**: Significant setup. The gws CLI does not natively support service account auth, so pipeline code would need changes (either pre-obtain access tokens and inject via `GOOGLE_WORKSPACE_CLI_TOKEN` env var, or switch to direct Google API calls). Admin may have concerns about delegation scope. Only covers Workspace accounts — personal Gmail stays on user OAuth.
- **Viktor's access**: No. Needs admin to create and delegate.

### 3. Scope reduction (re-auth without `cloud-platform`)

- **Reliability**: Low — previously attempted by Viktor without success
- **Effort**: Low
- **Requires admin access**: No
- **How it works**: Re-authenticate with only the scopes the pipeline needs, excluding `cloud-platform`. Theory: removing that scope might bypass the session control trigger.
- **Evidence against**: Personal Gmail has the same `cloud-platform` scope and does NOT expire. This means the scope is not the trigger. Viktor has also tried re-authing before and it did not resolve the issue.
- **Verdict**: Not recommended. The data does not support this as the fix.

### 4. Pipeline-level workaround: automated re-auth reminder

- **Reliability**: Medium — does not fix the problem, just reduces impact
- **Effort**: Low
- **Requires admin access**: No
- **How it works**: Already partially implemented. The pipeline logs failures and the morning digest surfaces re-auth commands. Could be enhanced with a notification (push notification, Slack, email from personal account) when tokens expire, so Viktor can re-auth promptly.
- **Drawbacks**: Still requires manual re-auth. Does not enable true overnight automation.

### 5. Schedule pipeline runs within token lifetime

- **Reliability**: Medium
- **Effort**: Low
- **Requires admin access**: No
- **How it works**: If tokens last ~16-24h, schedule pipeline runs shortly after manual re-auth (e.g., Viktor re-auths in the morning, pipeline runs throughout the day, overnight run at midnight may still be within window). Adjust run schedule to maximize coverage within the token lifetime.
- **Drawbacks**: Does not solve the fundamental problem. Overnight runs may still miss the window depending on when Viktor last re-authed.

## Recommendation

**The real fix requires admin access that Viktor does not have.**

Immediate next steps:

1. **Find out who the Workspace admin is** for cultural-affairs.com and ephemeralethernal.com. Check Admin Console access at admin.google.com, or ask the team.

2. **Request Fix 1** (session control extension/disable) from the admin. This is the lowest-effort ask and may be all that's needed.

3. **If the admin is willing to do more**, request Fix 2 (service account with delegation) as the durable solution.

4. **In the meantime**, the pipeline already handles failures gracefully. The current workaround (re-auth when the morning digest flags it) is functional, just not ideal.

If Viktor IS the admin but doesn't know it, try logging into admin.google.com with each Workspace account to check.

## Differences Across Accounts

| Account | Type | Expires | Admin Domain | Fix Path |
|---|---|---|---|---|
| gws-personal | Consumer Gmail | No | N/A | No fix needed |
| gws-ca | Google Workspace | Yes (~24h) | cultural-affairs.com | Admin fix needed |
| gws-eterno | Google Workspace | Yes (~24h) | cultural-affairs.com (likely) | Admin fix needed |
| gws-info | Google Workspace | Yes (~24h) | ephemeralethernal.com | Admin fix needed (separate domain) |

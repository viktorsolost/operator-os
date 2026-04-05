# 0009.eth Session Log

## 2026-04-02

- X Space "Found at the Edge | Eterno x 0009" held today. Pauline interviewed Chris about the show and the print edition. Conversation went well, low attendance but quality discussion. Viktor opened and closed, Pauline and Chris carried the talk.
- Print edition details shared on the Space: layered piece (digital print + screenprint + varnish), 70x50cm. Edition of 30 at €700, 5 APs at €1,200 with embedded NFT via NFC chip. APs require buyer to email wallet address to info@eternogallery.com.
- X post drafted and posted 30 min before the Space to announce it.

## 2026-03-31

- Print edition "Found at the Edge" pre-sale going live today. Discord-exclusive, 24 hours, limited to 5 prints. Public sale April 1.
- Pulled Chris's recent tweets via X API for Discord announcement language. His key description: "a new edition that extends my exploration of division, memory, and material presence from WSOTF. A unique giclée print featuring torn edges and successive layers of varnish applied through screen printing."
- ChatGPT prompt prepared for Viktor to generate the Discord announcement.

## 2026-03-25 afternoon

NFC meeting prep:
- Researched NFC tags for physical prints linked to NFTs. Recommended NTAG 424 DNA TagTamper for future editions, but current batch uses NTAG216 (already purchased).
- Successfully programmed first NFC tag using NFC Tools app (free version, iOS). Tag reads and opens URL.
- NFC tag placement: on the back of each print, under Chris's signed label. Collector taps with phone, sees the NFT.
- Built NFC landing page prototype: `dashboard/public/nfc-test.html`. Pulls NFT metadata and image directly from IPFS (no OpenSea dependency). 75/25 layout, Eterno logo top-left, artwork info on right, "View on OpenSea" link. Works end-to-end with live data.
- NFT tested: token 4, contract 0x8894e04dbf1437c33e291f6e88d053030c20c26e, "Stuck in the Barrier" from "Wrong Side of the Fence" collection.
- Architecture decision: NFC tags point to own domain (nft.eternogallery.com), not directly to OpenSea. Future-proof against marketplace URL changes.
- Wrote full dev brief for production implementation: how to call tokenURI on the contract via public RPC, fetch metadata from IPFS, render branded page. Brief covers ethers.js code, IPFS gateway fallbacks, caching strategy.

Primavera articles:
- Pulled all SOP instructions for article creation (Phase 6, Step 8).
- Attempted to log in to Primavera but blocked, waiting for finance team callback.

Pending:
- Primavera articles not yet created (blocked on login, waiting for finance callback)
- NFC landing page needs production build by dev (prototype ready at dashboard/public/nfc-test.html)

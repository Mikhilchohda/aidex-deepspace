# AIDEX hiring-manager demo

## Story

Use one concrete campaign throughout the demo:

**Campaign:** Install 10 solar-powered water pumps in Kutch, Gujarat  
**NGO:** JalSetu Foundation  
**Goal:** 12 Devnet SOL  
**Outcome:** Reliable drinking water for 1,800 residents

Milestones:

1. Site survey and bore testing — 2 SOL
2. Install the first five pumps — 5 SOL
3. Install the remaining five pumps and train operators — 5 SOL

Verifier committee:

- local field verifier;
- independent water-systems engineer;
- AIDEX compliance verifier.

## Accounts

For the complete quorum demo use five DeepSpace accounts and five Devnet wallets:

1. NGO — creates the campaign and submits evidence
2. Donor — locks Devnet SOL
3. Field verifier — first approval
4. Technical verifier — second approval
5. Compliance verifier — demonstrates that no third vote is required

Two browser windows are sufficient for a shorter pitch: keep the NGO signed in normally, use an incognito window for the donor, then explain or pre-record the two verifier signatures.

## Seven-minute walkthrough

1. Start on the landing page. Say: “AIDEX does not try to make real-world truth automatic. It makes custody and enforcement independent of any single person.”
2. Sign in as the NGO and open NGO Studio. Create the campaign and show that milestone allocations must add up exactly to the goal.
3. Enter three unique verifier wallets and initialize the escrow. Open the program and PDA in Solana Explorer.
4. Switch to the donor. Inspect the locked terms, then fund 1 Devnet SOL. Emphasize that the transaction is wallet-to-program, not wallet-to-AIDEX.
5. Return as the NGO. Upload a site report or image. Show its SHA-256 fingerprint and the matching evidence commitment.
6. Open the Verification Console. Run AI analysis. Say: “This can flag anomalies, but notice there is no AI release button.”
7. Sign two approvals from two assigned verifier wallets. The first vote leaves the milestone under review; the second changes it to approved.
8. Execute the permissionless release. Open the transaction and finish on the Trust Ledger.

## The strongest pitch

> AIDEX separates real-world judgment from financial power. DeepSpace handles identity, evidence, collaboration, and AI-assisted review. Three independent humans attest to physical-world progress. Solana holds the funds and enforces a two-of-three threshold, so the NGO, donor, platform, reviewer, or AI can never move the money alone.

## Questions to expect

**Is the AI the authority?**  
No. It produces a risk report only. The Solana program accepts verifier signatures, not model output.

**Is a wallet a verified real-world identity?**  
No. It proves control of a private key. DeepSpace connects that key to an authenticated participant role; organizational verification is an additional compliance process.

**Why use blockchain if humans review the work?**  
Humans are needed for physical-world truth. Blockchain is used for the part it can prove: custody, signatures, thresholds, release amounts, double-payment prevention, deadlines, and refunds.

**Is Devnet SOL real money?**  
No. It is free test currency with no intended monetary value. The demo exercises real Solana transactions without financial risk.

**Is this production-ready?**  
It is a technically authentic prototype. Mainnet would require an independent program audit, stronger organizational identity checks, operational key management, monitoring, and legal/compliance review.

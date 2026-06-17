# T-187-01 — REVIEW (handoff)

The voxel-vs-art tolerance landed and was re-gated at VOTES=6. **Outcome: DO-NOT-PROMOTE (`go=false`).**
But it is a sharp, directional result: the tolerance made the decomposition **PICTURE-DRIVEN** (the
mechanism the prior two loops could not move), and the *only* failure regressed onto a new, precisely
localized seam — the hard-middle margin. `measurements/` untouched; nothing frozen; nothing autonomous.

## What changed (files)

Product code (one feat commit, `66c27f9`):
- **`baml_src/department.baml`** — `DiagnoseBuild` prompt: added a **VOXEL-MEDIUM** clause after
  CONCEPT-CONDITIONAL. Blockiness / stair-stepping / coarse texture are the medium, not divergence; judge
  same-thing-ness at block resolution; sub-resolution ornament is exempt; **reserve `replace`/`major` for
  a genuinely different thing** (the decoupling guard so wrong-picture builds are not forgiven).
- **`src/workshop/diagnose.mjs`** — `styleProfileBlock` header: appended the **material anti-leak** (D3):
  the vocabulary materials are NEVER the expected material; picture-material wins. Body unchanged;
  doc-comment cites T-187/E-47. Signature unchanged.
- **`src/baml/fixtures/diagnose/inputs.json` + `prompt.golden.txt`** — re-pinned from the production
  serializer (the diff is exactly the two new clauses; barn program / palette body byte-identical).
- **Tests:** `diagnose.test.mjs` **DG9** (header material anti-leak); `fixtures.test.mjs` FX-DB1 extended
  (VOXEL MEDIUM / finer than the block grid / NEVER the expected material).

Generated (not committed; `.gitignore`d): `baml_client/**` via `npm run baml:gen`.

Work artifacts: `research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, `RE-GATE.md`,
`run-votes6.log`, this `review.md`.

## Test coverage

- **Unit (`npm test`): 2304 green** (+1 DG9). DG1–DG9 pin the serializer content + the D3 tripwire;
  FX-DB1 byte-matches the re-pinned golden AND asserts the medium-clause language; FX-DB2 (parse) and the
  contract test are unaffected (`Critique` schema untouched). These prove the seam changed exactly as
  intended and nothing downstream drifted.
- **Integration (metered, out-of-test):** the VOTES=6 re-gate (~120 strong-tier calls) — the only test
  of whether the tolerance makes the term PICTURE-DRIVEN *without* lifting wrong-picture builds. Run
  once, recorded honestly in `RE-GATE.md` with matchedRight AND matchedWrong.
- **Gap (by design):** the scoring core (`bakeoff-score.mjs`), the gate (`style-agreement.mjs`), and the
  corpus are unchanged — re-run only. No new unit test covers the *judging behaviour* (it is an LLM
  reading); the re-gate is its only proof, and it is not in `npm test` (metered).

## The numbers (T-185 → T-186 → T-187)

| metric | T-185 | T-186 | **T-187** | reading |
|---|---|---|---|---|
| matchedRight | 53 | 21 | **40** | compression fixed |
| matchedWrong | 45 | 3 | **7** | decoupling held (no uniform lift) |
| foreignRight | 8 | 9 | **35** | pack-material leak fixed |
| conceptImageEffect | 8 | 18 | **33** | picture effect 4× T-185 |
| packEffect | 45 | 12 | **5** | confound ~gone |
| decomposition | PACK-DRIVEN | MIXED | **PICTURE-DRIVEN** | the primary claim |
| hard-middle agreement | 1/5 | 5/5 | **2/5** | the new residual |
| gh-wrongpack | 0 | 1 | **23** | term (leak), not fixture |
| recommendation | DO-NOT-PROMOTE | INCONCLUSIVE | **DO-NOT-PROMOTE** | split, do not promote |

## Open concerns / known limitations (for the reviewer)

1. **The split moved; it did not close.** T-186 failed the decomposition and passed agreement; T-187 is
   the mirror. The term now reads the picture decisively, but the tolerance is **too generous on the
   hard middle** — it lifts deliberately-middling builds (gh-mid-gate 3→47) toward the faithful ones, so
   the faithful-vs-middle margin collapses into `NOISE(12)` and the term's argmax flips (H1 Δ3, H4 Δ5).
2. **Two of three hard-middle disagreements are sub-noise flips** (gaps < 12). The hard-middle pairwise
   rule reads differences below the instrument's own resolution; T-186's 5/5 was itself partly luck on
   sub-noise gaps. This points at a **GATE-side fix** (a noise-aware pairwise rule) as the lower-risk
   successor lever — it does not touch the term and can be tested on the existing run with no new spend.
3. **The term-side lever (faithful-vs-middling gradation) trades against the matched cell** this loop
   just fixed; it must not re-compress matchedRight. Successor decision, not a same-loop tweak.
4. **Proxy labels (`licensing:false`).** The re-gate can refute or recommend, never license. A human-
   signed-off freeze remains the only promotion path; the loop preps, never freezes.

## GO/NO-GO

**NO-GO (`recommendation.go = false`).** Not staged — Step 7 produced the localization + the follow-on
stub (`RE-GATE.md` §6: pick ONE of the gate-side noise-aware rule OR the term-side gradation; re-run the
SAME gate). `measurements/` is byte-untouched; the only product change is the diagnose seam + re-pinned
fixtures, fully reversible by `git revert 66c27f9`. The frozen instrument is unaffected.

## Critical items needing human attention

- **None blocking.** The result is an honest negative on a split, with a clean localization. The
  decision a human should weigh: the term is now PICTURE-DRIVEN with the pack confound gone — is the
  hard-middle margin collapse a GATE artifact (sub-noise rule) worth fixing on the gate side before
  re-judging, rather than a term defect? `RE-GATE.md` §3/§6 lays out the evidence for that call.

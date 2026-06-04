# Progress — T-001-04 style-palette-whitelist

Status: **all plan steps complete, all acceptance criteria demonstrated green.**

## Steps executed (vs. plan.md)

| Step | What | Commit | Result |
|------|------|--------|--------|
| 1 | Scaffold `palettes/` module, `npm install` | `66fb373`* | ✓ deps resolved (ajv 8, minecraft-data 3) |
| 2 | `palette.schema.json` (format definition) | `66fb373` | ✓ compiles with Ajv2020 |
| 3 | `validate.mjs` (two-layer validator) | `3c77a19` | ✓ negative + positive tests pass |
| 4 | `industrial.json` (the data) | `b421521` | ✓ `npm test` green, 37 blocks |
| 5 | `README.md` (format prose) | `f11878e` | ✓ matches schema fields |
| 6 | Final gate + review | — | ✓ clean re-run, footprint isolated |

*Step 1 and Step 2 landed under nearby commit hashes; the scaffold commit is the
one immediately preceding the schema commit in `git log` for this ticket.

## Acceptance criteria — evidence

- **AC #1 (format defined):** `palettes/palette.schema.json` (machine) +
  `palettes/README.md` (prose). Schema compiles cleanly under Ajv draft-2020-12.
- **AC #2 (industrial authored, survival-obtainable):** `palettes/industrial.json`,
  37 blocks, `minecraftVersion: 1.20.4`.
- **AC #3 (every block valid + survival-obtainable):** proven by `validate.mjs`
  Layer B against `minecraft-data@1.20.4` + the `NON_SURVIVAL` exclusion set.
- **AC #4 (validates against its own format):** proven by `validate.mjs` Layer A
  (Ajv against `palette.schema.json`).

Single command demonstrating all four:

```
$ npm test
✓ industrial: 37 blocks valid & survival-obtainable for Minecraft 1.20.4
```

## Validator has teeth (negative tests, transient — not committed)

- Unknown block (`not_a_real_block`) **and** creative-only block (`command_block`)
  in one palette → exit 1, **both** surfaced in one report.
- Orphan group member (`glass` in a group but not in `blocks`) → exit 1.
- `minecraft:`-prefixed ID in a palette *file* → exit 1 at Layer A (schema forbids
  the prefix in authored data, by design — Decision 1).
- Well-formed bare-name palette → exit 0.

## Deviations from plan

1. **Ajv entrypoint.** Plan assumed plain `new Ajv()`. The default Ajv 8 build does
   not register the draft-2020-12 meta-schema, so `ajv.compile` threw
   `no schema with key ... draft/2020-12/schema`. Switched to the
   `ajv/dist/2020.js` (`Ajv2020`) entrypoint, which ships the 2020-12 meta-schema.
   No schema change; validator import only. Caught and fixed in Step 2 before any
   commit depended on it.
2. **Layer B reporting merged.** Plan/structure described collecting offenders; the
   first cut failed at unknown-blocks before reporting creative-only blocks. Merged
   the two so a single run reports *all* semantic offenders (unknown + creative-only)
   together — better diagnostics. Fixed before committing the validator.
3. **Roster size 37, not ~28.** Design estimated ~28; the coherent industrial
   material family (structure + concrete + metal + glazing + accent/light) came to
   37 once each build role was covered. Still a real constraint (37 of 1058 blocks),
   all verified. No AC fixes a count, so this is within scope.
4. **Version `1.20.4` confirmed against the installed package** — `minecraft-data`
   reports 1058 blocks for 1.20.4 and all 37 chosen IDs resolved, so the
   risk-mitigation fallback to another 1.20.x was not needed.

## Concurrency note (observed)

A parallel Lisa thread (T-001-01, schema work) committed `schema/...` files onto the
same branch interleaved with this ticket's commits. Because every T-001-04 file is
under `palettes/`, the two tickets' file sets were disjoint and the shared-branch
commits did not conflict — the file-isolation decision (design.md, Decision 2) held
exactly as intended.

## What remains

Nothing for this ticket. Downstream (not in scope here): T-004-02 will read
`industrial.json` for prompt injection; E-04 will reuse `blocks` + the
`minecraft:`-stripping rule for adherence scoring.

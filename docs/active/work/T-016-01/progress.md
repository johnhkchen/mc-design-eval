# T-016-01 · Progress — Implement log

Followed plan.md steps 1–9. One planned deviation: an extra horyuji re-draw (Step 6 risk
mitigation) to test a white-bg drift.

## Step-by-step

| step | action | result |
|------|--------|--------|
| 1 | flip default `arg("variant","A")` → `"C"` (conceptart.mjs:71) | done; `"A"` no longer a default literal |
| 2 | header-comment touch-up (mark C default + why, fix no-flag example) | done |
| 3 | smoke: `conceptart.mjs --ref=taj` (no `--variant`) | `taj [C/flash]` ok 10.6s, 1 img → `taj-C-flash.png` — default resolves to C ✓ |
| 4 | view taj smoke | black bg, gold dome (doc palette), clean massing — **go** |
| 5 | regenerate horyuji/chapelle/arc/mausoleum (no `--variant`) | all `[C/flash]` ok (1 img each), 10.9–23.0s |
| 6 | view all five; grade vs matrix baseline | see verdicts below |
| 6b | **deviation:** re-draw horyuji once (white-bg lottery test) | `[C/flash]` ok 13.0s → re-draw **black**; lottery confirmed |
| 7 | append journal section to design-learnings.md | done (985 lines) |
| 8 | `npm test` | **133/133 pass, 0 fail** (129ms) |
| 9 | commit | see review.md / git log |

## Per-cell confirmation (F=fidelity, I=inspiration-not-blueprint, D=voxel-honest detail, bg=background)

| ref | bg | F | I | D | verdict | note |
|-----|----|---|---|---|---------|------|
| taj | black | Hi | Hi | Hi | **holds** | gold dome (not white marble), doc palette, plinth, clean |
| horyuji | black* | Hi | Hi | Hi | **holds (on re-draw)** | *first draw white → re-draw black; lottery, not tendency |
| chapelle | near-black | Hi | Hi | Hi | **holds** | rose window as chunky rings, no filigree |
| arc | black | Hi | **Lo** | Hi | **weakened** | gold human figures in niches (matrix arc-C was abstract); bg survives |
| mausoleum | black | Hi | Hi | Med | **holds (caveat)** | nameplate-text plaque persists — known all-variant ref weakness, not C-specific |

Net: 4/5 hold cleanly; the one white drift re-drew black (confirms matrix's tendency basis); arc's
figural niches are the only genuine weakening, with the decisive black background intact. Lock stands.

## Deviation rationale
Plan.md Step 6 / Risk section pre-authorized a single re-draw to distinguish a lottery artifact from a
tendency if a C cell drifted to white. horyuji's first draw was white, so the re-draw was executed; it
returned black, confirming non-determinism rather than regression. The saved `horyuji-C-flash.png` is
the black re-draw. No other deviations.

## Files touched
- `benchmarks/temple-facade/conceptart.mjs` — default flip + header comment.
- `benchmarks/temple-facade/concepts/{taj,horyuji,chapelle,arc,mausoleum}-C-flash.png` — regenerated.
- `docs/knowledge/design-learnings.md` — journal section appended.
- `docs/active/work/T-016-01/*` — RDSPI artifacts.
No prompt/schema/client/`src/` change; no `npm run baml:gen`.

# T-089-01 durable-consolidation — Plan

Six steps, four commits. Each step has a verification command; no step depends on an unlanded sibling.
`spray-paint.mjs`, `value-select.mjs`, `surface-pattern.mjs`, and all of `src/` stay untouched.

## Step 0 — baseline (no commit)

- `npm test` → record the green count (expect ≥1027; T-090-01 may have moved it — whatever it is, it must
  not change under this ticket since no `src/` file is edited).
- `git log --oneline -3` to note any T-090 landings on `zone-fill.mjs`; re-read import symbols if so.
- Verify `renderViews` angle names for the oblique (135°-family) in `src/view/multi-angle.mjs`.

## Step 1 — the runner, cottage-first (commit 1)

Create `benchmarks/sculpture/durable-skin.mjs` per structure.md; add `skin:cottage` / `skin:gatehouse`
scripts; add the `.gitignore` stanza.

Implementation order inside the file (each chunk is independently smoke-testable with `node` on cottage):
1. Registry + input loading + AJV on the raw build.
2. Value-true stage (`substitutionFor`, `applySubstitution`, `mapPolicy`) + the **agreement assert** vs
   `value-select/cottage.json` — expect `{white_terracotta: sandstone, stone_bricks: tuff}`.
3. Seal → zones → zone-fill (substituted policy) — console lines must echo the T-085 shape
   (filled/kept per zone).
4. Splat stage (concept quantize against the **substituted** manifest + GLB side splat + zone-gated
   paintFace, splat palettes = secondaries only) + the per-face coverage fragments.
5. Legacy splat-only replay (substituted legacy palettes, sealed un-filled build) + its coverage/gate.
6. Pattern stage (course fill on roof dominant → salt strip) + terminal gates (plaster invariant,
   coverage-gate THROW, AJV) + double-execution + sha256 + record/md write.
7. Renders + strip composition + frame copies (best-effort, after the deterministic core is proven).

Verification:
- `npm run skin:cottage` exits 0; console shows: substitution agreement OK; fill ≈ T-085 magnitudes;
  splat-only gate REJECT / final gate PASS; `reproducible: true`; renders written or recorded errors.
- Expected coverage sanity (5-face census, substituted names): upper `sandstone` ≈ 0.7 (the T-085 0.712
  renamed), base `tuff` ≈ 0.62, roof `spruce_planks` ≈ 0.89. Material counts: plaster-successor
  (sandstone) count ≈ spray-paint's white_terracotta count; zero white_terracotta remaining.
- `npm run skin:cottage -- --offline` exits 0 against the just-written record.
- `npm test` unchanged-green.

Commit 1: `feat(E-24 T-089-01): durable-skin runner — end-to-end zone-fill→value-true→splat→pattern→gate`
(runner + package.json + .gitignore; cottage record NOT yet committed — records land with both subjects in
commit 2 after the gatehouse settles any registry tweak).

## Step 2 — gatehouse (commit 2)

1. Measure first: run `skin:gatehouse` up to the zoning console line (or a temporary `--inspect-zones`
   early-exit if needed — removed before commit); check `storeyDivide`/`upperTop`/floorLines against the
   8,076-placement build's actual eave/ridge. Adjust registry overrides only if the roof/upper boundary is
   visibly wrong (registry data + a named residual, not code).
2. Full `npm run skin:gatehouse`: watch the value-true rows (likely stone_bricks→tuff recurs;
   deepslate_tiles family unmeasured — accept whatever the floor/margin policy decides, it is recorded
   with true-ΔE both ways), the splat-only REJECT (the would-have-been E-23 baseline, labeled as such in
   the record note), the final PASS.
3. If the gatehouse coverage gate fails honestly (T-088 known limit), STOP and record: do not lower the
   threshold silently — diagnose whether it's zoning (fix via registry override) or a real policy gap
   (then the residual is named in the record + review.md, and the gate stays).
4. Both `--offline` asserts green; `npm test` unchanged-green.

Commit 2: `feat(E-24 T-089-01): cottage + gatehouse durable skins — records, artifacts, reproducibility
hashes` (both `durable-skin/<subj>.{json,md}` + `<subj>/artifact.json`).

## Step 3 — triptych refresh + frames (commit 3)

1. Edit `resemblance.mjs` SUBJECTS (cottage, gatehouse): `artifact` → `durable-skin/<subj>/artifact.json`,
   `committedRender` → `resemblance/<subj>-minecraft.png`.
2. `node benchmarks/sculpture/resemblance.mjs --subject cottage` then `--subject gatehouse` (live: GL
   render + ONE metered judge call each — the only metered calls in this ticket; evaluation, not build).
3. `node benchmarks/sculpture/resemblance.mjs --subject cottage --offline` (and gatehouse) — the re-pointed
   offline path must replay green against the refreshed renders.
4. Confirm `pr/assets/frames/durable-*` PNGs landed (from step 1/2 runs; re-run `skin:*` if the frames
   step was added after the records were generated).

Commit 3: `feat(E-24 T-089-01): refreshed triptychs on the durable skins + before/after frames`
(resemblance.mjs + refreshed `resemblance/{cottage,gatehouse}-*` + `pr/assets/frames/durable-*`).

## Step 4 — knowledge + handoff (commit 4)

1. Append "Durable high-quality results (E-24)" to `docs/knowledge/design-learnings.md`:
   - the zone-fill-vs-splat lesson (a splat cannot *establish* a dominant: 9–13% vs 71–77%);
   - value-true selection (hue-honest: a* drift killed, true-ΔE reported even when ~tied);
   - the coverage-aware gate (precondition, proof both ways — "looks the same" can't ship a bare wall);
   - the durable rule (the pipeline reproduces it: one named command, double-execution hash, no inline
     edits);
   - honest over/under-reach: 5-face census ≠ 6-dir exposure (T-090's oblique-roof finding — E-24's
     measurement boundary), bumps/ridge residual, side-by-construction, thin-sample roles unvalidated,
     per-zone threshold YAGNI, gatehouse-specific residuals from step 2.
2. Write `pr/assets/durable-skins.md` (E-12 handoff): narrative over the committed records, per-subject
   table (coverage splat-only→final, value-true switches, pattern deltas, gate verdicts, reproducibility
   hash), frame references, named residuals.
3. Final sweep: `npm test` green; `npm run skin:cottage -- --offline` + `skin:gatehouse -- --offline`
   green; `git status` clean of strays.

Commit 4: `docs(E-24 T-089-01): design-learnings E-24 section + E-12 durable-skins handoff`.

## Testing strategy

- **Unit**: none added (no `src/` change); the suite pins the cores; `npm test` must stay green at every
  commit boundary.
- **Deterministic integration**: double-execution equality inside every live run; sha256 recorded and
  re-checked by `--offline`; value-select agreement assert (cottage).
- **Live integration (GL)**: the two `skin:*` runs + the two resemblance refreshes; gates armed as throws,
  so a regression cannot write a record.
- **Visual**: triptychs + before/after frames are the human verdict (E-22 Rule 2); eyeball the cottage for
  the cream band and the gatehouse for grey-restored-not-collapsed before committing records.

## Acceptance-criteria map

| AC | Where satisfied |
|---|---|
| Single named script, end-to-end, no hand edits | Step 1 runner; commits 1–2 contain zero hand-edited artifacts |
| Reproducibility + determinism statement | double-run hash + record `reproducible`; no-LLM-on-path note in record + learnings |
| Cottage + gatehouse: dominants, value-true, coherent, gate PASS, residuals named | Steps 1–2 records (gates as throws); residuals in record notes + review.md |
| Refreshed triptychs + before/after vs E-23 splat-only | Step 3 + the in-run splat-only replay frames |
| design-learnings E-24 section | Step 4.1 |
| E-12 handoff + `npm test` green | Step 4.2–4.3 |

## Risk checkpoints

- After step 1.2: substitution disagreement with the committed record ⇒ bug in wiring, fix before
  proceeding (the cores are tested; divergence is mine).
- After step 2.1: gatehouse zoning pathology ⇒ registry override + named residual, never a core edit.
- Before commit 2: if T-090 has landed changes to `zone-fill.mjs`, re-read and re-run both subjects
  (imports are additive-stable so far; the re-read is the T-087 race lesson).
- Anywhere: a gate failure is a STOP-and-diagnose, not a threshold adjustment.

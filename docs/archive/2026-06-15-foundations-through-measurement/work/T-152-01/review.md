# T-152-01 — Review: render-every-loop

Handoff. The creation loop's render is now automatic and judge-free, "no GL" is a loud named
failure, the root cause of the prior "GL absent" reports is diagnosed and fixed-at-the-probe, and the
barn is re-rendered beside its concept through the de-frozen path. Self-assessment below.

## What changed (files)

**New**
- `src/view/render-beside.mjs` — the pure/injectable core. `GlUnavailableError` (named + remedy +
  `cause`), `assertGlAvailable(flags)` (the one authoritative GL consultation point),
  `composeBesideConcept` (pure RGBA, concept-first), `renderBesideConcept` (judge-free integrated
  path, injectable render seam + GL flags).
- `src/view/render-beside.test.mjs` — 6 GL-free unit tests.
- `benchmarks/sculpture/render-beside.mjs` — the `render:beside` CLI (judge-free, reads a committed
  artifact, asserts GL, writes the beside-concept sheet to `pr/assets/`).
- `pr/assets/frames/beside-concept-barn.png` — the AC4 proof (committed binary).

**Modified**
- `benchmarks/sculpture/generated-milestone.mjs` — `--skip-gate` now renders beside concept before
  returning; both render paths assert GL up-front.
- `benchmarks/sculpture/challenge-milestone.mjs` — assert GL once at the top of the render block.
- `package.json` — `render:beside` script.

**Commits:** `a3e33d8` (core+tests) → `5f96991` (CLI+script) → `bf2289b` (barn proof) →
`c08d0db` (chain wiring). Plus this docs commit.

## AC-by-AC

- **AC1 — auto render-beside-concept every creation run.** ✅ The generate/chain runner's judge-free
  `--skip-gate` path emits a textured 5-panel sheet (concept + 4 gate azimuths) to `pr/assets/`,
  reusing `renderViews` (the existing textured render) + `composeSheet`. No judge, no billed run.
  The `render:beside` CLI is the standalone equivalent. *Caveat:* on a *pinned* subject the
  `--skip-gate` chain throws `PinGuardError` at the artifact-persist step *before* the render — that
  guard is S-151's seam; the wire is correct and durable for unpinned/post-S-151 runs.
- **AC2 — "no GL" is a hard, surfaced failure.** ✅ `assertGlAvailable()` runs at the top of every
  render-bearing path (CLI, `--skip-gate`, gated, challenge render block) and throws a *named*
  `GlUnavailableError` carrying the underlying cause + the remedy. The silent
  `tryRenderAngle`/`sheets={error}` swallows no longer hide GL-absence.
- **AC3 — environment fix.** ✅ Root cause (verified live): `gl` is a dependency of the **nested
  `render/` project**, not the repo root. A probe from the repo cwd (`require('gl')`) returns
  `MODULE_NOT_FOUND` — a *false negative* — which is what the prior loops hit. GL was always present
  (`render/src` `GL_AVAILABLE: true`; `webgl.node` built). Fix = a single authoritative consultation
  point (`assertGlAvailable` imports the render module's probe, which resolves `gl` correctly); no
  binary needed. The error's remedy names the rebuild command for a genuine GL-less host.
- **AC4 — prove on the barn.** ✅ `pr/assets/frames/beside-concept-barn.png`, rendered from the
  T-150-01-fixed `generated/barn/artifact.json` through the judge-free CLI. Visually inspected;
  honest caption recorded (stone gable + overhang read; roof ragged/open, form squat, doors not yet
  legible).
- **AC5 — no judge; `npm test` green; no new ceremony.** ✅ No `spawnGate` anywhere; 2119 tests pass
  (stable ×3). One new core module + one CLI + a few call-site asserts — friction removed, not added
  (E-36 Rule 2).

## Test coverage

- **Unit (`npm test`, GL-free):** `assertGlAvailable` both branches incl. the named-error/remedy/cause
  surface; `composeBesideConcept` geometry (N+1 columns, concept leftmost), empty-list + dim-mismatch
  rejection; `renderBesideConcept` end-to-end via a fake seam (writes a correctly-sized PNG, touches
  no GPU); loud-fail short-circuit (seam never runs when the assert trips).
- **Live (manual, GL-gated):** the barn render — the real proof — exercised `renderViews` →
  `decodeImage` → `resampleRgba` → `composeSheet` → `encodeRgbaToPng` end-to-end with real GL.
- **Gaps (flagged):**
  - The two runner *wirings* (`generated-milestone`, `challenge-milestone`) are verified by
    `node --check` + the Step-4 proof that `renderBesideConcept` works, **not** by a full live chain
    (a live `generated:barn` run hits the pin-guard and would spend on the gated path). Acceptable:
    the wiring is a 3-line call to an already-tested function; a full chain test belongs with S-151's
    pin-guard narrowing.
  - No automated assertion that the *committed* barn sheet stays current if the barn artifact
    changes — it is a draft render (a lens), intentionally not pinned/measured.

## Open concerns / handoff notes

1. **Pin-guard ordering (S-151).** The `--skip-gate` render is wired but unreachable on a pinned
   subject because the artifact persist throws first. Once S-151 narrows the guard to the instrument
   allowlist, `npm run generated:barn -- --skip-gate` will render beside concept end-to-end with no
   flag. Until then the `render:beside` CLI is the reach-around (and the better UX anyway — one
   command, no chain).
2. **Workshop loop already renders** every round (not a defect site); a beside-concept variant there
   is a cheap future reuse (the concept buffer is already loaded) but out of scope.
3. **Concept letterboxing** — wide concepts are aspect-fit into the square panel with a white
   margin. Cosmetic; if a tighter crop is wanted later, `resampleRgba` already supports `"stretch"`.
4. **No Playwright/Chromium GL backend added** — deliberately. GL is present; adding a second backend
   is the heavy ceremony E-36 forbids. The `headless-canvas.mjs` seam documents that path if a real
   GL-less host ever needs it.

## Verdict

In scope, surgical, green. The loop can now see its own output, and a missing GL can no longer be
silently swallowed into a runbook. The barn sheet is the glance — rough, honestly captioned, and
*looked at*, which is the entire point of E-36 S-152.
</content>

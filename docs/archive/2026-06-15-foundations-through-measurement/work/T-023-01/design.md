# T-023-01 — Design: consolidation & reuse-hook decisions

Five decisions: how to encode the boundary check (D1), whether/how to de-dupe (D2), what the engine's
reuse contract is in writing (D3), where the journal/handoff text lives (D4), and what is explicitly
out of scope (D5). Each grounded in Research.

---

## D1 — How to prove "no Minecraft/project imports" (AC1)

**Options:**

1. **Documented import audit only** — a paragraph in the journal asserting `grep` found nothing.
   Cheap, but not a *check*; the AC says "a check/test … (e.g. a dependency assertion **or** a
   documented import audit)" so it is permitted, but it rots silently the moment someone edits cielab.
2. **A unit test that statically parses cielab.mjs's imports** and asserts none is relative or in a
   Minecraft/project denylist. Executable, runs in `npm test`, fails loudly if the boundary is ever
   breached. No new deps (read the file, regex the `import` lines).
3. **A bundler/`madge`-style transitive dependency-graph assertion.** Strongest, but pulls a new
   devDependency for a module that imports *nothing* — over-engineered.

**Decision: Option 2, plus a functional standalone-usage assertion.** A static-import-scan test
(`reuse-boundary.test.mjs`) is the right altitude: executable insurance, zero new deps, and it
encodes the exact rule the engine header promises. I add one *positive* test alongside it — import
`nearest` and run it against a hand-built `[{key, lab}]` palette with **no** block-table/Minecraft
import in the test's own module graph — which demonstrates the engine is usable standalone (the thing
E-09 relies on), not just that it lacks bad imports. Transitive coverage is free because cielab
imports nothing: if its own imports are clean, its whole subtree is.

**Scan rule.** Extract every specifier from `import … from "X"`, bare `import "X"`, and dynamic
`import("X")` in cielab.mjs. Fail if any specifier (a) is **relative** (`.`/`..` — would reach into
the project) or (b) matches a **Minecraft/asset denylist** (`minecraft-data`, `minecraft-assets`,
`prismarine-*`, `mineflayer`, `node-minecraft-*`). Node builtins (`node:*`) and genuinely-portable
math packages would be allowed — but cielab currently has **zero** imports, so the assertion also
records that the specifier set is empty today. Encoding the *rule* (not just "length 0") means the
test still guards correctly if a legitimate `node:` import is ever added.

---

## D2 — The de-dupe: delegate, don't delete

block-table.mjs owns a second `srgbToLab`. The DUPLICATION NOTE names **this ticket** as the de-dupe.

**Options:**

1. **Leave it.** Honors "consolidation" only in docs. Rejected — the note explicitly says downstream
   should depend on cielab; leaving two copies of color-space math is the exact drift S-023 exists to
   stop, and a future edit to one matrix and not the other is a latent bug.
2. **block-table re-exports cielab's `srgbToLab` unchanged.** Removes duplication, but **changes
   output** — cielab does not round, block-table's contract (and the committed JSON) is 3-decimal.
   Rejected: would dirty the table / break the round-trip read of rounded values.
3. **block-table imports cielab's conversion and re-applies `round3`** at its own boundary, keeping
   its exported `srgbToLab` signature and rounded output identical. Deletes the duplicated math
   (inverse gamma, matrix, D65, fLab) but preserves block-table's rounding contract.

**Decision: Option 3.** It is the only option that both removes the duplication *and* is provably
output-preserving (Research measured max-abs-diff **0** over 4096 triples between current
`block-table.srgbToLab` and `round3(cielab.srgbToLab)`). The committed `block-lab-table.json` stays
byte-identical (no rebuild, no `minecraft-assets` needed); `block-table.test.mjs`'s band assertions
stay green. The dependency arrow points the correct way (table → engine), which the AC1 test then
locks in (cielab still imports nothing; only block-table gains an import of cielab).

**What gets deleted from block-table.mjs:** the private `srgbChannelToLinear`, `linearRgbToXyz`,
`D65`/`DELTA`/`DELTA3`/`fLab` constants, and the body of `srgbToLab`. **What stays:** the exported
`srgbToLab` name (callers/tests unaffected), `round3` (still used to keep the contract), and the
build/runtime code. The DUPLICATION NOTE is rewritten as a "consolidated" note pointing at cielab.

---

## D3 — Stating the reuse contract in code

The engine header already states the boundary in prose. AC1's test makes it *enforced*. The
remaining gap is a single, citable **contract** the E-09 author reads. 

**Decision:** put the contract where it is already half-written — extend `cielab.mjs`'s header with
one explicit line naming E-09's voxelizer as the third consumer (today it names the two 2-D points),
and let the test file's top comment cross-reference it. No new doc file; the engine header is the
canonical place and is already injected via module proximity. This keeps one source of truth and
avoids a contract doc drifting from the code.

---

## D4 — Where the journal + handoff text lives (AC2, AC3)

**Decision:** both go in `docs/knowledge/design-learnings.md`, appended after the two existing E-10
worked examples, as **one new H2 section** "`## E-10 — color-layer consolidation + E-09 reuse hook
(S-023)`". It contains:

- **What the color layer delivers** — canonical palette extraction (S-021) + real-block grounding
  (S-022) over the S-019 table and the S-020 engine.
- **The conversion / ΔE / clustering choices** — sRGB→Lab D65, CIE76 (pluggable to CIEDE2000),
  median-cut in Lab with the count×range split, background-as-tolerance.
- **The extracted-vs-declared finding** — taj-C honored ~1/43 neoclassical blocks (correct: the Taj
  isn't neoclassical); the metric, not a verdict.
- **The reuse boundary statement** — cielab is the portable voxelizer color core; enforced by the
  AC1 test.
- **The E-09 stage-4 handoff paragraph (AC3)** — voxel surface color → `nearest()` over the design's
  palette → `DesignArtifact` placement.

`src/README.md` gets a short consolidation note under the color layer (boundary + de-dupe), because
that is the developer-facing index; the knowledge file is the forward-feeding journal.

Rejected: a standalone `docs/active/work/T-023-01/handoff.md`. The ACs target `design-learnings.md`
(injected into agent context); a buried work file would not feed forward to E-09.

---

## D5 — Out of scope (held firm)

- **No CIEDE2000.** The `metric` seam is already pluggable; adding it is a different ticket.
- **No k-means clusterer.** Median-cut's dyadic coverage is a documented known; the seam is open.
- **No E-09 code.** This ticket *confirms the hook*; it does not build the voxelizer.
- **No table rebuild.** The de-dupe is output-preserving by construction; rebuilding would need
  `minecraft-assets` and risks a spurious diff.
- **No change to palette-extract / image-grid.** They already import cielab correctly; the only code
  edit is block-table's de-dupe + the new test.

## Net shape of the change

One new test file (boundary + standalone-usage), one focused refactor (block-table delegates
conversion to cielab, output byte-identical), two doc edits (knowledge journal + README), one header
line (E-09 named as consumer). Small, low-risk, and exactly the "consolidate + confirm the hook"
the ticket asks for.

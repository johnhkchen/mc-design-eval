# Pin-rotation policy (T-119-01, E-30 — binding)

Committed verdict/record pins are load-bearing: instrument-diffs, epic tables, and head-to-head
baselines cite them by content. Two T-116 incidents (a reskin that silently re-ran the judge; a
swallowed `--` that live-swept three kit pins) proved vigilance is not protection. This policy is
short, binding, and citable; the pin-guard (`src/form/pin-guard.mjs`) and its conformance sweep
enforce it structurally.

## 1. What a pin is

A pin is a **git-tracked `.json`/`.md` record on the INSTRUMENT ALLOWLIST** — the one named place,
`src/form/pin-guard.mjs` `INSTRUMENT_ALLOWLIST` (`isInstrumentPath`): **judge verdict records**
(`benchmarks/sculpture/multi-angle/`), **ratified packs of record** (`packs/*.json`, never
`packs/drafts/*`), committed **baseline/milestone measurements** (the `-baseline(s)`/`-milestone`
records), the ratified **kit vocabulary** (`benchmarks/sculpture/kit/` — an input-of-record to every
committed verdict; frozen under the E-36 honesty clause), and the **`retired-pins.json`** registry.
A path freezes only when it is on this list **and** committed.

Updated by **E-36 / S-151** ("defreeze the creation loop"): pin-guard fires on the instrument
allowlist, **not** on "tracked-in-git." **Draft creation artifacts are NOT pins and regenerate
freely with no flag** — `generated/*` (incl. the `generated/<key>/{base,grammar,artifact,
component-plan}.json` chain intermediates and the `generated/<key>.json` milestone record),
`workshop/*` ledgers + final-artifacts that are not yet the subject of a committed verdict,
`recognition/*` programs, and the styled/challenge/reconstructed/zone-map/component-skin/durable-skin
build records. The dividing line: **frozen once MEASURED; draft until then.** A draft that is later
proven load-bearing for a committed measurement joins the allowlist with its reason recorded (the
kit is the standing example) — case by case, never a blanket re-freeze. Renders (PNGs, sheets,
triptychs) are **never** pins: GL bytes are evidence, not decisions (E-24/E-28).

## 2. The rotation rule

A pin's bytes change **only** inside a ticket that **explicitly owns** that record, and only
through an invocation carrying `--rotate-pins` (after `--`; a flag swallowed by npm never
arrives, and the run refuses — fail closed). The commit that lands a rotation **names the retired
pin** and why it was superseded.

Verdicts specifically: **one judge run per view.** A verdict, once committed, is the canonical
result — re-running the judge and adopting fresher verdicts is the re-roll E-28 Rule 4 forbids
(the T-116 re-cut showed same-object holds flip at the budget edge). T-114 governs **malformed
replies only**: `gate:rejudge` completes a committed record's `unparsed` views and is the one
sanctioned in-place verdict write; it never re-asks a parsed verdict.

## 3. What is always sanctioned (no flag needed)

- **Byte-identical rewrites** — the determinism flows (`zone:map` regeneration, `kit-extract
  --offline`, `--repro` double-runs) rewrite committed bytes on purpose; the guard passes them.
- **First derivations** — untracked paths write freely; a new subject's records are never blocked.
- **Read-only distillation** (`--distill-only` on `component-skin.mjs`, precedent
  `reconstructed-milestone.mjs`) — rebuilding a *summary* record from committed outputs through a
  path where the judge seam is **absent by construction** (pure `src/form/component-skin-distill.mjs`;
  import-graph-asserted). Distillation cites committed verdicts; it never creates one. Writing
  the distilled record still goes through the guard: byte-identical proves the pins in sync,
  differing bytes are a rotation and need the flag plus an owning ticket.
- **`gate:rejudge`** — the T-114 completion, under its own refusals (artifact-pin match,
  unparsed-views-only).

## 4. Enforcement

- `guardedWriteRecord` wraps every record write in the nine pin-writing runners (conformance
  sweep: `src/form/pin-guard.conformance.test.mjs` — closed list, banned raw-write idioms).
- `preflightPins` runs **before any spend**: kit-extract before its first model call,
  the multi-angle gate before any judge call — a refused run costs nothing.
- Refusals name the pin, the reason, and this document.

## 5. Rotation procedure (checklist)

1. A ticket whose AC names the records to be rotated (this is what "owns" means).
2. If verdicts are involved: a deliberate fresh judge run is a NEW record/label or an explicitly
   recorded supersession — never a silent overwrite; the old verdicts stay citable in history.
3. Run the rotating command with `-- --rotate-pins`; the guard logs each rotated pin.
4. Commit message names every retired pin and the superseding evidence.

## 6. Disposition record — T-111 residual 4 (decided here)

- **The styled verdict pins** (`styled/*`, `multi-angle/*-styled.json`) are **RETAINED as
  canonical**: they are the once-judged verdicts; no verdict-owning rerun is warranted (the
  T-116 re-cut demonstrated budget-edge flap, and E-30 owns generalization, not verdicts).
- **The reskin summary records** (`component-skin/{cottage,gatehouse,church}.json`) were found
  stale against the *current committed* milestone records (T-106-era distillations of superseded
  chains — church even recorded `pipeline-failed` for a chain that now completes). They are
  **ROTATED by an explicit, recorded act**: `--distill-only --rotate-pins`, judge-free, citing
  only committed verdicts. No re-roll occurred; nothing was silent. Residual 4 is **CLOSED**.

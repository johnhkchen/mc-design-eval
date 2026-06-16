# T-170-01 Plan — emit-typed-kind-from-layer-a

Ordered, independently-verifiable steps. Each is small enough to commit atomically. Verification
criterion stated per step. The gate is `npm test` green with the frozen instrument + transport-guard
untouched.

## Step 1 — Add `kind` to the schema + the prompt tagging line

- `baml_src/department.baml`: add `kind "add" | "replace" | "remove" @description(...)` between
  `missing` and `severity` in `class CritiqueItem`; add the one tagging sentence to the
  `DiagnoseBuild` prompt's per-item paragraph.
- **Verify:** `npm run baml:gen` succeeds (BAML client regenerates without schema error). Grep the
  generated client or just confirm the command exits 0.
- Commit boundary: schema + prompt only (no fixtures yet) — tests will be RED here (golden +
  expected drift), so commit AFTER step 3+4 land them green, OR commit steps 1-5 together. Prefer:
  one commit for the whole coherent change (schema+prompt+golden+fixtures+test) since they are
  mutually dependent and a half-state is never green.

## Step 2 — Regenerate the diagnose golden

- After `baml:gen`, render `DiagnoseBuild` with `src/baml/fixtures/diagnose/inputs.json` through
  `bamlRender` and write the result to `src/baml/fixtures/diagnose/prompt.golden.txt`.
- One-off driver (no permanent script): a `node --input-type=module` invocation importing
  `bamlRender` from `src/baml/bridge.mjs`, reading `inputs.json`, writing the `.prompt` output.
- **Verify:** `diff` the new golden against the old — the ONLY changes are (a) the new tagging
  sentence, (b) the `kind` line in the `{{ ctx.output_format }}` schema dump. No other drift. If
  anything else moved, stop and investigate (scope leak).

## Step 3 — Update the diagnose fixtures (reply + expected)

- `diagnose/reply.txt`: add `"kind"` to each item — ROOF `replace`, WALL `add`, OPENING `add`.
- `diagnose/expected.json`: add the same `"kind"` to each item.
- **Verify:** the JSON is well-formed (`node -e` parse or `jq`); keys match Decision 4.

## Step 4 — Update the critique-contract fixtures (reply + expected)

- `critique-contract/reply.txt`: add `"kind"` to each item — ROOF `replace`, WALL `add`,
  OPENING `add`.
- `critique-contract/expected.json`: add the same `"kind"`.
- Leave `reply-bad-department.txt` untouched.
- **Verify:** well-formed JSON; CC1's expected matches.

## Step 5 — Strengthen FX-DB2 with the kind assertion

- `src/baml/fixtures.test.mjs`: in FX-DB2, import `itemStyleClass` from
  `../workshop/bakeoff-score.mjs`; assert each parsed item's `kind` ∈ `{add,replace,remove}`; assert
  the WALL item's `kind === "add"` (the BO11 shape, NOT `replace`); assert
  `itemStyleClass(wallItem) === "absent"` (the tag un-caps).
- **Verify:** the new assertions reference the actual parsed shape (WALL is items[1] in the canonical
  reply; key on `department === "WALL"` rather than index to be robust).

## Step 6 — Full test run (the gate)

- `npm test` (runs `baml:gen` via pretest, then the whole `*.test.mjs` suite).
- **Verify ALL of:**
  - **FX-DB1** green — golden byte-matches the regenerated render.
  - **FX-DB2** green — parse matches expected.json AND the new kind/itemStyleClass assertions hold.
  - **CC1** green — critique-contract parse matches expected.json with `kind`.
  - **CC2** green — bad-department still drops to `{items:[]}` (no `kind`-driven regression).
  - **CC3** green — prose still rejects.
  - **BO8 / BO11** green, UNCHANGED — the scoring core already reads `kind`; no edit there.
  - **transport-guard** green — `department.baml` change carries no gate vocabulary.
  - **departments DPT3** green — enum mirror unaffected.
  - Total test count moves only by the assertions added in FX-DB2 (no test deletions).

## Step 7 — Commit

- One atomic commit (the change is mutually dependent; no green half-state exists between steps 1
  and 5). Message: `feat(T-170-01): emit typed kind on CritiqueItem (Layer A) + re-pin golden`,
  noting the deliberate `DiagnoseBuild` golden re-pin and that the scoring core was already wired.
- Body references E-41 / S-170 and the blueprint `T-168-01/schema-feedback.md`.
- Pin-guard note: the diagnose golden + fixtures are tracked records; this commit is the **owning
  ticket's** deliberate re-pin (no `--rotate-pins` flag needed — these edits go through git, not the
  guarded mint-writer; the guard only bites the live mint path).

## Testing strategy summary

- **Unit (pure, already exist):** BO8/BO11 in `bakeoff-score.test.mjs` encode the `kind` → class
  mapping and the BO11 correction. They are the regression net for the scoring half; this ticket
  must leave them green and untouched.
- **Contract/parse (fixtures):** FX-DB2 + CC1 prove `kind` round-trips through `b.parse`; FX-DB1
  proves the prompt golden is the honest render; CC2/CC3 prove no leniency/rejection regression.
- **Render (golden):** FX-DB1 is the deliberate re-pin — the one intended behaviour change visible
  as a byte diff, scoped to the two regions in Step 2's verify.
- **Live separability (OUT OF SCOPE):** whether a real judge reliably emits the right `kind` is
  T-170-02's corpus run. This ticket proves only that the contract carries it and the canonical
  fixtures demonstrate the discriminator. The falsifiable claim's "fails if the judge can't
  separate" clause is answered by T-170-02, not here — flagged in review.

## Rollback / risk

- If `baml:gen` rejects the inline union in this position, fall back to declaring `kind` last (after
  `severity`) — observable only in golden field order, re-run Step 2. (Low risk: `severity` is
  already an inline union in the same class.)
- If `b.parse` mis-handles a required union (CC2 changes, FX-DB2 vacuity guard trips), do NOT loosen
  to optional silently — capture the behaviour, report in review, and decide (the design's
  documented fallback is optional + structural, but that is a reported decision, not a quiet patch).

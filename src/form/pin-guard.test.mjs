// pin-guard unit tests (T-119-01). Groups:
//   A — decidePinWrite decision matrix
//   B — refusal message contents
//   C — preflightPins, incl. THE REGRESSION FIXTURE: the verbatim swallowed-`--` kit sweep
//   D — guardedWriteRecord against a synthetic pin (tmpdir + injected tracked set; no real git)
//   E — loadTrackedSet / isTracked (fail-closed null set; repo smoke)
//   F — domain refusal (T-126-01): workshop writes can never touch gate records

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ROTATE_FLAG, POLICY_DOC, PinGuardError,
  decidePinWrite, refusalMessage, preflightPins,
  loadTrackedSet, isTracked, guardedWriteRecord,
  GATE_RECORD_NAMESPACES, domainRefusal,
  INSTRUMENT_ALLOWLIST, isInstrumentPath,
} from "./pin-guard.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// --- A: decision matrix ---------------------------------------------------------------------------

test("A1 unfrozen path writes freely (first derivations / drafts are never blocked)", () => {
  const d = decidePinWrite({ frozen: false, exists: false, nextContent: "x" });
  assert.equal(d.action, "write");
  const d2 = decidePinWrite({ frozen: false, exists: true, currentContent: "old", nextContent: "x" });
  assert.equal(d2.action, "write");
});

test("A2 byte-identical rewrite of a committed pin always passes (determinism flows)", () => {
  const d = decidePinWrite({ frozen: true, exists: true, currentContent: "same", nextContent: "same" });
  assert.equal(d.action, "skip-identical");
});

test("A3 differing write to a committed pin REFUSES without the flag", () => {
  const d = decidePinWrite({ frozen: true, exists: true, currentContent: "old", nextContent: "new" });
  assert.equal(d.action, "refuse");
  assert.match(d.reason, /committed pin/);
});

test("A4 the explicit flag rotates", () => {
  const d = decidePinWrite({ frozen: true, exists: true, currentContent: "old", nextContent: "new", rotate: true });
  assert.equal(d.action, "write");
  assert.match(d.reason, /rotation/);
});

test("A5 frozen-but-deleted pin refuses without the flag (restore is explicit too)", () => {
  const d = decidePinWrite({ frozen: true, exists: false, nextContent: "new" });
  assert.equal(d.action, "refuse");
  const d2 = decidePinWrite({ frozen: true, exists: false, nextContent: "new", rotate: true });
  assert.equal(d2.action, "write");
});

test("A6 flag-swallow fails CLOSED: rotate undefined behaves as refuse", () => {
  // `npm run gate:multi --rotate-pins` (missing --): the flag never reaches argv → rotate is
  // simply absent. The guard must refuse, not sweep.
  const d = decidePinWrite({ frozen: true, exists: true, currentContent: "old", nextContent: "new", rotate: undefined });
  assert.equal(d.action, "refuse");
});

// --- B: refusal message ---------------------------------------------------------------------------

test("B1 refusal names the pin, the reason, the flag, and the policy doc", () => {
  const msg = refusalMessage({ rel: "benchmarks/sculpture/kit/cottage.json", reason: "would overwrite the committed pin with different bytes" });
  assert.match(msg, /kit\/cottage\.json/);
  assert.match(msg, /would overwrite the committed pin/);
  assert.ok(msg.includes(ROTATE_FLAG));
  assert.ok(msg.includes(POLICY_DOC));
});

// --- C: preflight + THE REGRESSION FIXTURE --------------------------------------------------------

/** The verbatim incident shape: `npm run kit:extract --subject=barn` — npm swallows the flag, so
 *  no subject filter survives and the live sweep targets every subject's kit pins. */
const SWEPT_KIT_PINS = ["cottage", "gatehouse", "church", "barn"].flatMap((k) => [
  { rel: `benchmarks/sculpture/kit/${k}.json`, tracked: true },
  { rel: `benchmarks/sculpture/kit/${k}.raw.json`, tracked: true },
  { rel: `benchmarks/sculpture/kit/${k}.md`, tracked: true },
]);

test("C1 REGRESSION FIXTURE: the swallowed-flag kit sweep refuses loudly, naming every pin", () => {
  let err = null;
  try {
    preflightPins({ pins: SWEPT_KIT_PINS, rotate: false, intent: "live kit extraction sweep" });
  } catch (e) { err = e; }
  assert.ok(err instanceof PinGuardError, "preflight must throw PinGuardError");
  assert.equal(err.pins.length, 12);
  for (const k of ["cottage", "gatehouse", "church", "barn"]) {
    assert.match(err.message, new RegExp(`kit/${k}\\.raw\\.json`));
  }
  assert.match(err.message, /live kit extraction sweep/);
  assert.ok(err.message.includes(ROTATE_FLAG));
  assert.ok(err.message.includes(POLICY_DOC));
});

test("C2 preflight passes a run that targets no committed pin (new subject's first kit)", () => {
  const out = preflightPins({
    pins: [{ rel: "benchmarks/sculpture/kit/windmill.json", tracked: false }],
    rotate: false,
  });
  assert.deepEqual(out, { refused: [], rotating: [] });
});

test("C3 preflight with the flag returns the rotation ledger instead of throwing", () => {
  const out = preflightPins({ pins: SWEPT_KIT_PINS.slice(0, 3), rotate: true });
  assert.equal(out.rotating.length, 3);
  assert.equal(out.refused.length, 0);
});

test("C4 preflight flag-swallow fails CLOSED (rotate undefined refuses)", () => {
  assert.throws(() => preflightPins({ pins: SWEPT_KIT_PINS, rotate: undefined }), PinGuardError);
});

// --- D: guardedWriteRecord on a synthetic pin -----------------------------------------------------

test("D guardedWriteRecord: write / skip-identical / refuse / rotate / sanction on a tmpdir pin", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pin-guard-"));
  try {
    // The synthetic committed pin must be an INSTRUMENT path (frozen = allowlist ∧ tracked).
    // "my-baseline.json" matches the baseline/milestone suffix rule and stays flat (no nested dir).
    const trackedSet = new Set(["my-baseline.json"]); // the synthetic committed instrument pin
    await writeFile(join(dir, "my-baseline.json"), "{\"v\":1}\n");

    // D1 untracked sibling writes freely
    const w = await guardedWriteRecord({ root: dir, rel: "fresh.json", content: "{}\n", trackedSet });
    assert.equal(w.action, "write");
    assert.equal(await readFile(join(dir, "fresh.json"), "utf8"), "{}\n");

    // D2 byte-identical rewrite passes, pin untouched
    const s = await guardedWriteRecord({ root: dir, rel: "my-baseline.json", content: "{\"v\":1}\n", trackedSet });
    assert.equal(s.action, "skip-identical");

    // D3 differing write refuses; the pin's bytes survive
    await assert.rejects(
      () => guardedWriteRecord({ root: dir, rel: "my-baseline.json", content: "{\"v\":2}\n", trackedSet }),
      (e) => e instanceof PinGuardError && /my-baseline\.json/.test(e.message) && e.message.includes(ROTATE_FLAG),
    );
    assert.equal(await readFile(join(dir, "my-baseline.json"), "utf8"), "{\"v\":1}\n");

    // D4 explicit rotation writes
    const r = await guardedWriteRecord({ root: dir, rel: "my-baseline.json", content: "{\"v\":2}\n", rotate: true, trackedSet });
    assert.equal(r.action, "write");
    assert.equal(await readFile(join(dir, "my-baseline.json"), "utf8"), "{\"v\":2}\n");

    // D5 a named sanction permits like the flag (the T-114 rejudge completion shape)
    const j = await guardedWriteRecord({
      root: dir, rel: "my-baseline.json", content: "{\"v\":3}\n",
      sanction: "rejudge (T-114 reply completion)", trackedSet,
    });
    assert.equal(j.action, "write");

    // D6 tracked-but-deleted refuses without the flag
    await rm(join(dir, "my-baseline.json"));
    await assert.rejects(
      () => guardedWriteRecord({ root: dir, rel: "my-baseline.json", content: "{}\n", trackedSet }),
      PinGuardError,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// --- E: tracked-set IO ----------------------------------------------------------------------------

test("E1 null tracked set fails CLOSED: an instrument path reads as tracked → frozen", () => {
  assert.equal(isTracked(null, "anything/at/all.json"), true);
  // fail-closed only freezes when the path is ALSO on the allowlist (retired-pins here)
  const rel = "benchmarks/sculpture/retired-pins.json";
  const d = decidePinWrite({ frozen: isInstrumentPath(rel) && isTracked(null, rel), exists: true, currentContent: "a", nextContent: "b" });
  assert.equal(d.action, "refuse");
});

test("E2 loadTrackedSet smoke on the real repo (cached, contains package.json)", () => {
  const set = loadTrackedSet(ROOT);
  assert.ok(set instanceof Set && set.has("package.json"));
  assert.equal(loadTrackedSet(ROOT), set); // cache hit, same instance
});

// --- F: domain refusal — judge isolation (T-126-01) ------------------------------------------------

const GATE_REL = "benchmarks/sculpture/multi-angle/cottage-styled.json";

test("F1 domainRefusal: workshop into a gate namespace refuses; everything else is null", () => {
  assert.match(domainRefusal("workshop", GATE_REL), /structurally isolated from the frozen judge/);
  assert.equal(domainRefusal("workshop", "benchmarks/sculpture/workshop/fixture.json"), null);
  assert.equal(domainRefusal(null, GATE_REL), null);
  assert.equal(domainRefusal(undefined, GATE_REL), null);
  assert.equal(domainRefusal("gate", GATE_REL), null);
  assert.ok(GATE_RECORD_NAMESPACES.includes("benchmarks/sculpture/multi-angle/"));
});

test("F2 guardedWriteRecord: workshop-domain gate write THROWS — rotate and sanction do NOT override", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pin-guard-dom-"));
  try {
    const trackedSet = new Set(); // even an UNTRACKED gate path refuses: isolation, not pin rotation
    for (const opts of [{}, { rotate: true }, { sanction: "any named sanction" }]) {
      await assert.rejects(
        () => guardedWriteRecord({ root: dir, rel: GATE_REL, content: "{}\n", trackedSet, domain: "workshop", ...opts }),
        (e) => e instanceof PinGuardError && /frozen judge/.test(e.message),
      );
    }
    // same rel without the workshop domain behaves exactly as before (untracked → writes freely)
    await writeFile(join(dir, "ok.json"), ""); // ensure dir usable
    const w = await guardedWriteRecord({ root: dir, rel: "ok.json", content: "{}\n", trackedSet });
    assert.equal(w.action, "write");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("F3 preflightPins: workshop-domain gate pin refuses even with rotate; clean workshop pins pass", () => {
  assert.throws(
    () => preflightPins({ pins: [{ rel: GATE_REL, tracked: false }], rotate: true, domain: "workshop", intent: "workshop run" }),
    (e) => e instanceof PinGuardError && /judge-isolation boundary/.test(e.message) && /workshop run/.test(e.message),
  );
  const out = preflightPins({
    pins: [{ rel: "benchmarks/sculpture/workshop/fixture.json", tracked: false }],
    rotate: false,
    domain: "workshop",
  });
  assert.deepEqual(out, { refused: [], rotating: [] });
});

test("F4 nested gate-record write under workshop domain refuses (prefix, not exact-dir match)", () => {
  assert.match(domainRefusal("workshop", "benchmarks/sculpture/multi-angle/sub/dir/x.md"), /frozen judge/);
});

// --- G: instrument allowlist — the E-36 / S-151 freeze-narrowing -----------------------------------

test("G1 isInstrumentPath: the measurements/ prefix + ratified packs freeze; drafts are not", () => {
  // ON the allowlist — the measurements/ frozen home (T-155-01: location encodes status)
  for (const rel of [
    "measurements/multi-angle/cottage-styled.json",
    "measurements/multi-angle/cottage-styled.md",
    "measurements/kit/barn.json",
    "measurements/kit/barn.raw.json",
    "measurements/retired-pins.json",
    "measurements/pattern-book/facade-baselines.json",
    "measurements/pattern-book/proportion-milestone.json",
    "measurements/milestones/facade-milestone.md",
    "measurements/cleanliness-baseline.json",
    "packs/rustic.json",
  ]) assert.equal(isInstrumentPath(rel), true, `expected INSTRUMENT: ${rel}`);

  // ON the allowlist (TRANSITIONAL — pre-move scattered frozen locations; removed once every class
  // has relocated under measurements/). These keep the freeze intact mid-migration.
  for (const rel of [
    "benchmarks/sculpture/multi-angle/cottage-styled.json",
    "benchmarks/sculpture/kit/barn.json",
    "benchmarks/sculpture/retired-pins.json",
    "benchmarks/sculpture/pattern-book/facade-baselines.json",
    "benchmarks/sculpture/cleanliness-baseline.json",
  ]) assert.equal(isInstrumentPath(rel), true, `expected TRANSITIONAL INSTRUMENT: ${rel}`);

  // OFF the allowlist (drafts — regenerate freely), including the new builds/ free-zone home
  for (const rel of [
    "builds/cottage/final-artifact.json",
    "builds/cottage/ledger.json",
    "builds/barn--saltcrag/seed-artifact.json",
    "benchmarks/sculpture/generated/barn.json",
    "benchmarks/sculpture/generated/barn/artifact.json",
    "benchmarks/sculpture/generated/barn/base-artifact.json",
    "benchmarks/sculpture/generated/barn/component-plan.json",
    "benchmarks/sculpture/generated/barn/grammar-artifact.json",
    "packs/drafts/rustic-rederived/draft.json",
    "packs/README.md",
    "benchmarks/sculpture/workshop/barn.json",
    "benchmarks/sculpture/recognition/barn.program.json",
    "benchmarks/sculpture/styled/cottage.json",
    "benchmarks/sculpture/zone-map/barn.json",
  ]) assert.equal(isInstrumentPath(rel), false, `expected DRAFT: ${rel}`);

  // every allowlist entry carries a reason (the documented "one place")
  for (const e of INSTRUMENT_ALLOWLIST) assert.ok(typeof e.reason === "string" && e.reason.length > 0);
});

test("G2 AC2 core: a TRACKED draft write is FREE (no flag) — the barn-regen bug fixed", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pin-guard-draft-"));
  try {
    const rel = "benchmarks/sculpture/generated/barn/artifact.json";
    const trackedSet = new Set([rel]); // committed, but a DRAFT (not on the allowlist)
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(dir, "benchmarks/sculpture/generated/barn"), { recursive: true });
    await writeFile(join(dir, rel), "{\"v\":1}\n"); // the committed-bad draft on disk
    // even though it is tracked, differing bytes write freely — no PinGuardError, no --rotate-pins
    const w = await guardedWriteRecord({ root: dir, rel, content: "{\"v\":2}\n", trackedSet });
    assert.equal(w.action, "write");
    assert.equal(await readFile(join(dir, rel), "utf8"), "{\"v\":2}\n");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("G3 AC2: preflight of a tracked-draft run does not throw (returns empty ledger)", () => {
  const out = preflightPins({
    pins: [
      { rel: "benchmarks/sculpture/generated/barn/artifact.json", tracked: true },
      { rel: "benchmarks/sculpture/generated/barn/component-plan.json", tracked: true },
      { rel: "benchmarks/sculpture/generated/barn.json", tracked: true },
    ],
    rotate: false,
    intent: "generated:barn --skip-gate",
  });
  assert.deepEqual(out, { refused: [], rotating: [] });
});

test("G4 AC3: a TRACKED instrument write still REFUSES without the flag (guardedWriteRecord)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pin-guard-instr-"));
  try {
    const rel = "benchmarks/sculpture/multi-angle/cottage-styled.json";
    const trackedSet = new Set([rel]);
    // create the on-disk pin so `exists` is true (the verdict bytes)
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(dir, "benchmarks/sculpture/multi-angle"), { recursive: true });
    await writeFile(join(dir, rel), "{\"verdict\":\"pass\"}\n");
    await assert.rejects(
      () => guardedWriteRecord({ root: dir, rel, content: "{\"verdict\":\"FAIL\"}\n", trackedSet }),
      (e) => e instanceof PinGuardError && /multi-angle/.test(e.message) && e.message.includes(ROTATE_FLAG),
    );
    assert.equal(await readFile(join(dir, rel), "utf8"), "{\"verdict\":\"pass\"}\n"); // bytes survive
    // with the flag, it rotates
    const r = await guardedWriteRecord({ root: dir, rel, content: "{\"verdict\":\"FAIL\"}\n", rotate: true, trackedSet });
    assert.equal(r.action, "write");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("G5 AC3: the frozen set refuses in preflight — verdict, pack, baseline, retired-pins", () => {
  for (const rel of [
    "benchmarks/sculpture/multi-angle/cottage-styled.json",
    "packs/rustic.json",
    "benchmarks/sculpture/pattern-book/proportion-baselines.json",
    "benchmarks/sculpture/retired-pins.json",
  ]) {
    assert.throws(
      () => preflightPins({ pins: [{ rel, tracked: true }], rotate: false, intent: `live ${rel}` }),
      (e) => e instanceof PinGuardError && e.message.includes(rel) && e.message.includes(ROTATE_FLAG),
      `expected ${rel} to refuse`,
    );
    // the flag turns the refusal into a rotation ledger (instrument contract: explicit rotation)
    const out = preflightPins({ pins: [{ rel, tracked: true }], rotate: true });
    assert.deepEqual(out.rotating, [rel]);
  }
});

test("G6 decidePinWrite honors the `frozen` rename: false ⇒ write, true+differ ⇒ refuse", () => {
  assert.equal(decidePinWrite({ frozen: false, exists: true, currentContent: "a", nextContent: "b" }).action, "write");
  assert.equal(decidePinWrite({ frozen: true, exists: true, currentContent: "a", nextContent: "b" }).action, "refuse");
});

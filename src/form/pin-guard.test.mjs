// pin-guard unit tests (T-119-01). Groups:
//   A — decidePinWrite decision matrix
//   B — refusal message contents
//   C — preflightPins, incl. THE REGRESSION FIXTURE: the verbatim swallowed-`--` kit sweep
//   D — guardedWriteRecord against a synthetic pin (tmpdir + injected tracked set; no real git)
//   E — loadTrackedSet / isTracked (fail-closed null set; repo smoke)

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
} from "./pin-guard.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

// --- A: decision matrix ---------------------------------------------------------------------------

test("A1 untracked path writes freely (first derivations are never blocked)", () => {
  const d = decidePinWrite({ tracked: false, exists: false, nextContent: "x" });
  assert.equal(d.action, "write");
  const d2 = decidePinWrite({ tracked: false, exists: true, currentContent: "old", nextContent: "x" });
  assert.equal(d2.action, "write");
});

test("A2 byte-identical rewrite of a committed pin always passes (determinism flows)", () => {
  const d = decidePinWrite({ tracked: true, exists: true, currentContent: "same", nextContent: "same" });
  assert.equal(d.action, "skip-identical");
});

test("A3 differing write to a committed pin REFUSES without the flag", () => {
  const d = decidePinWrite({ tracked: true, exists: true, currentContent: "old", nextContent: "new" });
  assert.equal(d.action, "refuse");
  assert.match(d.reason, /committed pin/);
});

test("A4 the explicit flag rotates", () => {
  const d = decidePinWrite({ tracked: true, exists: true, currentContent: "old", nextContent: "new", rotate: true });
  assert.equal(d.action, "write");
  assert.match(d.reason, /rotation/);
});

test("A5 tracked-but-deleted pin refuses without the flag (restore is explicit too)", () => {
  const d = decidePinWrite({ tracked: true, exists: false, nextContent: "new" });
  assert.equal(d.action, "refuse");
  const d2 = decidePinWrite({ tracked: true, exists: false, nextContent: "new", rotate: true });
  assert.equal(d2.action, "write");
});

test("A6 flag-swallow fails CLOSED: rotate undefined behaves as refuse", () => {
  // `npm run gate:multi --rotate-pins` (missing --): the flag never reaches argv → rotate is
  // simply absent. The guard must refuse, not sweep.
  const d = decidePinWrite({ tracked: true, exists: true, currentContent: "old", nextContent: "new", rotate: undefined });
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
    const trackedSet = new Set(["pin.json"]); // the synthetic committed pin
    await writeFile(join(dir, "pin.json"), "{\"v\":1}\n");

    // D1 untracked sibling writes freely
    const w = await guardedWriteRecord({ root: dir, rel: "fresh.json", content: "{}\n", trackedSet });
    assert.equal(w.action, "write");
    assert.equal(await readFile(join(dir, "fresh.json"), "utf8"), "{}\n");

    // D2 byte-identical rewrite passes, pin untouched
    const s = await guardedWriteRecord({ root: dir, rel: "pin.json", content: "{\"v\":1}\n", trackedSet });
    assert.equal(s.action, "skip-identical");

    // D3 differing write refuses; the pin's bytes survive
    await assert.rejects(
      () => guardedWriteRecord({ root: dir, rel: "pin.json", content: "{\"v\":2}\n", trackedSet }),
      (e) => e instanceof PinGuardError && /pin\.json/.test(e.message) && e.message.includes(ROTATE_FLAG),
    );
    assert.equal(await readFile(join(dir, "pin.json"), "utf8"), "{\"v\":1}\n");

    // D4 explicit rotation writes
    const r = await guardedWriteRecord({ root: dir, rel: "pin.json", content: "{\"v\":2}\n", rotate: true, trackedSet });
    assert.equal(r.action, "write");
    assert.equal(await readFile(join(dir, "pin.json"), "utf8"), "{\"v\":2}\n");

    // D5 a named sanction permits like the flag (the T-114 rejudge completion shape)
    const j = await guardedWriteRecord({
      root: dir, rel: "pin.json", content: "{\"v\":3}\n",
      sanction: "rejudge (T-114 reply completion)", trackedSet,
    });
    assert.equal(j.action, "write");

    // D6 tracked-but-deleted refuses without the flag
    await rm(join(dir, "pin.json"));
    await assert.rejects(
      () => guardedWriteRecord({ root: dir, rel: "pin.json", content: "{}\n", trackedSet }),
      PinGuardError,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// --- E: tracked-set IO ----------------------------------------------------------------------------

test("E1 null tracked set fails CLOSED: everything reads as tracked", () => {
  assert.equal(isTracked(null, "anything/at/all.json"), true);
  const d = decidePinWrite({ tracked: isTracked(null, "x.json"), exists: true, currentContent: "a", nextContent: "b" });
  assert.equal(d.action, "refuse");
});

test("E2 loadTrackedSet smoke on the real repo (cached, contains package.json)", () => {
  const set = loadTrackedSet(ROOT);
  assert.ok(set instanceof Set && set.has("package.json"));
  assert.equal(loadTrackedSet(ROOT), set); // cache hit, same instance
});

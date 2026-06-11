// component-skin distiller tests (T-119-01). Groups:
//   A — deriveChainExitCode (the frozen exit contract)
//   B — componentLayerFrom (pins, named absences, stale findings)
//   C — zoneMapRepinFrom (seam-4 diff semantics)
//   D — distillComponentSkin (record assembly, both milestone shapes)
//   E — JUDGE-UNREACHABILITY: the transitive import graph carries no judge seam
//   F — byte-match tripwire vs the committed pins (added at the T-119-01 rotation step)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

import {
  RECORD_SCHEMA, componentLayerFrom, deriveChainExitCode, wallFieldDecomposition,
  zoneMapRepinFrom, distillComponentSkin,
} from "./component-skin-distill.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

// --- A: exit contract -----------------------------------------------------------------------------

test("A1 exit contract: pipeline-failed → 1; PASS → 0; FAIL → 1; REFUSAL → 2; unknown → 1", () => {
  assert.equal(deriveChainExitCode({ status: "pipeline-failed", gate: { outcome: "PASS" } }), 1);
  assert.equal(deriveChainExitCode({ status: "gated", gate: { outcome: "PASS" } }), 0);
  assert.equal(deriveChainExitCode({ status: "gated", gate: { outcome: "FAIL" } }), 1);
  assert.equal(deriveChainExitCode({ status: "gated", gate: { outcome: "REFUSAL" } }), 2);
  assert.equal(deriveChainExitCode({ status: "gated", gate: null }), 1);
  assert.equal(deriveChainExitCode({ status: "gated" }), 1);
});

// --- B: component layer ---------------------------------------------------------------------------

const INPUTS = {
  regularized: "regularize/hut/artifact.json",
  component: "components/hut.json",
  roof: "roof/hut.json",
  shaped: "shaped/hut.json",
};

test("B1 all records present and pinned to the shell → no findings", () => {
  const shell = '{"blocks":[]}';
  const pin = sha256(shell);
  const layer = componentLayerFrom({
    inputs: INPUTS,
    contents: {
      regularized: shell,
      component: { source: { sha256: pin } },
      roof: { inputs: { shellSha256: pin }, status: "accepted" },
      shaped: { inputs: { recordSha: pin } },
    },
  });
  assert.equal(layer.pins.regularizedShell, pin);
  assert.deepEqual(layer.findings, []);
});

test("B2 absent records are NAMED findings with null pins", () => {
  const layer = componentLayerFrom({
    inputs: INPUTS,
    contents: { regularized: null, component: null, roof: null, shaped: null },
  });
  assert.equal(layer.pins.regularizedShell, null);
  assert.deepEqual(layer.findings.map((f) => f.code).sort(),
    ["component-record-missing", "roof-record-missing", "shaped-record-missing"]);
});

test("B3 stale pin and non-accepted roof program are named findings", () => {
  const shell = '{"blocks":[1]}';
  const layer = componentLayerFrom({
    inputs: INPUTS,
    contents: {
      regularized: shell,
      component: { source: { sha256: "0".repeat(64) } },
      roof: { inputs: { shellSha256: sha256(shell) }, status: "fallback" },
      shaped: null,
    },
  });
  const codes = layer.findings.map((f) => f.code);
  assert.ok(codes.includes("component-pin-stale"));
  assert.ok(codes.includes("roof-program-fallback"));
  assert.ok(codes.includes("shaped-record-missing"));
});

// --- C: seam-4 repin diff -------------------------------------------------------------------------

const BAND = (name, yRange, dominantBlock) => ({ name, yRange, dominantBlock });
const COMMITTED_ZM = { derived: { bands: [BAND("band0", [0, 4], "stone")], roof: { kind: "gable" } } };

test("C1 identical bands+roof → not shifted, no repin content", () => {
  const r = zoneMapRepinFrom({
    key: "hut", committedZoneMap: COMMITTED_ZM, zoneMapRecordRel: "zone-map/hut.json",
    skinZoneMap: { bands: [BAND("band0", [0, 4], "stone")], roof: { kind: "gable" } }, shellSha: "s",
  });
  assert.deepEqual(r, { shifted: false, record: null, repin: null });
});

test("C2 shifted/added/removed bands produce the diff rows and the .reconstructed.json content", () => {
  const r = zoneMapRepinFrom({
    key: "hut", committedZoneMap: { derived: { bands: [BAND("band0", [0, 4], "stone"), BAND("band1", [5, 8], "oak_planks")], roof: null } },
    zoneMapRecordRel: "zone-map/hut.json",
    skinZoneMap: { bands: [BAND("band0", [0, 5], "stone"), BAND("band2", [6, 9], "bricks")], roof: null },
    shellSha: "shellsha",
  });
  assert.equal(r.shifted, true);
  assert.equal(r.record, "zone-map/hut.reconstructed.json");
  const changes = Object.fromEntries(r.repin.diffVsCommitted.map((row) => [row.band, row.change]));
  assert.deepEqual(changes, { band0: "shifted", band2: "added", band1: "removed" });
  assert.equal(r.repin.shellSha256, "shellsha");
  assert.equal(r.repin.committedRecord, "zone-map/hut.json");
});

// --- D: record assembly ---------------------------------------------------------------------------

const LAYER = { inputs: INPUTS, pins: { regularizedShell: null, component: null, roof: null, shaped: null }, findings: [{ code: "roof-record-missing", detail: "x" }] };

test("D1 gated milestone: full record, derived fields mirror the committed milestone", () => {
  const milestone = {
    status: "gated",
    gate: { outcome: "FAIL", kitPresence: { passed: true } },
    skin: { coverage: { "band0": { total: 10, dominant: "stone", dominantFraction: 0.9, byBlock: { stone: 9 } }, "band0:frame": { total: 2, dominant: "oak_log", dominantFraction: 1, byBlock: { oak_log: 2 } }, "roof": { total: 5 } }, zoneMap: { bands: [BAND("band0", [0, 4], "stone")], roof: { kind: "gable" } } },
    reconstruction: { seamSources: { roof: "program" }, conformance: { ok: true } },
    reproducible: { sha256: { shell: "aa", reconstructed: "bb" } },
  };
  const { record, repin } = distillComponentSkin({
    key: "hut", styled: true, runner: "styled-milestone.mjs", milestoneRecRel: "styled/hut.json",
    milestone, exitCode: deriveChainExitCode(milestone), layer: LAYER,
    committedZoneMap: COMMITTED_ZM, zoneMapRecordRel: "zone-map/hut.json",
  });
  assert.equal(record.schema, RECORD_SCHEMA);
  assert.equal(record.chain.exitCode, 1);
  assert.equal(record.chain.status, "gated");
  assert.equal(record.chain.stage, null);
  assert.deepEqual(record.kitPresence, { passed: true });
  assert.deepEqual(record.wallField.band0.field.byBlock, { stone: 9 });
  assert.ok(record.wallField.band0.frame);
  assert.deepEqual(record.zoneMapRepin, { shifted: false, record: null });
  assert.equal(repin, null);
  assert.deepEqual(record.reproducible.milestoneSha256, { shell: "aa", reconstructed: "bb" });
});

test("D2 pipeline-failed milestone: stage/error kept, no repin section", () => {
  const milestone = { status: "pipeline-failed", stage: "settle", error: "did not converge", skin: { zoneMap: { bands: [BAND("band0", [0, 4], "stone")] } } };
  const { record, repin } = distillComponentSkin({
    key: "hut", styled: true, runner: "styled-milestone.mjs", milestoneRecRel: "styled/hut.json",
    milestone, exitCode: deriveChainExitCode(milestone), layer: LAYER,
    committedZoneMap: COMMITTED_ZM, zoneMapRecordRel: "zone-map/hut.json",
  });
  assert.equal(record.chain.exitCode, 1);
  assert.equal(record.chain.stage, "settle");
  assert.equal(record.chain.error, "did not converge");
  assert.equal(record.zoneMapRepin, null);
  assert.equal(repin, null);
});

test("D3 kit-less (challenge) chain never carries kitPresence; missing committed zone-map is the named note", () => {
  const milestone = { status: "gated", gate: { outcome: "PASS", kitPresence: { passed: true } }, skin: { zoneMap: { bands: [BAND("band0", [0, 4], "stone")], roof: null } } };
  const { record } = distillComponentSkin({
    key: "hut", styled: false, runner: "challenge-milestone.mjs", milestoneRecRel: "challenge/hut.json",
    milestone, exitCode: 0, layer: LAYER, committedZoneMap: null, zoneMapRecordRel: null,
  });
  assert.equal(record.kitPresence, null);
  assert.equal(record.zoneMapRepin.shifted, null);
  assert.match(record.zoneMapRepin.note, /no committed zone-map record/);
});

test("D4 shifted bands emit the repin file beside the record", () => {
  const milestone = { status: "gated", gate: { outcome: "FAIL" }, skin: { zoneMap: { bands: [BAND("band0", [0, 9], "bricks")], roof: null } }, reproducible: { sha256: { reconstructed: "rr" } } };
  const { record, repin } = distillComponentSkin({
    key: "hut", styled: true, runner: "styled-milestone.mjs", milestoneRecRel: "styled/hut.json",
    milestone, exitCode: 1, layer: LAYER, committedZoneMap: COMMITTED_ZM, zoneMapRecordRel: "zone-map/hut.json",
  });
  assert.equal(record.zoneMapRepin.shifted, true);
  assert.equal(record.zoneMapRepin.record, "zone-map/hut.reconstructed.json");
  assert.equal(repin.rel, "zone-map/hut.reconstructed.json");
  const parsed = JSON.parse(repin.content);
  assert.equal(parsed.shellSha256, "rr");
  assert.equal(parsed.schema, "zone-map/v1");
});

test("D5 wallFieldDecomposition ignores non-band zones and returns null on empty", () => {
  assert.equal(wallFieldDecomposition(null), null);
  assert.equal(wallFieldDecomposition({ roof: { total: 3 } }), null);
});

// --- F: byte-match tripwire vs the committed pins (T-119-01 AC1) ----------------------------------

/** Every committed component-skin pin must re-distill BYTE-IDENTICALLY from the committed
 *  outputs it cites (the pin itself carries its rebuild spec: layer input paths, milestone
 *  record path, runner). A divergence means a milestone record moved without rotating the
 *  reskin pin — exactly the staleness T-111 residual 4 named; rotate under
 *  docs/knowledge/pin-rotation-policy.md, never re-run the judge for a summary. */
test("F1 byte-match: committed component-skin pins re-distill byte-identically on all legacy subjects", () => {
  const SCULPT = join(ROOT, "benchmarks/sculpture");
  const subjects = ["cottage", "gatehouse", "church", "barn"]
    .filter((k) => existsSync(join(SCULPT, `component-skin/${k}.json`)));
  assert.ok(subjects.length >= 3, "expected the three legacy reskin pins on disk");
  for (const key of subjects) {
    const pinBytes = readFileSync(join(SCULPT, `component-skin/${key}.json`), "utf8");
    const pin = JSON.parse(pinBytes);
    const inputs = pin.componentLayer.inputs; // incl. per-subject regularizedShell overrides
    const readMaybe = (rel) => (existsSync(join(SCULPT, rel)) ? readFileSync(join(SCULPT, rel), "utf8") : null);
    const layer = componentLayerFrom({
      inputs,
      contents: {
        regularized: readMaybe(inputs.regularized),
        component: JSON.parse(readMaybe(inputs.component) ?? "null"),
        roof: JSON.parse(readMaybe(inputs.roof) ?? "null"),
        shaped: JSON.parse(readMaybe(inputs.shaped) ?? "null"),
      },
    });
    const milestoneRecRel = pin.chain.record.replace("benchmarks/sculpture/", "");
    const milestone = JSON.parse(readFileSync(join(SCULPT, milestoneRecRel), "utf8"));
    const zoneMapRecordRel = `zone-map/${key}.json`;
    const committedZoneMap = JSON.parse(readMaybe(zoneMapRecordRel) ?? "null");
    const { record, repin } = distillComponentSkin({
      key, styled: pin.chain.runner === "styled-milestone.mjs", runner: pin.chain.runner,
      milestoneRecRel, milestone, exitCode: deriveChainExitCode(milestone),
      layer, committedZoneMap, zoneMapRecordRel: committedZoneMap ? zoneMapRecordRel : null,
    });
    assert.equal(JSON.stringify(record, null, 2) + "\n", pinBytes,
      `${key}: distilled record diverges from the committed pin — a milestone record moved without ` +
      `rotating the reskin pin (rotate via --distill-only --rotate-pins under pin-rotation-policy.md)`);
    if (repin) {
      assert.equal(repin.content, readMaybe(repin.rel),
        `${key}: the ${repin.rel} repin diverges from the distilled bands`);
    }
  }
});

// --- E: judge-unreachability ----------------------------------------------------------------------

/** Walk the distiller's TRANSITIVE relative-import graph; the judge seam must be absent —
 *  no sdk-binding, no judge-reply, no child_process, anywhere it can reach. */
test("E1 the distiller's transitive import graph carries no judge seam", () => {
  const FORBIDDEN = [/sdk-binding\.mjs/, /judge-reply\.mjs/, /child_process/];
  const seen = new Set();
  const queue = [join(ROOT, "src/form/component-skin-distill.mjs")];
  while (queue.length) {
    const abs = queue.pop();
    if (seen.has(abs)) continue;
    seen.add(abs);
    const src = readFileSync(abs, "utf8");
    // every import SPECIFIER, static or dynamic (comments don't import anything)
    const specifiers = [...src.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)].map((m) => m[1]);
    for (const spec of specifiers) {
      for (const re of FORBIDDEN) {
        assert.ok(!re.test(spec), `${abs.replace(ROOT, "")} imports the judge seam: ${spec}`);
      }
      if (spec.startsWith(".")) {
        const next = join(dirname(abs), spec);
        if (existsSync(next)) queue.push(next);
      }
    }
  }
  assert.ok(seen.size >= 1);
});

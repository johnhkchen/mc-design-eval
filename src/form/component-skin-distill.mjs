// COMPONENT-SKIN DISTILLER (T-119-01, story S-119, epic E-30) — the judge-free record rebuild.
//
// T-116 concern 6: `component-skin.mjs` was assumed a "cheap record refresh", but its only
// rebuild path spawned the milestone chain AND THE JUDGE, re-rolling three styled verdict sets
// (reverted; T-111 residual 4 routed here). This module is the fix's core: the ENTIRE
// component-skin record assembly — layer pins, chain distillation, zone-map repin diff — as a
// PURE function of committed inputs. The runner's live path and its `--distill-only` path both
// assemble through here, so the two modes cannot drift; the distill path feeds it nothing but
// committed records.
//
// JUDGE-IMPOSSIBLE BY CONSTRUCTION: this module's transitive import graph contains no
// sdk-binding.mjs, no judge-reply.mjs, no node:child_process — asserted by an import-graph walk
// in component-skin-distill.test.mjs. The seam is ABSENT, not stubbed.
//
// One named divergence from the `reconstructed-milestone --distill-only` precedent: that mode
// CARRIES chain.exitCode from the previous committed record; we DERIVE it from the frozen exit
// contract (deriveChainExitCode) — carrying would have frozen the church record's stale
// `exitCode: 1` beside a rebuilt `status: "gated"`.

import { createHash } from "node:crypto";

export const RECORD_SCHEMA = "component-skin/v1";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const canon = (v) => JSON.stringify(v ?? null);

/** The component layer from already-read contents (the runner reads the files; semantics are
 *  T-106's verbatim: sha pins, `*-record-missing`, `*-pin-stale`, `roof-program-<status>`).
 *  contents: { regularized: string|null, component, roof, shaped: object|null }. */
export function componentLayerFrom({ inputs, contents }) {
  const layer = { inputs, pins: {}, findings: [] };
  const regSha = contents.regularized != null ? sha256(contents.regularized) : null;
  layer.pins.regularizedShell = regSha;
  for (const [name, path, pinOf] of [
    ["component", inputs.component, (r) => r.source?.sha256],
    ["roof", inputs.roof, (r) => r.inputs?.shellSha256],
    ["shaped", inputs.shaped, (r) => r.inputs?.recordSha],
  ]) {
    const rec = contents[name];
    if (rec == null) {
      layer.findings.push({ code: `${name}-record-missing`, detail: `${path} absent — that seam falls back to occupancy derivation` });
      layer.pins[name] = null;
      continue;
    }
    const pin = pinOf(rec) ?? null;
    layer.pins[name] = pin;
    if (regSha && pin && pin !== regSha) {
      layer.findings.push({
        code: `${name}-pin-stale`,
        detail: `${path} pinned to ${String(pin).slice(0, 12)}…, committed regularized shell is ${regSha.slice(0, 12)}… — the chain verifies against ITS in-chain shell and throws on real drift`,
      });
    }
    if (name === "roof" && rec.status !== "accepted") {
      layer.findings.push({ code: `roof-program-${rec.status}`, detail: "roof program not accepted — roof seam falls back, recorded by the chain" });
    }
  }
  return layer;
}

/** The frozen exit contract (multi-angle-gate: decided ? (passed?0:1) : 2; the milestone
 *  runners mirror the gate child's code; a pipeline failure exits 1). */
export function deriveChainExitCode(milestone) {
  if (milestone.status === "pipeline-failed") return 1;
  const outcome = milestone.gate?.outcome ?? null;
  if (outcome === "PASS") return 0;
  if (outcome === "FAIL") return 1;
  if (outcome === "REFUSAL") return 2;
  return 1; // no/unknown gate on a non-failed record — conservative
}

/** The per-band wall-field decomposition out of a chain coverage census (T-106 AC #4 evidence). */
export function wallFieldDecomposition(coverage) {
  if (!coverage) return null;
  const bands = {};
  for (const [zone, c] of Object.entries(coverage)) {
    const m = zone.match(/^(band\d+)(?::(offslab|frame))?$/);
    if (!m) continue;
    const [, band, part] = m;
    (bands[band] ??= {})[part ?? "field"] = {
      total: c.total, dominant: c.dominant, dominantFraction: c.dominantFraction, byBlock: c.byBlock,
    };
  }
  return Object.keys(bands).length ? bands : null;
}

/** Seam 4 (T-095 re-pin protocol): diff the chain's derived bands against the committed
 *  zone-map record; when shifted, produce the `.reconstructed.json` repin content. */
export function zoneMapRepinFrom({ key, committedZoneMap, zoneMapRecordRel, skinZoneMap, shellSha }) {
  const shifted = canon(committedZoneMap.derived?.bands) !== canon(skinZoneMap.bands) ||
    canon(committedZoneMap.derived?.roof) !== canon(skinZoneMap.roof);
  const repinRel = zoneMapRecordRel.replace(/\.json$/, ".reconstructed.json");
  if (!shifted) return { shifted: false, record: null, repin: null };
  const repin = {
    schema: "zone-map/v1",
    subject: key,
    source: "concept",
    derivedOn: "reconstructed-shell",
    repinnedBy: "T-106-01 (component-skin runner — the T-095 review's re-pin protocol)",
    shellSha256: shellSha,
    derived: { bands: skinZoneMap.bands, roof: skinZoneMap.roof },
    diffVsCommitted: (() => {
      const old = new Map((committedZoneMap.derived?.bands ?? []).map((b) => [b.name, b]));
      const rows = [];
      for (const b of skinZoneMap.bands) {
        const o = old.get(b.name);
        old.delete(b.name);
        if (!o) rows.push({ band: b.name, change: "added", yRange: b.yRange, dominant: b.dominantBlock });
        else if (JSON.stringify(o.yRange) !== JSON.stringify(b.yRange) || o.dominantBlock !== b.dominantBlock) {
          rows.push({ band: b.name, change: "shifted", from: { yRange: o.yRange, dominant: o.dominantBlock }, to: { yRange: b.yRange, dominant: b.dominantBlock } });
        }
      }
      for (const [name, o] of old) rows.push({ band: name, change: "removed", yRange: o.yRange, dominant: o.dominantBlock });
      return rows;
    })(),
    committedRecord: zoneMapRecordRel,
    note: "the committed zone-map/v1 record describes the standalone E-24 derivation (unchanged path); this record pins the bands as derived on the reconstructed shell",
  };
  return { shifted: true, record: repinRel, repin, bands: skinZoneMap.bands };
}

/** The WHOLE component-skin record from committed/known inputs. `exitCode` is the live child's
 *  real code on the live path, deriveChainExitCode(milestone) on the distill path.
 *  Returns { record, repin: { rel, content } | null }. */
export function distillComponentSkin({
  key, styled, runner, milestoneRecRel, milestone, exitCode, layer, committedZoneMap, zoneMapRecordRel,
}) {
  const failed = milestone.status === "pipeline-failed";
  const skin = milestone.skin ?? null;
  const record = {
    schema: RECORD_SCHEMA,
    subject: key,
    componentLayer: layer,
    chain: {
      runner, record: `benchmarks/sculpture/${milestoneRecRel}`, exitCode,
      status: milestone.status, stage: failed ? milestone.stage : null, error: failed ? milestone.error : null,
      gate: milestone.gate ?? null,
    },
    reconstruction: milestone.reconstruction ?? null,
    seamSources: milestone.reconstruction?.seamSources ?? null,
    conformance: milestone.reconstruction?.conformance ?? null,
    wallField: wallFieldDecomposition(skin?.coverage),
    kitPresence: styled && milestone.gate?.kitPresence ? milestone.gate.kitPresence : null,
    zoneMapRepin: null,
    findings: layer.findings,
    reproducible: {
      milestoneSha256: milestone.reproducible?.sha256 ?? null,
      determinism: "the milestone runner double-runs the deterministic chain and owns the byte-identity proof; this record distills its committed output",
    },
  };

  let repinFile = null;
  if (!failed && skin?.zoneMap?.bands && committedZoneMap) {
    const r = zoneMapRepinFrom({
      key, committedZoneMap, zoneMapRecordRel, skinZoneMap: skin.zoneMap,
      shellSha: record.reproducible.milestoneSha256?.reconstructed ?? record.reproducible.milestoneSha256?.shell ?? null,
    });
    if (r.shifted) {
      record.zoneMapRepin = { shifted: true, record: r.record, bands: r.bands };
      repinFile = { rel: r.record, content: JSON.stringify(r.repin, null, 2) + "\n" };
    } else {
      record.zoneMapRepin = { shifted: false, record: null };
    }
  } else if (!failed && skin?.zoneMap?.bands && !committedZoneMap) {
    record.zoneMapRepin = { shifted: null, record: null, note: "no committed zone-map record to diff (first derivation lives in the chain record)" };
  }

  return { record, repin: repinFile };
}

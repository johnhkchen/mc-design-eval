// IMPURE RUNNER — component-aware re-skin, the T-106-01 evidence record (story S-106, epic E-27).
//
// THE PREDICTION UNDER TEST: skinning succeeds when the major components are parametric and
// defined rather than one big blob. The CONSUMPTION lives in the chain itself (challenge-milestone
// runChain's reconstruct stage + buildSkin/grammarStage's componentPlan seams — commits 1–6); this
// runner is the per-subject orchestrator + the T-106 record:
//
//   1. VERIFY the component layer's pins against the committed regularized shell (informational —
//      the chain re-verifies against ITS shell and THROWS on drift; absences are named findings).
//   2. RUN the component-aware chain through the existing milestone runner — styled-milestone for
//      kit-bearing subjects (grammar, dressing, settle, kit-aware gate: AC #3), challenge-milestone
//      for kit-less subjects (the skin chain carries the T-088 refusal point: AC #4). The choice is
//      REGISTRY DATA (def.kitRecord), not a subject branch.
//   3. DISTILL the milestone record: reconstruction stats + seam sources, the wall-field census
//      decomposition (on-slab / :offslab / :frame per band — the AC #4 "named with its measured
//      cause" evidence), conformance, kit presence, gate verdict.
//   4. RE-PIN the zone map where bands shifted on the rebuilt geometry (T-095 review concern #4):
//      writes zone-map/<subj>.reconstructed.json (a NEW record pinned to the reconstructed shell —
//      the committed zone-map/v1 describes the standalone E-24 derivation, which is unchanged, and
//      overwriting it would break that path's agreement asserts).
//
// HONEST FAILURE (E-25 Rule 6): a milestone pipeline-failed record IS the result — distilled,
// recorded, exit 1. A gate FAIL is a VERDICT (recorded, exit mirrors the milestone). Determinism
// is the milestone runners' double-run contract; this record points at their shas.
//
//   npm run reskin:cottage | reskin:gatehouse | reskin:church
//   ... -- --offline   # re-assert the committed component-skin record against the milestone records
//
// Writes component-skin/<subj>.{json,md} (committed) + zone-map/<subj>.reconstructed.json (when
// bands shifted).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "component-skin");

export const RECORD_SCHEMA = "component-skin/v1";
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

const readJson = async (rel) => JSON.parse(await readFile(join(HERE, rel), "utf8"));
const has = (rel) => existsSync(join(HERE, rel));

/** The component layer on disk for one subject: records, pins, named absences. */
async function componentLayer(key) {
  const rel = {
    regularized: `regularize/${key}/artifact.json`,
    component: `components/${key}.json`,
    roof: `roof/${key}.json`,
    shaped: `shaped/${key}.json`,
  };
  const layer = { inputs: rel, pins: {}, findings: [] };
  const regSha = has(rel.regularized) ? sha256(await readFile(join(HERE, rel.regularized), "utf8")) : null;
  layer.pins.regularizedShell = regSha;
  for (const [name, path, pinOf] of [
    ["component", rel.component, (r) => r.source?.sha256],
    ["roof", rel.roof, (r) => r.inputs?.shellSha256],
    ["shaped", rel.shaped, (r) => r.inputs?.recordSha],
  ]) {
    if (!has(path)) {
      layer.findings.push({ code: `${name}-record-missing`, detail: `${path} absent — that seam falls back to occupancy derivation` });
      layer.pins[name] = null;
      continue;
    }
    const rec = await readJson(path);
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

/** Spawn a milestone runner; the exit code is a VERDICT (gate fail) or an honest failure, never a crash to hide. */
function spawnMilestone(script, key) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(HERE, script), "--subject", key], { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("close", (code) => resolve(code));
  });
}

/** The per-band wall-field decomposition out of a chain coverage census: the AC #4 evidence. */
function wallFieldDecomposition(coverage) {
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

function renderMd(r) {
  const f = (x) => (x == null ? "—" : x);
  const lines = [
    `# Component-aware re-skin — ${r.subject} (T-106-01, E-27)`,
    "",
    `Chain: \`${r.chain.runner}\` → ${r.chain.status}${r.chain.stage ? ` @ ${r.chain.stage}` : ""}; gate: **${f(r.chain.gate?.outcome)}**` +
      (r.kitPresence ? `; kit presence: **${r.kitPresence.passed ? "PASS" : "FAIL"}**` : ""),
    "",
    `Reconstruction: ${r.reconstruction?.composed
      ? r.reconstruction.composed.perDelta.map((d) => `${d.name} ${d.changed}+${d.added}-${d.removed}`).join(", ")
      : "none composed"}; seams ${JSON.stringify(r.seamSources ?? {})}`,
    "",
    "## Wall-field decomposition (the defined field vs measured residue)",
    "",
    "| band | field dominant | field | :offslab | :frame |",
    "|---|---|---|---|---|",
  ];
  for (const [band, parts] of Object.entries(r.wallField ?? {})) {
    lines.push(`| ${band} | \`${f(parts.field?.dominant)}\` | ${f(parts.field?.dominantFraction)} (${f(parts.field?.total)} cells) | ` +
      `${f(parts.offslab?.total)} cells | ${f(parts.frame?.total)} cells |`);
  }
  if (r.zoneMapRepin) {
    lines.push("", `Zone-map re-pin: bands ${r.zoneMapRepin.shifted ? "SHIFTED — re-pinned at " + r.zoneMapRepin.record : "identical, no re-pin needed"}`);
  }
  if (r.findings?.length) {
    lines.push("", "## Named findings", "", ...r.findings.map((x) => `- \`${x.code}\` — ${x.detail}`));
  }
  lines.push("", `Milestone record: \`${r.chain.record}\`; shas: \`${JSON.stringify(r.reproducible?.milestoneSha256 ?? {})}\``, "");
  return lines.join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const key = argv[argv.indexOf("--subject") + 1];
  const def = SUBJECTS[key];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  await mkdir(OUT_DIR, { recursive: true });
  const recPath = join(OUT_DIR, `${key}.json`);

  // chain choice is registry DATA: the styled milestone requires a committed kit (its own
  // precondition); a kit-less subject runs the challenge chain, which carries the T-088 refusal
  const styled = Boolean(def.kitRecord && has(def.kitRecord));
  const runner = styled ? "styled-milestone.mjs" : "challenge-milestone.mjs";
  const milestoneRecRel = styled ? `styled/${key}.json` : `challenge/${key}.json`;

  if (offline) {
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run reskin:${key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const mile = has(milestoneRecRel) ? await readJson(milestoneRecRel) : null;
    const same = mile && JSON.stringify(mile.reproducible?.sha256 ?? null) === JSON.stringify(rec.reproducible?.milestoneSha256 ?? null);
    console.error(`[offline] ${key}: milestone record ${mile ? "present" : "MISSING"}; shas ${same ? "MATCH" : "DIVERGE"}; recorded gate ${rec.chain?.gate?.outcome ?? "?"}`);
    if (!same) process.exitCode = 1;
    return;
  }

  const layer = await componentLayer(key);
  console.error(`[${key}] component layer: ` + ["component", "roof", "shaped"].map((n) => `${n} ${layer.pins[n] ? "pinned" : "ABSENT"}`).join(", ") +
    (layer.findings.length ? ` — findings: ${layer.findings.map((x) => x.code).join(", ")}` : ""));

  console.error(`[${key}] running ${runner} (component-aware chain)…`);
  const code = await spawnMilestone(runner, key);
  if (!has(milestoneRecRel)) throw new Error(`${runner} produced no record at ${milestoneRecRel}`);
  const mile = await readJson(milestoneRecRel);

  const failed = mile.status === "pipeline-failed";
  const skin = mile.skin ?? null;
  const record = {
    schema: RECORD_SCHEMA,
    subject: key,
    componentLayer: layer,
    chain: {
      runner, record: `benchmarks/sculpture/${milestoneRecRel}`, exitCode: code,
      status: mile.status, stage: failed ? mile.stage : null, error: failed ? mile.error : null,
      gate: mile.gate ?? null,
    },
    reconstruction: mile.reconstruction ?? null,
    seamSources: mile.reconstruction?.seamSources ?? null,
    conformance: mile.reconstruction?.conformance ?? null,
    wallField: wallFieldDecomposition(skin?.coverage),
    kitPresence: styled && mile.gate?.kitPresence ? mile.gate.kitPresence : null,
    zoneMapRepin: null,
    findings: layer.findings,
    reproducible: {
      milestoneSha256: mile.reproducible?.sha256 ?? null,
      determinism: "the milestone runner double-runs the deterministic chain and owns the byte-identity proof; this record distills its committed output",
    },
  };

  // --- seam 4: re-pin the zone map where bands shifted on the rebuilt geometry --------------------
  if (!failed && skin?.zoneMap?.bands && def.zoneMapRecord && has(def.zoneMapRecord)) {
    const committed = await readJson(def.zoneMapRecord);
    const canon = (v) => JSON.stringify(v ?? null);
    const shifted = canon(committed.derived?.bands) !== canon(skin.zoneMap.bands) ||
      canon(committed.derived?.roof) !== canon(skin.zoneMap.roof);
    const repinRel = def.zoneMapRecord.replace(/\.json$/, ".reconstructed.json");
    if (shifted) {
      const repin = {
        schema: "zone-map/v1",
        subject: key,
        source: "concept",
        derivedOn: "reconstructed-shell",
        repinnedBy: "T-106-01 (component-skin runner — the T-095 review's re-pin protocol)",
        shellSha256: record.reproducible.milestoneSha256?.reconstructed ?? record.reproducible.milestoneSha256?.shell ?? null,
        derived: { bands: skin.zoneMap.bands, roof: skin.zoneMap.roof },
        diffVsCommitted: (() => {
          const old = new Map((committed.derived?.bands ?? []).map((b) => [b.name, b]));
          const rows = [];
          for (const b of skin.zoneMap.bands) {
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
        committedRecord: def.zoneMapRecord,
        note: "the committed zone-map/v1 record describes the standalone E-24 derivation (unchanged path); this record pins the bands as derived on the reconstructed shell",
      };
      await writeFile(join(HERE, repinRel), JSON.stringify(repin, null, 2) + "\n");
      record.zoneMapRepin = { shifted: true, record: repinRel, bands: skin.zoneMap.bands };
      console.error(`[${key}] zone-map re-pin: bands shifted on the rebuilt geometry — wrote ${repinRel}`);
    } else {
      record.zoneMapRepin = { shifted: false, record: null };
      console.error(`[${key}] zone-map re-pin: derived bands identical to the committed record — no re-pin needed`);
    }
  } else if (!failed && skin?.zoneMap?.bands && (!def.zoneMapRecord || !has(def.zoneMapRecord))) {
    record.zoneMapRepin = { shifted: null, record: null, note: "no committed zone-map record to diff (first derivation lives in the chain record)" };
  }

  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${key}.md`), renderMd(record));
  console.error(`\n[${key}] component-skin: chain ${record.chain.status ?? "gated"}, gate ${record.chain.gate?.outcome ?? "—"}` +
    (record.kitPresence ? `, kit presence ${record.kitPresence.passed ? "PASS" : "FAIL"}` : ""));
  console.error(`✓ wrote ${recPath.replace(ROOT, "")}`);
  process.exitCode = failed ? 1 : code;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.stack || String(e)); process.exit(1); });
}

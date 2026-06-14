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

import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { SUBJECTS } from "./durable-skin.mjs";
import {
  RECORD_SCHEMA, componentLayerFrom, deriveChainExitCode, distillComponentSkin,
} from "../../src/form/component-skin-distill.mjs";
import {
  ROTATE_FLAG, preflightPins, guardedWriteRecord, loadTrackedSet, isTracked,
} from "../../src/form/pin-guard.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "component-skin");

export { RECORD_SCHEMA }; // assembly (and the schema) live in src/form/component-skin-distill.mjs

const readJson = async (rel) => JSON.parse(await readFile(join(HERE, rel), "utf8"));
const has = (rel) => existsSync(join(HERE, rel));
const sculptureRel = (rel) => `benchmarks/sculpture/${rel}`; // repo-root-relative, the pin-guard key

/** The component layer on disk for one subject: records, pins, named absences.
 *  Exported for the E-27 terminal runner (reconstructed-milestone.mjs) — same verification,
 *  one source of truth. IO wrapper; the semantics are pure (componentLayerFrom, T-119-01). */
export async function componentLayer(key, def) {
  const rel = {
    regularized: def.regularizedShell ?? `regularize/${key}/artifact.json`, // chain-canonical override (church)
    component: `components/${key}.json`,
    roof: `roof/${key}.json`,
    shaped: `shaped/${key}.json`,
  };
  const contents = {
    regularized: has(rel.regularized) ? await readFile(join(HERE, rel.regularized), "utf8") : null,
    component: has(rel.component) ? await readJson(rel.component) : null,
    roof: has(rel.roof) ? await readJson(rel.roof) : null,
    shaped: has(rel.shaped) ? await readJson(rel.shaped) : null,
  };
  return componentLayerFrom({ inputs: rel, contents });
}

/** Spawn a milestone runner; the exit code is a VERDICT (gate fail) or an honest failure, never a crash to hide. */
function spawnMilestone(script, key, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(HERE, script), "--subject", key, ...extraArgs], { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("close", (code) => resolve(code));
  });
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

/** READ-ONLY DISTILLATION (T-119-01 — the T-116 concern-6 fix): rebuild the component-skin
 *  record from COMMITTED outputs only. The chain is never spawned and the judge seam is absent
 *  by construction (the assembly is the pure src/form/component-skin-distill.mjs, whose import
 *  graph carries no sdk-binding / judge-reply / child_process — unit-asserted). Writes go
 *  through the pin-guard: byte-identical means the pins are in sync; a differing rebuild
 *  refuses without the explicit rotation flag. */
async function distillMain({ key, def, styled, runner, milestoneRecRel, rotate }) {
  if (!has(milestoneRecRel)) {
    throw new Error(`--distill-only needs a committed milestone record at ${milestoneRecRel} — distillation rebuilds from committed outputs, it never runs the chain`);
  }
  const layer = await componentLayer(key, def);
  const milestone = await readJson(milestoneRecRel);
  const committedZoneMap = def.zoneMapRecord && has(def.zoneMapRecord) ? await readJson(def.zoneMapRecord) : null;
  const { record, repin } = distillComponentSkin({
    key, styled, runner, milestoneRecRel, milestone,
    exitCode: deriveChainExitCode(milestone),
    layer, committedZoneMap, zoneMapRecordRel: def.zoneMapRecord ?? null,
  });
  console.error(`[${key}] --distill-only: rebuilt from committed outputs (chain + judge structurally absent) — ` +
    `chain ${record.chain.status}, gate ${record.chain.gate?.outcome ?? "—"}, derived exit ${record.chain.exitCode}`);
  await guardedWriteRecord({ root: ROOT, rel: sculptureRel(`component-skin/${key}.json`), content: JSON.stringify(record, null, 2) + "\n", rotate });
  await guardedWriteRecord({ root: ROOT, rel: sculptureRel(`component-skin/${key}.md`), content: renderMd(record), rotate });
  if (repin) await guardedWriteRecord({ root: ROOT, rel: sculptureRel(repin.rel), content: repin.content, rotate });
  console.error(`✓ distilled component-skin/${key}.json${repin ? ` (+ ${repin.rel})` : ""}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const key = argv[argv.indexOf("--subject") + 1];
  const def = SUBJECTS[key];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const distillOnly = argv.includes("--distill-only");
  const rotate = argv.includes(ROTATE_FLAG);
  await mkdir(OUT_DIR, { recursive: true });
  const recPath = join(OUT_DIR, `${key}.json`);

  // chain choice is registry DATA: the styled milestone requires a committed kit (its own
  // precondition); a kit-less subject runs the challenge chain, which carries the T-088 refusal
  const styled = Boolean(def.kitRecord && has(def.kitRecord));
  const runner = styled ? "styled-milestone.mjs" : "challenge-milestone.mjs";
  const milestoneRecRel = styled ? `styled/${key}.json` : `challenge/${key}.json`;

  if (distillOnly) {
    await distillMain({ key, def, styled, runner, milestoneRecRel, rotate });
    return;
  }

  if (offline) {
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run reskin:${key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const mile = has(milestoneRecRel) ? await readJson(milestoneRecRel) : null;
    const same = mile && JSON.stringify(mile.reproducible?.sha256 ?? null) === JSON.stringify(rec.reproducible?.milestoneSha256 ?? null);
    console.error(`[offline] ${key}: milestone record ${mile ? "present" : "MISSING"}; shas ${same ? "MATCH" : "DIVERGE"}; recorded gate ${rec.chain?.gate?.outcome ?? "?"}`);
    if (!same) process.exitCode = 1;
    return;
  }

  const layer = await componentLayer(key, def);
  console.error(`[${key}] component layer: ` + ["component", "roof", "shaped"].map((n) => `${n} ${layer.pins[n] ? "pinned" : "ABSENT"}`).join(", ") +
    (layer.findings.length ? ` — findings: ${layer.findings.map((x) => x.code).join(", ")}` : ""));

  // T-119-01 preflight, BEFORE the chain (and therefore before the judge): the live path
  // re-judges, so every committed record it would re-cut must be explicitly rotated.
  const trackedSet = loadTrackedSet(ROOT);
  const livePins = [
    `component-skin/${key}.json`, `component-skin/${key}.md`, milestoneRecRel,
  ].map(sculptureRel).concat([
    // the gate verdict is a frozen measurement under the top-level measurements/ home (T-155-01,
    // E-37: location encodes status) — already root-relative, NOT under benchmarks/sculpture/.
    `measurements/multi-angle/${key}-${styled ? "styled" : "challenge"}.json`,
  ]);
  preflightPins({
    pins: livePins.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
    rotate, intent: `reskin:${key} live chain (re-runs the chain AND the judge; --distill-only rebuilds judge-free)`,
  });

  console.error(`[${key}] running ${runner} (component-aware chain)…`);
  const code = await spawnMilestone(runner, key, rotate ? [ROTATE_FLAG] : []);
  if (!has(milestoneRecRel)) throw new Error(`${runner} produced no record at ${milestoneRecRel}`);
  const mile = await readJson(milestoneRecRel);

  const committedZoneMap = def.zoneMapRecord && has(def.zoneMapRecord) ? await readJson(def.zoneMapRecord) : null;
  const { record, repin } = distillComponentSkin({
    key, styled, runner, milestoneRecRel, milestone: mile,
    exitCode: code, layer, committedZoneMap, zoneMapRecordRel: def.zoneMapRecord ?? null,
  });
  const failed = mile.status === "pipeline-failed";

  // --- seam 4: re-pin the zone map where bands shifted on the rebuilt geometry --------------------
  if (repin) {
    await guardedWriteRecord({ root: ROOT, rel: sculptureRel(repin.rel), content: repin.content, rotate });
    console.error(`[${key}] zone-map re-pin: bands shifted on the rebuilt geometry — wrote ${repin.rel}`);
  } else if (record.zoneMapRepin?.shifted === false) {
    console.error(`[${key}] zone-map re-pin: derived bands identical to the committed record — no re-pin needed`);
  }

  await guardedWriteRecord({ root: ROOT, rel: sculptureRel(`component-skin/${key}.json`), content: JSON.stringify(record, null, 2) + "\n", rotate });
  await guardedWriteRecord({ root: ROOT, rel: sculptureRel(`component-skin/${key}.md`), content: renderMd(record), rotate });
  console.error(`\n[${key}] component-skin: chain ${record.chain.status ?? "gated"}, gate ${record.chain.gate?.outcome ?? "—"}` +
    (record.kitPresence ? `, kit presence ${record.kitPresence.passed ? "PASS" : "FAIL"}` : ""));
  console.error(`✓ wrote ${recPath.replace(ROOT, "")}`);
  process.exitCode = failed ? 1 : code;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.stack || String(e)); process.exit(1); });
}

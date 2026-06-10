// IMPURE RUNNER — the E-26 TERMINAL MILESTONE (S-101 / T-101-01). One named command per subject
// takes the committed concept inputs to a STYLED, gated build END-TO-END, in the epic's chain order:
//
//   KIT (T-096: the committed kit/v1 record, consumed read-only — extraction is seeded by the
//   committed verbatim model reply, kit/<subj>.raw.json; kit-extract --offline reproduces the
//   record byte-identically)
//   → the E-25 deterministic chain via the exported runChain ([provision (data-gated)] → SHELL
//     INTEGRITY T-091 → the E-24 SKIN: value-true T-086 → kit overrides T-096 → seal →
//     CONCEPT-DERIVED ZONE MAP T-092 → full-shell zone-fill T-090 → splat → coherence T-087 →
//     coverage/band terminal gates T-088, all THROWS)
//   → PLACEMENT GRAMMAR (T-098 via the exported grammarStage: frame lines painted, fields/courses
//     re-filled, frameRefilled MUST be 0, coverage + band evidence re-asserted, all THROWS)
//   → OPENING DRESSING (T-099 pure cores: concept-declared apertures from the chain's raw input
//     build, treatments from the kit, deterministic idempotent placement; conflicts and
//     unfulfilled slots recorded, never silent)
//   → GRAMMAR SETTLE (the seam T-100 named for S-101: re-opening panes perturbs the frame-line
//     read and breaks kept runs — the SAME grammar op re-runs to its own fixpoint, bounded, so the
//     styled build is a no-op for the op the kit-presence checker re-runs)
//   → THE KIT-AWARE MULTI-ANGLE GATE (T-100 ∘ T-093), spawned through its own CLI so its frozen
//     contract (kit-presence fixpoint check beside the 4-azimuth judge, overall = resemblance AND
//     presence, exit codes) is reused, never re-implemented.
//
// DETERMINISM (E-24 Rule 2 / E-25 Rule 5): kit→shell→skin→grammar→dressing is a pure function of
// the committed inputs; it runs TWICE per live invocation and every produced artifact must be
// byte-identical, sha256s recorded; --repro re-proves from a fresh process; --offline re-asserts
// the committed record. LLM-authored INPUTS (material map, kit) are one-time committed records
// consumed read-only; the judge is the pinned model, single sample per view, verdicts committed in
// the gate record. GL renders are evidence, never inputs to a decision.
//
// HONEST FAILURE (E-25 Rule 6): a missing kit record or a deterministic-stage THROW writes
// styled/<subj>.json with {status: "pipeline-failed", stage, error} — no artifact, no sheet, no
// pass — and exits 1. Nothing is weakened; the record names the gap. A completed chain exits with
// the gate's own code: 0 PASS (both gates) · 1 FAIL (either) · 2 REFUSAL.
//
// GENERALIZATION (E-25 Rule 3): this file contains no subject keys, constants, branches, or
// thresholds. Subjects come from the durable-skin registry; missing records are nullable registry
// data, named in the output.
//
// GL + METERED (gate judge) — run on demand, NOT in `npm test`:
//   npm run styled:cottage                  # the full styled chain + frames + kit report + the gate
//   npm run styled:gatehouse
//   npm run styled:church                   # the untuned challenge subject
//   npm run styled:cottage -- --repro       # re-run the deterministic chain, compare sha256s (no GL/judge)
//   npm run styled:cottage -- --offline     # re-assert the committed record + artifacts (no recompute)
//
// Writes styled/<subj>.{json,md} (committed) + styled/<subj>/{base-,shell-,grammar-,}artifact.json
// (committed) + PNGs (gitignored) + pr/assets/frames/styled-<subj>-{before,after}.png +
// pr/assets/styled-<subj>-kit.md; the gate writes multi-angle/<subj>-styled.{json,md} +
// pr/assets/frames/multi-angle-<subj>-styled.png.

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import {
  treatmentsFromKit, extractApertures, dressOpenings, applyDressing,
} from "../../src/view/opening-dressing.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { MULTI_ANGLE_GATE_SCHEMA } from "../../src/form/multi-angle-gate.mjs";
import { runChain } from "./challenge-milestone.mjs";
import { grammarStage, renderSheet } from "./placement-grammar.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "styled");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");
const PR_ASSETS = join(ROOT, "pr/assets");

const GATE_LABEL = "styled";
const RECORD_SCHEMA = "styled-milestone/v1";
const PIPELINE_ORDER = "kit (committed, T-096) → shell integrity (T-091) → regularize (T-102 cage) → skin (T-086 value-true → " +
  "kit overrides → seal → T-092 zones → T-090 fill → T-087 coherence → T-088 gates) → " +
  "placement grammar (T-098) → opening dressing (T-099) → grammar settle (the T-100 fixpoint seam) → " +
  "kit-aware multi-angle gate (T-100 ∘ T-093)";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const artifactJson = (a) => JSON.stringify(a, null, 2) + "\n";

/** The styled deterministic stretch: the E-25 chain, then grammar, then dressing. `track.stage`
 *  names the failing stage for the honest-failure record. */
async function styledChain(def, kitRec, paths, track) {
  track.stage = "chain";
  const { provision, base, shell, skin } = await runChain(def, paths);
  track.stage = "grammar";
  if (skin.zoneMap?.source !== "concept" || !skin.zoneMap.bands) {
    throw new Error(`skin produced no concept-derived zone map (source=${skin.zoneMap?.source}) — ` +
      `the grammar binds to the T-092 derived bands, not the prior`);
  }
  const gOpts = {
    bands: skin.zoneMap.bands, roof: skin.zoneMap.roof,
    policy: skin.policyS, substitution: skin.substitution, kitRec, zoneOpts: def.zoneOpts,
  };
  const g = grammarStage(skin.final, gOpts);
  track.stage = "dressing";
  // apertures are concept-declared: measured on the chain's RAW input build (T-099's reference) —
  // the provisioned base for challenge subjects, the committed pre-seal build otherwise
  const apertures = extractApertures(artifactOccupancy(base));
  const treatments = treatmentsFromKit(kitRec);
  const dress = dressOpenings(artifactOccupancy(g.final), apertures, treatments);
  const dressed = applyDressing(g.final, dress.placements);
  assertArtifact(dressed);
  track.stage = "settle";
  // THE SETTLE PASS (the pipeline seam T-100 named for S-101): re-opening the panes perturbs the
  // grammar's frame-line read near apertures and breaks kept runs. Re-run the SAME grammar op
  // (frame + fill, gates included) to its own fixpoint, bounded — the styled build must be a no-op
  // for the op the kit-presence checker re-runs (T-100's fixpoint rule), and the re-run IS the
  // post-dressing cleanliness pass. Non-convergence is a wiring bug, never smoothed.
  let styled = dressed;
  const settle = { iterations: 0, trail: [] };
  for (;;) {
    const s = grammarStage(styled, gOpts);
    const wants = s.grammar.frame.painted + s.grammar.frame.adopted + s.grammar.fill.placements.length;
    if (wants === 0) break;
    if (++settle.iterations > 4) {
      throw new Error(`settle did not converge after 4 grammar re-runs (still wants ${wants} cells: ` +
        `frame ${s.grammar.frame.painted + s.grammar.frame.adopted}, fill ${s.grammar.fill.placements.length})`);
    }
    settle.trail.push({
      frame: s.grammar.frame.painted + s.grammar.frame.adopted,
      fill: s.grammar.fill.placements.length,
    });
    styled = s.final;
  }
  assertArtifact(styled);
  return { provision, base, shell, skin, grammar: g, apertures, treatments, dress, settle, styled };
}

/** Spawn the kit-aware gate through its own CLI (frozen contract). Exit 0/1/2 is a VERDICT. */
function spawnGate(key, artifactRel) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      join(HERE, "multi-angle-gate.mjs"), "--subject", key, "--label", GATE_LABEL, "--artifact", artifactRel,
    ], { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("close", (code) => resolve(code));
  });
}

/** Distill the gate record: the T-093 aggregate + the T-100 presence + the composed overall. */
function distillGate(gateRec, key, gateCode) {
  if (!gateRec) return { outcome: "MISSING-RECORD", exitCode: gateCode };
  const overall = gateRec.overall;
  const kp = gateRec.kitPresence;
  return {
    outcome: overall
      ? (overall.decided ? (overall.passed ? "PASS" : "FAIL") : `REFUSAL (${overall.refusal})`)
      : "MISSING-OVERALL",
    resemblance: gateRec.aggregate ? {
      decided: gateRec.aggregate.decided ?? false, passed: gateRec.aggregate.passed ?? null,
      gapCount: gateRec.aggregate.gapCount ?? null, gapBudget: gateRec.aggregate.gapBudget ?? null,
      failures: gateRec.aggregate.failures ?? null, refusal: gateRec.aggregate.refusal ?? null,
    } : null,
    kitPresence: kp ? {
      ran: kp.ran ?? null, passed: kp.passed ?? null, reason: kp.reason ?? null,
      gaps: kp.gaps ?? [], skips: (kp.skips ?? []).map((s) => `${s.feature} (${s.reason})`),
    } : null,
    perView: (gateRec.views ?? []).map((v) => ({
      angle: v.angle, azimuthDeg: v.azimuthDeg,
      coverage: v.coverage ? v.coverage.passed : null,
      verdict: v.verdict?.verdict ?? (v.unparsed ? "unparsed" : v.reason === "coverage" ? "judge-not-called" : null),
      gaps: v.verdict?.gaps ?? [],
    })),
    record: `benchmarks/sculpture/multi-angle/${key}-${GATE_LABEL}.json`,
    sheet: gateRec.sheet,
  };
}

/** The AC2 kit report: the committed kit's entries + the gate's presence verdict, pointers only. */
function kitReportMd(def, kitRec, kitSha, gate) {
  const rows = (kitRec.kit ?? []).map((e) =>
    `| \`${e.block}\` | ${e.role ?? "—"} | ${e.formClass} | ${(e.whereUsed ?? []).join(", ") || "—"} | ` +
    `${e.confidence}${e.flaggedForReview ? " ⚑" : ""} | ${e.valueCheck?.verdict ?? "—"} |`).join("\n");
  const kp = gate?.kitPresence;
  const presence = !kp ? "not reported by the gate record"
    : kp.ran === false ? `not run (${kp.reason})`
      : kp.passed
        ? "**PASS** — every kit entry present at its grammar/dressing sites (fixpoint check, zero gaps)"
        : `**FAIL** — named absences:\n${kp.gaps.map((g) => `- \`${g}\``).join("\n")}`;
  return `# Styled kit report — ${def.key} (T-101-01, E-26)\n\n` +
    `The committed kit \`${def.kitRecord}\` (sha256 \`${kitSha.slice(0, 12)}…\`, immutable input — ` +
    `extraction pinned by \`${def.kitRecord.replace(/\.json$/, ".raw.json")}\`):\n\n` +
    `| block | role | form | where used | confidence | value check |\n|---|---|---|---|---|---|\n${rows}\n\n` +
    `Overrides into the shipped palette: \`${JSON.stringify(kitRec.overrides ?? {})}\`.\n\n` +
    `## Kit presence on the styled build\n\n${presence}\n` +
    (kp?.skips?.length ? `\nSkips (recorded, never silent): ${kp.skips.join("; ")}\n` : "") +
    `\n**Kit-aware gate verdict: ${gate?.outcome ?? "?"}** — canonical records: \`${gate?.record ?? "?"}\`, ` +
    `\`benchmarks/sculpture/styled/${def.key}.json\`.\n`;
}

export function renderMd(r) {
  if (r.status === "pipeline-failed") {
    return `# Styled milestone — ${r.subject} (T-101-01, E-26 terminal)\n\n**PIPELINE FAILED** at the ` +
      `**${r.stage}** stage (recorded honestly — E-25 Rule 6; nothing tuned in response):\n\n` +
      `\`\`\`\n${r.error}\n\`\`\`\n\nNo styled artifact, sheet, or pass was produced.\n`;
  }
  const pct = (f) => (f == null ? "?" : `${Math.round(f * 100)}%`);
  const gapsOf = (v) => (v.gaps.length ? v.gaps.map((g) => `${g.severity} ${g.attribute}@${g.region}`).join("; ") : "—");
  const viewRows = (r.gate.perView ?? []).map((v) =>
    `| ${v.angle} | ${v.azimuthDeg}° | ${v.coverage === null ? "—" : v.coverage ? "pass" : "REJECT"} | ${v.verdict ?? "(missing)"} | ${gapsOf(v)} |`).join("\n");
  const kp = r.gate.kitPresence;
  const g = r.grammar;
  const d = r.dressing;
  return `# Styled milestone — ${r.subject} (T-101-01, E-26 terminal)\n\n` +
    `One command, the whole E-26 chain: ${PIPELINE_ORDER}. **Reproducible**: double-run ` +
    `byte-identical, styled sha256 \`${r.reproducible.sha256.styled.slice(0, 16)}…\`.\n\n` +
    (r.provision ? `## Provision (challenge subject)\nScale ${r.provision.scale}, ${r.provision.cells} cells, ` +
      `${r.provision.manifest} manifest blocks — GLB + committed material map, zero tuning.\n\n` : "") +
    `## Shell integrity (T-091)\n` +
    `Strip ${r.shell.strip.components} → ${r.shell.strip.kept} components (${r.shell.strip.strippedCells} cells); ` +
    `voids ${r.shell.voids.filled} filled; plug ${r.shell.plug.cells} cells / ${r.shell.plug.iterations} iter → **CLOSED**. ` +
    `Openings honored: ${r.shell.openings.join(", ") || "(none)"}.\n\n` +
    `## Skin (T-086/T-096/T-092/T-090/T-087/T-088)\n` +
    `Zone map: **${r.skin.zoneMap.source}** — ` +
    r.skin.zoneMap.bands.map((b) => `${b.name} y${b.yRange[0]}..${b.yRange[1]} \`${b.dominantBlock}\``).join(", ") +
    `; roof \`${r.skin.zoneMap.roof.dominantBlock}\`. Substitution \`${JSON.stringify(r.skin.substitution)}\`; ` +
    `kit overrides \`${JSON.stringify(r.skin.kitOverrides)}\`. Fill ${r.skin.fill.placements}; ` +
    `salt ${r.skin.salt.stripped} stripped. Coverage gate **final PASS** — ` +
    Object.entries(r.skin.coverage).map(([z, c]) => `${z} \`${c.dominant}\` ${pct(c.dominantFraction)}`).join(" · ") + `.\n\n` +
    `## Placement grammar (T-098)\n` +
    `Frame \`${g.shipped.frame}\`: ${g.frame.painted} painted, ${g.frame.adopted} adopted, ` +
    `${g.frame.respected} respected, ${g.frame.skippedIsolated} isolates skipped, ${g.frame.alreadyFrame} already; ` +
    `fill ${g.fill.placements} / kept ${g.fill.kept}; **frameRefilled ${g.frameRefilled}** (survival proof); ` +
    `coverage + band evidence re-asserted PASS.\n\n` +
    `## Opening dressing (T-099)\n` +
    `${d.apertures} concept-declared apertures; ${d.placements} placements ` +
    `(${d.stats.fullyDressed}/${d.stats.openings} fully dressed, ${d.stats.conflicts} conflicts, ` +
    `${d.stats.alreadyDressed} already dressed). Unfulfilled slots: ` +
    `${d.treatments.unfulfilled.length ? d.treatments.unfulfilled.map((u) => `${u.slot} (${u.reason})`).join(", ") : "none"}. Derivations: ` +
    `${Object.keys(d.treatments.derivations ?? {}).length ? JSON.stringify(d.treatments.derivations) : "none"}.\n` +
    `Settle (the T-100 seam): grammar re-run to its own fixpoint in ${r.settle.iterations} iteration(s)` +
    (r.settle.trail.length ? ` (${r.settle.trail.map((t) => `frame ${t.frame} + fill ${t.fill}`).join("; ")})` : " (already a no-op)") +
    ` — the styled build is a no-op for the op the kit-presence checker re-runs.\n\n` +
    `## Kit-aware multi-angle gate (T-100 ∘ T-093) — **${r.gate.outcome}**\n\n` +
    `Resemblance: ${r.gate.resemblance?.decided ? (r.gate.resemblance.passed ? "PASS" : "FAIL") : `REFUSAL (${r.gate.resemblance?.refusal})`}` +
    (r.gate.resemblance?.gapCount != null ? ` (gaps ${r.gate.resemblance.gapCount}/${r.gate.resemblance.gapBudget})` : "") +
    ` · Kit presence: ${kp ? (kp.ran === false ? `not run (${kp.reason})` : kp.passed ? "PASS (zero gaps)" : "FAIL") : "?"}` +
    (kp?.gaps?.length ? `\n${kp.gaps.map((x) => `- \`${x}\``).join("\n")}` : "") + `\n\n` +
    `![sheet](../../../${r.gate.sheet})\n\n` +
    `| view | azimuth | coverage | verdict | gaps |\n|---|---|---|---|---|\n${viewRows}\n\n` +
    `Gate record: \`${r.gate.record}\` (the sheet is the verdict artifact).\n\n` +
    `## Evidence\nFrames: ${r.frames.join(", ") || "(none — GL unavailable)"}; kit report \`${r.kitReport}\`.\n\n` +
    `> ${r.reproducible.determinism}\n`;
}

// =================================================================================================
async function main() {
  const argv = process.argv.slice(2);
  const def = SUBJECTS[argv[argv.indexOf("--subject") + 1]];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const repro = argv.includes("--repro");
  const subjDir = join(OUT_DIR, def.key);
  const recPath = join(OUT_DIR, `${def.key}.json`);
  const paths = {
    baseRel: `styled/${def.key}/base-artifact.json`,
    shellRel: `styled/${def.key}/shell-artifact.json`,
    grammarRel: `styled/${def.key}/grammar-artifact.json`,
    finalRel: `styled/${def.key}/artifact.json`,
  };
  paths.baseAbs = join(HERE, paths.baseRel);
  paths.shellAbs = join(HERE, paths.shellRel);
  paths.grammarAbs = join(HERE, paths.grammarRel);
  paths.finalAbs = join(HERE, paths.finalRel);
  const gateRecPath = join(HERE, "multi-angle", `${def.key}-${GATE_LABEL}.json`);
  const kitReportRel = `pr/assets/styled-${def.key}-kit.md`;
  await mkdir(subjDir, { recursive: true });

  if (offline) {
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run styled:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    if (rec.status === "pipeline-failed") {
      console.error(`[offline] ${def.key}: recorded status pipeline-failed at stage "${rec.stage}" — ${rec.error}`);
      process.exitCode = 1;
      return;
    }
    const shaOf = async (p) => sha256(await readFile(p, "utf8"));
    for (const p of [paths.shellAbs, paths.grammarAbs, paths.finalAbs]) {
      assertArtifact(JSON.parse(await readFile(p, "utf8")));
    }
    const gateRec = existsSync(gateRecPath) ? JSON.parse(await readFile(gateRecPath, "utf8")) : null;
    const kitRec = JSON.parse(await readFile(join(HERE, def.kitRecord), "utf8"));
    const want = rec.reproducible?.sha256 ?? {};
    const checks = {
      schema: rec.schema === RECORD_SCHEMA,
      shell: (await shaOf(paths.shellAbs)) === want.shell,
      grammar: (await shaOf(paths.grammarAbs)) === want.grammarFinal,
      styled: (await shaOf(paths.finalAbs)) === want.styled,
      base: !want.base || (await shaOf(paths.baseAbs)) === want.base,
      kit: sha256(JSON.stringify(kitRec)) === rec.inputs?.kitSha256,
      gate: gateRec?.schema === MULTI_ANGLE_GATE_SCHEMA && gateRec?.label === GATE_LABEL &&
        (gateRec?.aggregate?.decided === true) !== (typeof gateRec?.aggregate?.refusal === "string"),
      overall: !!gateRec?.overall && rec.gate?.outcome === (gateRec.overall.decided
        ? (gateRec.overall.passed ? "PASS" : "FAIL") : `REFUSAL (${gateRec.overall.refusal})`),
      sheet: typeof rec.gate?.sheet === "string" && existsSync(join(ROOT, rec.gate.sheet)),
      evidence: (rec.frames ?? []).every((f) => existsSync(join(ROOT, f))) &&
        (!rec.kitReport || existsSync(join(ROOT, rec.kitReport))),
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: artifact shas ${checks.base && checks.shell && checks.grammar && checks.styled ? "MATCH" : "DIVERGE"}; ` +
      `kit sha ${checks.kit ? "MATCHES" : "DIVERGES"}; gate record ${checks.gate ? "well-formed" : "MISSING/MALFORMED"}; ` +
      `overall ${checks.overall ? "consistent" : "INCONSISTENT"}; sheet ${checks.sheet ? "present" : "MISSING"}; ` +
      `evidence ${checks.evidence ? "present" : "MISSING"}; AJV ok — recorded gate outcome: ${rec.gate?.outcome ?? "?"}`);
    if (!ok) process.exitCode = 1;
    return;
  }

  // --- THE NAMED KIT PRECONDITION (E-26 Rule 2: the kit is committed, immutable input) -------------
  const kitPath = def.kitRecord && join(HERE, def.kitRecord);
  if (!kitPath || !existsSync(kitPath)) {
    const error = `no committed kit record (registry kitRecord=${def.kitRecord ?? "null"}) — kit ` +
      `extraction (kit-extract.mjs) requires a committed T-092 zone-map record (registry ` +
      `zoneMapRecord=${def.zoneMapRecord ?? "null"}); zone derivation runs inside the skin chain, so ` +
      `both are blocked by this subject's upstream gate findings (see challenge/${def.key}.json). ` +
      `Run kit:extract once the chain passes its skin gates.`;
    const record = {
      schema: RECORD_SCHEMA, subject: def.key, status: "pipeline-failed", stage: "kit", error,
      inputs: { build: def.provision ? null : def.build, concept: def.concept, glb: def.glb, map: def.map, kitRecord: def.kitRecord ?? null },
      note: "a named precondition, not a crash — recorded honestly (E-25 Rule 6); nothing was tuned in response",
    };
    await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
    await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
    console.error(`[${def.key}] PIPELINE FAILED at kit: ${error}`);
    console.error(`✓ wrote ${recPath.replace(ROOT, "")} (status: pipeline-failed)`);
    process.exitCode = 1;
    return;
  }
  const kitRec = JSON.parse(await readFile(kitPath, "utf8"));
  if (kitRec.schema !== "kit/v1") throw new Error(`${def.kitRecord} is not a kit/v1 record`);
  const kitSha = sha256(JSON.stringify(kitRec));

  if (repro) {
    // AC4's fresh-process proof: re-run the deterministic chain (no GL, no judge), compare shas.
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run styled:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    if (rec.status === "pipeline-failed") {
      console.error(`[repro] ${def.key}: recorded status is pipeline-failed — nothing to reproduce`);
      process.exitCode = 1;
      return;
    }
    const r = await styledChain(def, kitRec, paths, {});
    const got = {
      base: def.provision ? sha256(artifactJson(r.base)) : null,
      shell: sha256(artifactJson(r.shell.artifact)),
      skinFinal: sha256(artifactJson(r.skin.final)),
      grammarFinal: sha256(artifactJson(r.grammar.final)),
      styled: sha256(artifactJson(r.styled)),
    };
    const want = rec.reproducible?.sha256 ?? {};
    const same = (!got.base || got.base === want.base) && got.shell === want.shell &&
      got.skinFinal === want.skinFinal && got.grammarFinal === want.grammarFinal && got.styled === want.styled;
    console.error(`[repro] ${def.key}: fresh-process chain ${same ? "REPRODUCES the committed artifacts" : "DIVERGES"} ` +
      `(styled ${got.styled.slice(0, 12)}… vs ${String(want.styled).slice(0, 12)}…)`);
    if (!same) process.exitCode = 1;
    return;
  }

  await mkdir(FRAMES_DIR, { recursive: true });

  // --- THE DETERMINISTIC CHAIN, TWICE (Rule 5: byte-equal or no record) ---------------------------
  let r1;
  const track = { stage: "chain" };
  try {
    r1 = await styledChain(def, kitRec, paths, track);
    const r2 = await styledChain(def, kitRec, paths, track);
    for (const [stage, a, b] of [
      ["base", r1.base, r2.base],
      ["shell", r1.shell.artifact, r2.shell.artifact],
      ["skin-final", r1.skin.final, r2.skin.final],
      ["grammar-final", r1.grammar.final, r2.grammar.final],
      ["styled", r1.styled, r2.styled],
    ]) {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`NON-DETERMINISTIC: two in-process runs diverge at the ${stage} artifact`);
    }
  } catch (e) {
    // Rule 6: the failure IS the recorded result — no artifact, no sheet, no pass.
    const stage = track.stage !== "chain" ? track.stage
      : existsSync(paths.shellAbs) ? "skin" : (!def.provision || existsSync(paths.baseAbs)) ? "shell" : "provision";
    const record = {
      schema: RECORD_SCHEMA, subject: def.key, status: "pipeline-failed", stage, error: e.message,
      inputs: { build: def.provision ? null : def.build, concept: def.concept, glb: def.glb, map: def.map, kitRecord: def.kitRecord, kitSha256: kitSha },
      note: "a terminal gate or chain stage threw — recorded honestly (E-25 Rule 6); nothing was tuned in response",
    };
    await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
    await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
    console.error(`[${def.key}] PIPELINE FAILED at ${stage}: ${e.message}`);
    console.error(`✓ wrote ${recPath.replace(ROOT, "")} (status: pipeline-failed)`);
    process.exitCode = 1;
    return;
  }

  const grammarJson = artifactJson(r1.grammar.final);
  const styledJson = artifactJson(r1.styled);
  await writeFile(paths.grammarAbs, grammarJson);
  await writeFile(paths.finalAbs, styledJson);
  const shas = {
    base: def.provision ? sha256(artifactJson(r1.base)) : null,
    shell: sha256(artifactJson(r1.shell.artifact)),
    skinFinal: sha256(artifactJson(r1.skin.final)),
    grammarFinal: sha256(grammarJson),
    styled: sha256(styledJson),
  };
  const g = r1.grammar.grammar;
  console.error(`[${def.key}] reproducible: double-run byte-identical (styled ${r1.styled.placements.length} placements, sha ${shas.styled.slice(0, 12)}…)`);
  if (r1.provision) console.error(`[${def.key}] provision: scale ${r1.provision.scale}, ${r1.provision.cells} cells`);
  console.error(`[${def.key}] shell: ${r1.shell.strip.components} → ${r1.shell.strip.kept} components; ` +
    `voids ${r1.shell.voids.filled}; plug ${r1.shell.plug.cells} — closure CLOSED`);
  console.error(`[${def.key}] skin: zones ${r1.skin.zoneMap.source} — ` +
    r1.skin.zoneMap.bands.map((b) => `${b.name} ${b.dominantBlock}`).join(", ") + `; roof ${r1.skin.zoneMap.roof.dominantBlock}; ` +
    `fill ${r1.skin.fill.placements.length}; coverage gate final PASS`);
  console.error(`[${def.key}] grammar: frame ${g.shipped.frame} — ${g.frame.painted} painted, ${g.frame.adopted} adopted, ` +
    `${g.frame.respected} respected; frameRefilled ${g.frameRefilled}; coverage+bands re-asserted PASS`);
  console.error(`[${def.key}] dressing: ${r1.apertures.length} apertures, ${r1.dress.placements.length} placements ` +
    `(${r1.dress.stats.fullyDressed}/${r1.dress.stats.openings} fully dressed, ${r1.dress.stats.conflicts} conflicts); ` +
    `unfulfilled: ${r1.treatments.unfulfilled.map((u) => u.slot).join(", ") || "none"}`);
  console.error(`[${def.key}] settle: grammar fixpoint reached in ${r1.settle.iterations} re-run(s)` +
    (r1.settle.trail.length ? ` — ${r1.settle.trail.map((t) => `frame ${t.frame} + fill ${t.fill}`).join("; ")}` : " — already a no-op"));

  // audit: the chain's derived bands vs the committed zone-map record (chain runs on the repaired shell)
  let zoneMapDiff = null;
  if (def.zoneMapRecord && existsSync(join(HERE, def.zoneMapRecord))) {
    const committed = JSON.parse(await readFile(join(HERE, def.zoneMapRecord), "utf8"));
    const canon = (v) => JSON.stringify(v ?? null);
    zoneMapDiff = {
      record: def.zoneMapRecord,
      bandsIdentical: canon(committed.derived?.bands) === canon(r1.skin.zoneMap.bands ?? null),
      roofIdentical: canon(committed.derived?.roof) === canon(r1.skin.zoneMap.roof ?? null),
    };
  }

  // --- before/after sheets at the 4 gate azimuths (evidence, never logic) -------------------------
  // before = the committed KIT-LESS build (the T-100 negative), data-gated on its existence
  const frames = [];
  let renders = null;
  const kitlessRel = `durable-skin/${def.key}/artifact.json`;
  try {
    let before = null;
    if (existsSync(join(HERE, kitlessRel))) {
      const kitless = JSON.parse(await readFile(join(HERE, kitlessRel), "utf8"));
      before = await renderSheet(kitless, "before-kitless", subjDir);
    }
    const after = await renderSheet(r1.styled, "after-styled", subjDir);
    if (before) {
      await copyFile(before.sheetPath, join(FRAMES_DIR, `styled-${def.key}-before.png`));
      frames.push(`pr/assets/frames/styled-${def.key}-before.png`);
    }
    await copyFile(after.sheetPath, join(FRAMES_DIR, `styled-${def.key}-after.png`));
    frames.push(`pr/assets/frames/styled-${def.key}-after.png`);
    renders = {
      kitlessBefore: before ? before.renders : null,
      styledAfter: after.renders,
      note: before ? null : `no committed kit-less build at ${kitlessRel} — before-frame skipped (data-gated)`,
    };
    console.error(`[${def.key}] frames: ${frames.join(", ")}`);
  } catch (e) {
    console.error(`renders unavailable (${e.message}) — evidence only, never the gate`);
  }

  // --- THE GATE (T-100 ∘ T-093, its own CLI + record + sheet; exit code = the verdict) ------------
  console.error(`\n[${def.key}] spawning the kit-aware multi-angle gate (label "${GATE_LABEL}")…`);
  const gateCode = await spawnGate(def.key, paths.finalRel);
  const gateRec = existsSync(gateRecPath) ? JSON.parse(await readFile(gateRecPath, "utf8")) : null;
  const gate = distillGate(gateRec, def.key, gateCode);

  await writeFile(join(PR_ASSETS, `styled-${def.key}-kit.md`), kitReportMd(def, kitRec, kitSha, gate));

  // --- the milestone record ------------------------------------------------------------------------
  const record = {
    schema: RECORD_SCHEMA,
    subject: def.key,
    status: "gated",
    pipelineOrder: PIPELINE_ORDER,
    inputs: {
      build: def.provision ? paths.baseRel : def.build, concept: def.concept, glb: def.glb, map: def.map,
      kitRecord: def.kitRecord, kitSha256: kitSha, kitPin: def.kitRecord.replace(/\.json$/, ".raw.json"),
      kitlessBefore: existsSync(join(HERE, kitlessRel)) ? kitlessRel : null,
    },
    provision: r1.provision,
    shell: { strip: r1.shell.strip, openings: r1.shell.openings, voids: r1.shell.voids, plug: r1.shell.plug },
    skin: {
      substitution: r1.skin.substitution, kitOverrides: kitRec.overrides ?? {},
      zoneMap: { source: r1.skin.zoneMap.source, bands: r1.skin.zoneMap.bands, roof: r1.skin.zoneMap.roof },
      zoneMapVsCommitted: zoneMapDiff,
      fill: { placements: r1.skin.fill.placements.length, kept: r1.skin.fill.kept },
      salt: { stripped: r1.skin.salt.stripped, kept: r1.skin.salt.kept },
      coverage: r1.skin.coverage.final, gates: r1.skin.gates,
    },
    grammar: {
      bindings: g.bindings, shipped: g.shipped,
      frame: {
        counts: g.frame.counts, painted: g.frame.painted, adopted: g.frame.adopted,
        respected: g.frame.respected, skippedIsolated: g.frame.skippedIsolated, alreadyFrame: g.frame.alreadyFrame,
      },
      fill: { placements: g.fill.placements.length, kept: g.fill.kept },
      frameRefilled: g.frameRefilled,
      preexistingFrameRefilled: g.preexistingFrameRefilled,
      coverage: r1.grammar.coverage, bands: r1.grammar.bands,
    },
    dressing: {
      apertures: r1.apertures.length,
      apertureList: r1.apertures.map((a) => ({ dir: a.dir, kind: a.kind, bbox: a.bbox })),
      treatments: { slots: r1.treatments.slots, derivations: r1.treatments.derivations, unfulfilled: r1.treatments.unfulfilled },
      placements: r1.dress.placements.length,
      perOpening: r1.dress.perOpening,
      stats: r1.dress.stats,
    },
    settle: r1.settle,
    reproducible: {
      doubleRun: true, sha256: shas,
      determinism: "kit→shell→skin→grammar→dressing is a pure function of the committed inputs " +
        "(concept PNG, material map, GLB, kit); two in-process executions byte-matched on every " +
        "artifact; --repro re-proves from a fresh process. LLM-authored inputs are one-time " +
        "committed records (the kit's raw model reply is pinned beside it); the gate judge is the " +
        "pinned model, single sample per view, verdicts committed in the gate record.",
    },
    gate,
    artifacts: { base: def.provision ? paths.baseRel : null, shell: paths.shellRel, grammar: paths.grammarRel, styled: paths.finalRel },
    renders, frames,
    kitReport: kitReportRel,
    generalization: "no subject keys, constants, branches, or thresholds in this runner — subjects are durable-skin registry data (E-25 Rule 3)",
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  console.error(`\n[${def.key}] styled milestone: chain COMPLETE, gate ${gate.outcome}`);
  console.error(`✓ wrote ${recPath.replace(ROOT, "")} + ${paths.finalRel} + ${kitReportRel}`);
  process.exitCode = gateCode;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.stack || String(e)); process.exit(1); });
}

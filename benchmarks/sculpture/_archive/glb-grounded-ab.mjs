// GLB-grounded three-way head-to-head (T-053-01, story S-053, epic E-16 — terminal consolidation).
//
// E-16 asked three measured questions with the real TRELLIS GLBs of koi + heart:
//   A (T-049-01) — does a 3-D *target* unlock the E-15 surgical form loop on text→JSON builds?
//   B (T-051-01) — is the voxelizer's form better than text→JSON?
//   synthesis (T-052-01) — is GLB-voxel + surgical region tweaks the capable combination?
// This consolidator collects the answers into ONE honest head-to-head and journals the residual — the
// same discipline as the E-14 (value, codesign-ab) and E-15 (form, form-revise-ab) consolidations.
//
// PURE + OFFLINE: it reads only the committed JSON records the three dependency tickets already wrote
// (no model calls, no voxelization, no renders, no GLB mesh reads). A consolidation must not re-measure
// its inputs. Re-running it regenerates byte-stable output from those committed inputs:
//
//   node benchmarks/sculpture/glb-grounded-ab.mjs
//
// Writes glb-grounded-ab.json + glb-grounded-ab.md. Importable without side effects (main-guarded) so a
// future test can consume buildModel()/band() directly.
//
// The comparability spine (see research.md): the three arms do not all score against the same reference.
//   - text→JSON-vs-GLB  = glb-formtarget-ab.json `wholeObjectIoUBefore` (the un-edited E-13 build scored
//                          against the GLB) — koi 0.472, heart 0.456.
//   - GLB-voxel-vs-GLB   = glb-voxel/<s>/summary.json `silhouetteIoU` — koi 0.622, heart 0.877.
//   - surgical-vs-GLB    = glb-voxel-surgical.json `wholeObjectIoUAfter` — koi 0.614, heart 0.877.
// vs-GLB is the apples-to-apples axis (exists for all three). vs-concept (form-baseline.json: koi 0.481,
// heart 0.347) is carried as the E-13 cross-reference, only where it was actually measured.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

const SRC = {
  baseline: join(HERE, "..", "..", "measurements", "form-baseline.json"), // E-13 vs concept
  formTarget: join(HERE, "glb-formtarget-ab.json"), // Arm A: text→JSON vs GLB + loop verdict
  voxKoi: join(HERE, "glb-voxel", "koi", "summary.json"), // Arm B
  voxHeart: join(HERE, "glb-voxel", "heart", "summary.json"),
  surgical: join(HERE, "glb-voxel-surgical", "glb-voxel-surgical.json"), // synthesis
};

// The two subjects, with the E-13 run id that links them to the concept baseline.
const SUBJECTS = [
  { key: "koi", run: "009-vConcept-a-koi-fish", glb: "glb/koi.glb" },
  { key: "heart", run: "006-vConcept-an-anatomically-correct-human-heart", glb: "glb/heart.glb" },
];

// IoU-derived form band — a reading aid, NOT an independent perceptual judge (none was re-run in E-16;
// the surgical arms carry the deterministic loop verdict, appended to the band). Coarse enough that small
// IoU noise does not flip a band. Documented in the emitted note.
const BANDS = [
  [0.5, "poor"],
  [0.7, "fair"],
  [0.85, "good"],
  [Infinity, "strong"],
];

export function band(iou) {
  if (typeof iou !== "number" || Number.isNaN(iou)) return "unknown";
  for (const [hi, name] of BANDS) if (iou < hi) return name;
  return "strong";
}

const r3 = (x) => (typeof x === "number" ? Math.round(x * 1000) / 1000 : null);

function readJson(p) {
  if (!existsSync(p)) throw new Error(`missing upstream record: ${p}`);
  return JSON.parse(readFileSync(p, "utf8"));
}

export function buildModel() {
  const baseline = readJson(SRC.baseline);
  const formTarget = readJson(SRC.formTarget);
  const surgical = readJson(SRC.surgical);
  const vox = { koi: readJson(SRC.voxKoi), heart: readJson(SRC.voxHeart) };

  const baselineByRun = Object.fromEntries(baseline.subjects.map((s) => [s.run, s]));
  const ftBySubject = Object.fromEntries(formTarget.subjects.map((s) => [s.subject, s]));
  const surgBySubject = Object.fromEntries(surgical.subjects.map((s) => [s.subject, s]));

  const subjects = SUBJECTS.map(({ key, run, glb }) => {
    const ft = ftBySubject[key];
    const surg = surgBySubject[key];
    const conceptIoU = r3(baselineByRun[run]?.iou);

    const textJsonVsGlb = r3(ft.wholeObjectIoUBefore); // un-edited E-13 build vs GLB
    const voxelVsGlb = r3(vox[key].silhouetteIoU);
    const surgicalVsGlb = r3(surg.wholeObjectIoUAfter);

    const delta = (x) => (typeof x === "number" ? r3(x - textJsonVsGlb) : null);

    const methods = [
      {
        method: "text→JSON (E-13)",
        ticket: "E-13",
        iouVsGlb: textJsonVsGlb,
        iouVsConcept: conceptIoU,
        categorical: band(textJsonVsGlb),
        verdict: null,
        deltaVsTextJson: 0,
      },
      {
        method: "GLB-voxel (T-051-01)",
        ticket: "T-051-01",
        iouVsGlb: voxelVsGlb,
        iouVsConcept: null, // not measured vs concept; not faked
        categorical: band(voxelVsGlb),
        verdict: null,
        deltaVsTextJson: delta(voxelVsGlb),
      },
      {
        method: "GLB-voxel + surgical (T-052-01)",
        ticket: "T-052-01",
        iouVsGlb: surgicalVsGlb,
        iouVsConcept: null,
        categorical: `${band(surgicalVsGlb)} (${surg.verdict})`,
        verdict: surg.verdict,
        deltaVsTextJson: delta(surgicalVsGlb),
        keptCount: surg.keptCount,
        rolledBackCount: surg.rolledBackCount,
      },
    ];

    return {
      subject: key,
      run,
      glb,
      // Arm A detail (the 3-D target on the text→JSON loop):
      armA: {
        regionIoUBefore: r3(ft.regionIoUBefore),
        regionIoUAfter: r3(ft.regionIoUAfter),
        wholeBefore: r3(ft.wholeObjectIoUBefore),
        wholeAfter: r3(ft.wholeObjectIoUAfter),
        accepted: ft.accepted,
        moved: ft.moved,
        verdict: ft.verdict,
      },
      // synthesis detail (surgical on the voxel set):
      synthesis: {
        wholeBefore: r3(surg.wholeObjectIoUBefore),
        wholeAfter: r3(surg.wholeObjectIoUAfter),
        verdict: surg.verdict,
        keptCount: surg.keptCount,
        rolledBackCount: surg.rolledBackCount,
        perRegion: surg.perRegion.map((p) => ({
          defect: p.defect,
          route: p.loopRoute,
          before: r3(p.scoreBefore),
          after: r3(p.scoreAfter),
          accepted: p.accepted,
        })),
      },
      methods,
    };
  });

  // Epic-level answers, derived from the rows (numbers, not assertions).
  const koi = subjects.find((s) => s.subject === "koi");
  const heart = subjects.find((s) => s.subject === "heart");
  const movedA = subjects.filter((s) => s.armA.moved).map((s) => s.subject);
  const answers = {
    q1_targetMovedTextJsonLoop: {
      moved: `${movedA.length} of ${subjects.length}`,
      detail: `heart improved (${heart.armA.wholeBefore}→${heart.armA.wholeAfter}, edit accepted); ` +
        `koi held (${koi.armA.wholeBefore}→${koi.armA.wholeAfter}, rolled back). Against E-15's flat ` +
        `concept (0 of 2 moved; the heart edit regressed and was rejected), the 3-D target gave the ` +
        `heart a per-region signal worth keeping.`,
      answer: "Partly — the 3-D target moved the loop on 1 of 2, where the flat concept moved 0 of 2.",
    },
    q2_voxelizationBeatTextJson: {
      koiDelta: koi.methods[1].deltaVsTextJson,
      heartDelta: heart.methods[1].deltaVsTextJson,
      answer: `Yes, decisively. vs the same GLB: koi ${koi.methods[0].iouVsGlb}→${koi.methods[1].iouVsGlb} ` +
        `(+${koi.methods[1].deltaVsTextJson}), heart ${heart.methods[0].iouVsGlb}→${heart.methods[1].iouVsGlb} ` +
        `(+${heart.methods[1].deltaVsTextJson}). Voxelizing the image→3D mesh is a far larger form win than ` +
        `any surgical edit on a text→JSON build.`,
    },
    q3_surgicalAddedCapability: {
      koi: `whole-object ${koi.synthesis.wholeBefore}→${koi.synthesis.wholeAfter} (${koi.synthesis.verdict}); ` +
        `1 region cleaned locally but did not transfer to the whole silhouette`,
      heart: `whole-object ${heart.synthesis.wholeBefore}→${heart.synthesis.wholeAfter} (${heart.synthesis.verdict}); ` +
        `both regions rolled back`,
      cost: "one claude -p LLM-edit call per `curve` region (koi 1 kept / 1 rolled, heart 0 / 2)",
      answer: "No net whole-object gain. Once voxelization captures the form, local single-view surgical " +
        "edits have little headroom and can slightly hurt the whole-object silhouette — the E-15 " +
        "single-view ceiling persists even with a 3-D target and a voxel base.",
    },
  };

  const residual = [
    `GLB-voxel is not 1.0 — koi ${koi.methods[1].iouVsGlb} (the thin caudal fin voxelizes chunky), heart ` +
      `${heart.methods[1].iouVsGlb} (closer). The metric is a single 3/4 view; rotation/axis is not ` +
      `corrected; translation+uniform scale are normalized out.`,
    `Surgical revision cannot reliably climb a whole-object single-view IoU even with a 3-D target on a ` +
      `voxel base (koi regressed, heart held).`,
    `Silhouette IoU is necessary, not sufficient — two shapes can share an outline. No fresh LLM ` +
      `perceptual judge was re-run in E-16; the categorical is the IoU band + the deterministic loop verdict.`,
  ];

  return {
    schema: "glb-grounded-ab/v1",
    metric: "silhouette-iou (whole-object, 3/4 view)",
    generatedFrom:
      "form-baseline.json (E-13 vs concept) + glb-formtarget-ab.json (Arm A) + " +
      "glb-voxel/{koi,heart}/summary.json (Arm B) + glb-voxel-surgical/glb-voxel-surgical.json (synthesis)",
    note:
      "THE E-16 CONSOLIDATION. Three-way head-to-head of text→JSON (E-13) vs GLB-voxel (T-051-01) vs " +
      "GLB-voxel+surgical (T-052-01) for koi + heart. The apples-to-apples axis is whole-object " +
      "silhouette IoU vs the GLB target (exists for all three arms): text→JSON-vs-GLB is the un-edited " +
      "E-13 build scored against the GLB (glb-formtarget-ab `wholeObjectIoUBefore`); GLB-voxel-vs-GLB is " +
      "the voxel build's `silhouetteIoU`; surgical-vs-GLB is `wholeObjectIoUAfter`. vs-concept (E-13 " +
      "form-baseline) is carried only where it was measured (the text→JSON rows). categorical = an " +
      "IoU-derived band (poor<0.50, fair<0.70, good<0.85, strong≥0.85) appended with the deterministic " +
      "loop verdict for the surgical arms — NOT an independent perceptual judge (none re-run; honest " +
      "residual). Numbers are read from committed upstream records, not recomputed. n=2.",
    bands: BANDS.map(([hi, name]) => ({ below: hi === Infinity ? null : hi, band: name })),
    subjects,
    answers,
    residual,
  };
}

function fmt(x) {
  return typeof x === "number" ? x.toFixed(3) : "—";
}
function sign(x) {
  if (typeof x !== "number") return "—";
  return x > 0 ? `+${x.toFixed(3)}` : x.toFixed(3);
}

function toMarkdown(m) {
  const L = [];
  L.push("# GLB-grounded form — the E-16 three-way head-to-head (T-053-01)");
  L.push("");
  L.push(
    "E-15 measured the form gap against a **flat concept** and the cage refused to fake it. E-16 grounds " +
      "the loop in a **real TRELLIS GLB** (image→3D) and asks three questions: does a 3-D *target* move " +
      "the E-15 loop on text→JSON builds; does **voxelizing** the GLB beat text→JSON on form; do " +
      "**surgical** tweaks on the voxel set add capability? This consolidates the three arms' committed " +
      "records into one table. **Numbers are read from disk, not re-measured.**",
  );
  L.push("");
  L.push(
    "**Headline:** voxelizing the image→3D mesh is the form win (koi +" +
      fmt(m.subjects[0].methods[1].deltaVsTextJson) +
      ", heart +" +
      fmt(m.subjects[1].methods[1].deltaVsTextJson) +
      " vs text→JSON, against the same GLB). The 3-D target moved the text→JSON loop on **1 of 2** " +
      "(heart); **surgical refinement on the already-grounded voxel set added no net whole-object gain** " +
      "(koi regressed, heart held) — the honest diminishing-returns finding.",
  );
  L.push("");
  L.push("## The three-way — whole-object IoU vs the GLB target (E-13 concept as cross-ref)");
  L.push("");
  L.push("| subject | method | IoU vs GLB | IoU vs concept | Δ vs text→JSON | categorical |");
  L.push("|---------|--------|:----------:|:--------------:|:--------------:|-------------|");
  for (const s of m.subjects) {
    for (const r of s.methods) {
      L.push(
        `| ${r === s.methods[0] ? `**${s.subject}**` : ""} | ${r.method} | ${fmt(r.iouVsGlb)} | ${fmt(
          r.iouVsConcept,
        )} | ${r === s.methods[0] ? "—" : sign(r.deltaVsTextJson)} | ${r.categorical} |`,
      );
    }
  }
  L.push("");
  L.push(
    "Bands: poor < 0.50 · fair < 0.70 · good < 0.85 · strong ≥ 0.85 (an IoU reading aid; the surgical " +
      "rows append the deterministic loop verdict). IoU-vs-concept is blank where it was not measured — " +
      "not faked.",
  );
  L.push("");
  L.push("## The three answers (the headline, with evidence)");
  L.push("");
  L.push(`**1. Did the 3-D target move the E-15 loop on text→JSON builds?** ${m.answers.q1_targetMovedTextJsonLoop.answer}`);
  L.push("");
  L.push(m.answers.q1_targetMovedTextJsonLoop.detail);
  L.push("");
  L.push(`**2. Did voxelization beat text→JSON on form?** ${m.answers.q2_voxelizationBeatTextJson.answer}`);
  L.push("");
  L.push(`**3. Did surgical tweaks add capability, and at what cost?** ${m.answers.q3_surgicalAddedCapability.answer}`);
  L.push("");
  L.push(`- koi: ${m.answers.q3_surgicalAddedCapability.koi}`);
  L.push(`- heart: ${m.answers.q3_surgicalAddedCapability.heart}`);
  L.push(`- cost: ${m.answers.q3_surgicalAddedCapability.cost}`);
  L.push("");
  L.push("## The residual (shown, not hidden)");
  L.push("");
  for (const r of m.residual) L.push(`- ${r}`);
  L.push("");
  L.push("## Per-subject detail");
  L.push("");
  for (const s of m.subjects) {
    L.push(`### ${s.subject} — \`${s.glb}\` (E-13 run \`${s.run}\`)`);
    L.push(
      `- **Arm A** (3-D target on text→JSON loop): region IoU ${fmt(s.armA.regionIoUBefore)}→${fmt(
        s.armA.regionIoUAfter,
      )}, whole ${fmt(s.armA.wholeBefore)}→${fmt(s.armA.wholeAfter)} — **${s.armA.verdict}** ${
        s.armA.accepted ? "(edit accepted)" : "(rolled back)"
      }`,
    );
    L.push(
      `- **Synthesis** (surgical on voxel set): whole ${fmt(s.synthesis.wholeBefore)}→${fmt(
        s.synthesis.wholeAfter,
      )} — **${s.synthesis.verdict}** (${s.synthesis.keptCount} kept / ${s.synthesis.rolledBackCount} rolled)`,
    );
    for (const p of s.synthesis.perRegion) {
      L.push(
        `  - ${p.route} on \`${p.defect}\`: region ${fmt(p.before)}→${fmt(p.after)} — ${
          p.accepted ? "accepted" : "rolled back"
        }`,
      );
    }
    L.push("");
  }
  return L.join("\n") + "\n";
}

function main() {
  const model = buildModel();
  writeFileSync(join(HERE, "glb-grounded-ab.json"), JSON.stringify(model, null, 2) + "\n");
  writeFileSync(join(HERE, "glb-grounded-ab.md"), toMarkdown(model));
  console.error("wrote glb-grounded-ab.{json,md}");
}

// main-guard: importable without writing (so a future test can consume buildModel/band).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

// The GAUNTLET: the combined pipeline — the modern harness's strengths (a reference-sheet concept, a spec measured off
// the sheet with an exact MATERIAL MAP, an external keep-the-better pick) + the minecraft-design plugin's agentic,
// code-authored build with matched-view self-critique.
//
//   MC_MODEL_ID=claude-sonnet-5-5 node benchmarks/gauntlet/run.mjs --subject grocery-store [--effort high]
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";
import { generateImage } from "../../src/nano-banana.mjs";
import { makeImage } from "../../src/images.mjs";
import { referenceSheetPrompt } from "../concept-builds/concept-bakeoff.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const PICKER = process.env.MC_PICK_MODEL_ID || "claude-opus-5-5";
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const key = arg("--subject") || arg("--charter"), effort = arg("--effort", "high");
const from = arg("--from");          // reuse an earlier run's concept.jpg + spec.md (isolate toolkit/model changes)
const conceptFile = arg("--concept");   // start from a chosen concept image (e.g. a Charter Row sheet); a spec is written for it
const formOnly = process.argv.includes("--form-only");   // build passes do form only; detailing is a later phase
const respec = process.argv.includes("--respec");   // with --from: keep the concept, write a fresh spec
// --trace x,y,w,h,cols,rows : the front elevation's pixel box on the sheet and its size in blocks. Downsamples it to a
// block grid (trace.png with coordinates + trace.txt of hex colours) that the spec and the builder read as a tracing.
const trace = arg("--trace");
// --native WxH: design the concept AT the build size — the reference sheet is generated as a block drawing that is
// exactly W x H blocks on the front, several candidates, the one most truly on that grid wins (fitGrid), and its front
// is traced 1:1. Nothing is shrunk afterwards.
const native = arg("--native")?.split("x").map(Number);
if (trace && !from && !native && !conceptFile) throw new Error("--trace needs --from (the pixel box is measured on an existing concept)");

export const SUBJECTS = {
  "grocery-store": {
    what: "a neighbourhood grocery store on a town street: a brick shopfront with big display windows, striped awnings, crates and baskets of produce on the sidewalk, a painted shop sign, a recessed entrance, an apartment with windows and flower boxes above, a parapet roofline with a cornice",
    size: "14 blocks wide along the street, 14 deep, two storeys plus parapet (about 12 tall)",
    palette: "red bricks (dominant), white trim in smooth quartz or calcite and dark oak shopfront frames (supporting), striped awnings, a green sign, colourful produce (melons, pumpkins, hay, flowers) (accent)",
  },
  "taj-mahal": {
    what: "the Taj Mahal: a white marble mausoleum on a square raised plinth, four slender minarets at the plinth corners, a great bulbous onion dome with a gold finial on a drum, four smaller domed chhatris around it, a tall pishtaq arch (iwan) recessed into each face with smaller stacked arches beside it, calligraphy bands framing the arches, inlaid decoration",
    size: "a 41 × 41 plinth; the mausoleum about 25 × 25; the dome top about 40 tall; minarets about 34 tall",
    palette: "smooth quartz and calcite (dominant), polished diorite and white terracotta (supporting), gold finials, dark inlay and calligraphy bands, a red-sandstone edge to the plinth (accent)",
  },
  "dance-hall": {
    what: "an art deco dance hall on a city street: a stepped symmetrical facade with tall vertical fins and setbacks, a big illuminated marquee sign over the entrance, a grand entrance under a canopy, tall stained-glass windows, a glimpse of the dance floor and chandeliers through glass, decorative zig-zag and sunburst motifs",
    size: "22 blocks wide along the street, 20 deep, about 16 tall at the central tower",
    palette: "smooth sandstone and white concrete (dominant), black and dark blue terracotta (supporting), gold, coloured stained glass, sea lanterns and glowstone for the marquee (accent)",
  },
};

let s = SUBJECTS[key];
if (!s && arg("--charter")) {
  // a Charter Row building: its brief + the Row style guide (benchmarks/charter-row/row.mjs)
  const { BUILDINGS, STYLE, SCALE } = await import("../charter-row/row.mjs");
  const b = BUILDINGS[arg("--charter")];
  s = { what: `${b.name}: ${b.what}. ${STYLE.read}`, size: `${b.size.w} blocks wide along the street, ${b.size.d} deep, about ${b.size.h} tall. ${SCALE}`,
    palette: `${STYLE.concord} ${STYLE.operator}${b.funding ? " " + STYLE.have_nots : ""}` };
}
if (!s) throw new Error(`--subject one of ${Object.keys(SUBJECTS).join(", ")}`);
const tag = PHASE1_MODEL_ID.replace(/^claude-/, "").replace(/-\d.*$/, "");
const runId = `${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}-${key}-${tag}-${effort}${from ? "-rerun" : ""}${respec ? "-respec" : ""}${trace ? "-trace" : ""}${process.argv.includes("--redraw") ? "-redraw" : ""}${process.argv.includes("--thin") ? "-thin" : ""}${native ? `-native${native.join("x")}` : ""}${process.argv.includes("--views") ? "-views" : ""}${process.argv.includes("--two-pass") ? "-2pass" : ""}${formOnly ? "-form" : ""}`;
const dir = join(HERE, "runs", runId);
mkdirSync(dir, { recursive: true });
const t0 = Date.now(), usage = { cost: 0 }, stages = [];
const mark = (n, e = {}) => { stages.push({ n, s: Math.round((Date.now() - t0) / 1000), ...e }); console.log(`[${key}] ${stages.at(-1).s}s ${n}`, JSON.stringify(e)); };
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });

// 1-2. concept sheet + spec (fresh, or reused with --from)
let concept;
const reuseSpec = from && !respec;
if (conceptFile) {
  concept = join(dir, "concept.jpg");
  execFileSync("magick", [conceptFile, "-quality", "95", concept]);
  mark("concept chosen", { from: conceptFile });
}
if (from) {
  const src = join(HERE, "runs", from);
  concept = join(dir, "concept.jpg");
  writeFileSync(concept, readFileSync(join(src, "concept.jpg")));
}
let traceNote = "", traceSize = null;
if (trace) {
  // --trace auto[:scale] finds the elevation (Gemini box + pixel pitch); --trace x,y,w,h,cols,rows is the manual form
  const { traceElevation, locateWithGemini } = await import("./sheet-trace.mjs");
  const spec_ = arg("--trace");
  let t;
  if (spec_.startsWith("auto")) {
    const scale = Number(spec_.split(":")[1] || 1);
    t = traceElevation(concept, dir, { scale, box: await locateWithGemini(concept) });
    if (process.argv.includes("--redraw")) {
      // right-size by DESIGN, not by averaging: the image model redraws the elevation as pixel art on the target grid,
      // making the simplification choices (which fins to keep, how the spire reads); the tracer then checks the grid
      const [gc, gr] = (arg("--grid") || `${t.cols}x${t.rows}`).split("x").map(Number);
      // a "sprite" prompt (make a WxH sprite, show it nearest-neighbour enlarged) holds the grid far better than "redraw on
      // a grid" (which draws grid lines and paints half-cells inside them); several candidates, keep the one that is
      // most truly drawn on the grid (flattest cells, fitGrid)
      const prompt = `Make a ${gc}x${gr} pixel sprite of the FRONT ELEVATION of the building in the attached reference sheet, then show it enlarged with nearest-neighbour scaling so every sprite pixel is a big crisp square. ${gc} pixels wide, ${gr} tall, flat colours only, no grid lines, no shading, no text, plain light-grey background. Simplify to fit like an architect drawing at small scale: keep the silhouette, the main rhythm, the focal features and the colour scheme; merge or drop detail that cannot be one pixel or more.`;
      const { fitGrid } = await import("./sheet-trace.mjs");
      const cands = await Promise.all([1, 2, 3].map(async (attempt) => {
        const r = await makeImage({ prompt, images: [{ base64: readFileSync(concept).toString("base64"), mediaType: "image/jpeg" }], variant: `redraw-${attempt}`, purpose: `${key} redraw ${gc}x${gr} #${attempt}` });
        const rp = join(dir, `redraw-${attempt}.${r.mediaType === "image/png" ? "png" : "jpg"}`);
        writeFileSync(rp, Buffer.from(r.base64, "base64"));
        const fit = fitGrid(rp, join(dir, `redraw-${attempt}-trace`), await locateWithGemini(rp), gc, gr);
        mark("redraw", { attempt, ...fit });
        return { rp, fit, attempt };
      }));
      const best = cands.sort((x, y) => x.fit.score - y.fit.score)[0];
      for (const f of ["trace.txt", "trace.png", "trace-raw.png"]) writeFileSync(join(dir, f), readFileSync(join(dir, `redraw-${best.attempt}-trace`, f)));
      writeFileSync(join(dir, "redraw.png"), readFileSync(best.rp));
      t = { ...best.fit, redrawErr: best.fit.score, redrawPick: best.attempt, measuredFromConcept: `${t.cols}x${t.rows}` };
      mark("redraw pick", { attempt: best.attempt, cols: t.cols, rows: t.rows, score: t.score });
    }
  } else {
    const [x, y, w, h, cols, rows] = spec_.split(",").map(Number);
    t = traceElevation(concept, dir, { box: { x, y, w, h }, cols, rows });
  }
  writeFileSync(join(dir, "trace.json"), JSON.stringify(t, null, 1) + "\n");
  traceNote = (t.redrawErr !== undefined ? "redraw.png is the concept's front elevation redrawn by design at the build's true block size; " : "") +
    `trace.png / trace.txt: the front elevation downsampled to a ${t.cols} x ${t.rows} block grid (x left to right, y=0 at the ground). ` +
    `It is a TRACING: use it for the outline, the position and size of every feature, and the colour regions, block by block.` +
    (t.scale > 1 ? ` The building is built at ${t.scale}x the concept's block scale, so each concept block is ${t.scale}x${t.scale} blocks here: ` +
      `use the extra resolution for the detail the concept draws within a block (thin fins, mouldings, insets, sub-block steps), and scale depth by ${t.scale} too.` : "");
  traceSize = [t.cols, t.rows];
  mark("trace", { cols: t.cols, rows: t.rows, scale: t.scale, pitch: t.pitch, box: t.box });
}
if (reuseSpec) {
  writeFileSync(join(dir, "spec.md"), readFileSync(join(HERE, "runs", from, "spec.md")));
  mark("concept + spec reused", { from });
} else if (!from && native) {
  const [gc, gr] = native;
  const { fitGrid, locateWithGemini, findElevation } = await import("./sheet-trace.mjs");
  const conceptPrompt = referenceSheetPrompt({ ...s, size: `EXACTLY ${gc} blocks wide and ${gr} blocks tall on the front elevation, about ${Math.round(gc * 0.9)} deep` }) +
    ` DESIGNED AT THIS EXACT SIZE: draw both views as a clear block drawing where every block is one equal, clearly visible square (${gc} squares across the front, ${gr} up),` +
    " every feature a whole number of blocks and nothing thinner than one block. Design the detail to fit this size, the way a skilled builder plans a build of this size:" +
    " choose a few strong elements that read at this scale rather than fine detail that cannot fit. No grid lines, no text labels.";
  writeFileSync(join(dir, "concept.prompt.txt"), conceptPrompt + "\n");
  const cands = await Promise.all([1, 2, 3, 4].map(async (n) => {
    const c = await generateImage({ prompt: conceptPrompt });
    const cp = join(dir, `concept-${n}.${c.mediaType === "image/jpeg" ? "jpg" : "png"}`);
    writeFileSync(cp, Buffer.from(c.base64, "base64"));
    try {
      // measure the size it was REALLY drawn at (block pitch), then fit/trace the grid at that size; fitGrid alone only
      // searches near the target and cannot see a concept drawn at the wrong size
      const box = await locateWithGemini(cp);
      const m = findElevation(cp, box);
      const sizeErr = Math.max(Math.abs(m.cols - gc) / gc, Math.abs(m.rows - gr) / gr);
      const fit = fitGrid(cp, join(dir, `concept-${n}-trace`), box, m.cols, m.rows, { spread: 1 });
      mark("native concept", { n, measured: `${m.cols}x${m.rows}`, sizeErr: +sizeErr.toFixed(2), ...fit });
      return { cp, fit: { ...fit, sizeErr }, n };
    } catch (e) { mark("native concept failed", { n, e: String(e).slice(0, 120) }); return null; }
  }));
  // closest to the target size wins; grid flatness breaks near-ties
  const best = cands.filter(Boolean).sort((a, b) => (a.fit.sizeErr + a.fit.score / 1000) - (b.fit.sizeErr + b.fit.score / 1000))[0];
  concept = join(dir, "concept" + best.cp.slice(best.cp.lastIndexOf(".")));
  writeFileSync(concept, readFileSync(best.cp));
  for (const f of ["trace.txt", "trace.png", "trace-raw.png"]) writeFileSync(join(dir, f), readFileSync(join(dir, `concept-${best.n}-trace`, f)));
  writeFileSync(join(dir, "trace.json"), JSON.stringify({ ...best.fit, pick: best.n, native }, null, 1) + "\n");
  traceNote = `trace.png / trace.txt: the concept's front elevation read cell by cell at its designed size of ${best.fit.cols} x ${best.fit.rows} blocks (x left to right, y=0 at the ground). ` +
    `It is a TRACING: use it for the outline, the position and size of every feature, and the colour regions, block by block.`;
  traceSize = [best.fit.cols, best.fit.rows];
  mark("native pick", { n: best.n, cols: best.fit.cols, rows: best.fit.rows, score: best.fit.score });
} else if (!from && !conceptFile) {
  const conceptPrompt = referenceSheetPrompt(s);
  writeFileSync(join(dir, "concept.prompt.txt"), conceptPrompt + "\n");
  const c = await generateImage({ prompt: conceptPrompt });
  concept = join(dir, c.mediaType === "image/jpeg" ? "concept.jpg" : "concept.png");
  writeFileSync(concept, Buffer.from(c.base64, "base64"));
  mark("concept", { model: c.model });
}
// --views: the image model also draws a SIDE ELEVATION and a DEPTH MAP of the front from the concept, each traced on
// its grid, so the sides and the relief get the same fidelity as the coloured front
let viewsNote = "";
if (process.argv.includes("--views") && traceSize) {
  const { makeViews } = await import("./views.mjs");
  const v = await makeViews(concept, dir, traceSize[0], traceSize[1], Math.round(traceSize[0] * 0.9));
  mark("views", { side: v.side && `${v.side.cols}x${v.side.rows}`, depth: v.depth && `${v.depth.cols}x${v.depth.rows}` });
  if (v.side) viewsNote += `side.png / side-trace.png / side-trace.txt: the SIDE ELEVATION, traced at ${v.side.cols} deep x ${v.side.rows} tall. ` +
    `It shows the side wall on your right when you face the front (the -x / west wall; it is what 'mcd render' calls right-elevation): column x=0 is the FRONT edge, ` +
    `higher columns go back (+z); y=0 is the ground. Its column count is the building's depth. It is a rough sketch: take from it the SILHOUETTE (roof and step profile), ` +
    `the storey and band lines, and the RHYTHM of piers and openings, not every cell; the craft (frames, sills, piers with depth, sub-block detail) is yours. Mirror it for the other side. `;
  if (v.depth) viewsNote += `depth.png / depth.txt: a DEPTH MAP of the front at ${v.depth.cols} x ${v.depth.rows}: for every front cell, how many blocks it sits proud of (+) or recessed from (-) the main wall plane. ` +
    `Use it for the relief: fins, piers, mouldings, reveals, recessed openings. Same-colour features (cream on cream) exist ONLY in this map, so follow it. `;
}

if (!reuseSpec) {
  // 2. spec measured off the sheet, with an exact material map
  const specPrompt = [
    "You are a master Minecraft architect. ATTACHED is a builder's reference sheet (front elevation left, 3/4 right). Write a BUILD SPEC that",
    "lets another builder reproduce it faithfully. Use these sections:",
    "1. Identity (one line).",
    "2. Footprint and height in blocks. The sheet is drawn in blocks: measure the block pitch and COUNT blocks off the front elevation.",
    "   If your counts disagree with the stated size, THE SHEET WINS: keep the sheet's proportions (scale uniformly if you must), never squash one axis",
    "   to fit a stated number — squashing destroys the tall/slender features that make the design.",
    ...(traceNote ? [`   ${traceNote} Its grid size is authoritative for width and height.`] : []),
    ...(viewsNote ? [`   ${viewsNote} The side elevation's width is authoritative for depth; describe the side walls and the front's depth layers from these.`] : []),
    "3. Vertical zones bottom to top with heights in blocks; horizontal bays left to right with widths in blocks; the roof/top form and its edges.",
    "4. MATERIAL MAP: a table mapping every distinct colour/texture region you can see on the sheet to an exact vanilla 1.20+ block id",
    "   (e.g. 'cream wall field → smooth_sandstone', 'gold trim → gold_block'), with where each region is. Match the sheet's materials, not generic ones.",
    "   Read materials from the CONCEPT SHEET (image 1) only; the tracing (image 2) is flattened for layout and its colours are not the materials.",
    "5. Features and where they sit (doors, windows, signs, ornaments, props), in block coordinates from the front-left ground corner.",
    "6. Depth plan: what projects and recesses, by how much.",
    `Stated subject: ${s.what}. Stated size: ${native ? `${native[0]} wide x ${native[1]} tall on the front (the concept was designed at this size)` : s.size}.`,
    "Under ~600 words. Output ONLY the spec (markdown).",
  ].join("\n");
  const spec = await requestTextWithImage({ prompt: specPrompt, images: [img(concept), ...(trace || native ? [img(join(dir, "trace.png"))] : []), ...(viewsNote ? ["side-trace.png", "depth.png"].filter((f) => existsSync(join(dir, f))).map((f) => img(join(dir, f))) : [])], model: PHASE1_MODEL_ID, effort });
  usage.cost += spec.raw?.total_cost_usd || 0;
  writeFileSync(join(dir, "spec.md"), spec.text + "\n");
  mark("spec");

}

// 3. agentic build with the plugin (two rounds saved, or two passes: front, then sides/back/roof)
const thinRules = process.argv.includes("--thin") ? [
  "SIZE IS FIXED: do not scale the building up to fit detail. Detail finer than a block goes into SUB-BLOCK parts, the way skilled builders detail small builds:",
  "a thin vertical line or fin → wall / fence / glass pane / iron bars or a trapdoor on the face; a half-height ledge, sill or step → slab;",
  "a diagonal or sloped edge → stairs (with the right facing and half); small ornaments → buttons, heads, lanterns, end rods, banners.",
  "Separate neighbouring elements by DEPTH, not only colour: push alternate fins/piers 1 block proud, recess windows 1, so each casts its own shadow.",
] : [];
const formRules = formOnly ? [
  "FORM ONLY: this pass builds the FORM, a later detail pass adds the craft. Use FULL BLOCKS (plus glass, panes, doors and anything functional);",
  "no stairs, slabs, walls, fences, trapdoors, lanterns, buttons, banners or trim. Get exactly right: the outline and roofline, the storeys and bays,",
  "every opening's position and size, the depth layers (what is proud, flush, recessed), and the material of each zone. Leave plain surfaces plain.",
] : [];
const geometry = [
  "Geometry: the main front faces NORTH (−z); x runs along the street; y = 0 is the ground. MIRROR TRAP: a person on the street looks SOUTH, so their",
  "left is world +x: a front tracing's column c (left to right as drawn) is world x = W−1−c, not x = c. Asymmetric fronts come out mirrored if you",
  "forget; check the rendered front-elevation.png against the tracing's left/right. Author it as code (mcd new build.mjs; design one bay,",
  "tile it, mirror for symmetry). For curved and stepped forms use the build library's SHAPE BRUSHES (see the skill's references/shapes-curved.md",
  "and references/shapes-massing.md: dome, cylinder, minaret, arch, setbacks, gableRoof, hipRoof, fins, parapet, cornice) instead of placing those",
  "blocks by hand.",
];
const base = [
  "Load and follow the minecraft-design skill. Build the building shown in concept.jpg (left: front elevation, right: 3/4 view) as structure",
  "files in this directory, following spec.md (its sizes and its MATERIAL MAP are binding: use exactly those block ids for those regions).",
  "Where spec.md and concept.jpg disagree on form, the CONCEPT wins.",
  "MATERIALS AND COLOURS come from concept.jpg: redraw.png and the tracings are simplified for LAYOUT and SIZE only (their flat greys and sky-blue",
  "glass are not the concept's materials). Match the concept's tones: warm vs cold, light vs dark, the stone, timber, glass and trim it actually shows.",
];
// concept front box (for the palette check the builders run each round)
let paletteCmd = "";
{
  const { locateWithGemini } = await import("./sheet-trace.mjs");
  try {
    const b = await locateWithGemini(concept);
    paletteCmd = `node ${join(HERE, "palette-check.mjs")} concept.jpg <tiles>/front-elevation.png --box ${b.x},${b.y},${b.w},${b.h}`;
  } catch { /* no palette check if the front can't be located */ }
}
const paletteRule = paletteCmd ? [
  "COLOUR CHECK every round: run `" + paletteCmd + "` (replace <tiles>). It compares your front with the concept zone by zone and lists drifts",
  "('middle centre: concept light cream, build dark grey'). Fix every drift it reports unless the concept truly differs; aim for mean ΔE under 10.",
] : [];
// DEFINING SHAPES: the two to four forms that make the building recognisable, each with the build-library tool that makes it
let shapesNote = "";
if (formOnly || process.argv.includes("--two-pass")) {
  const r = await requestTextWithImage({
    prompt: "Image 1 is a Minecraft building concept. Name its 2-4 DEFINING SHAPES: the forms that make it recognisable and that a builder must not lose " +
      "(e.g. 'three round arches across the ground-floor arcade', 'a triangular pediment over the centre bay', 'a stepped tower'). For each: where it is, " +
      "its size in blocks for a front about " + (traceSize ? `${traceSize[0]} x ${traceSize[1]}` : "the stated size") + ", and the build-library tool that makes it " +
      "(arch, dome, setbacks, gableRoof, hipRoof, fins, parapet, cornice, stepGable, falseFront, cylinder). Reply as a short numbered list, nothing else.",
    images: [img(concept)], model: PHASE1_MODEL_ID, effort: "low",
  });
  usage.cost += r.raw?.total_cost_usd || 0;
  shapesNote = "DEFINING SHAPES (must be built, with the named shape tool, and checked in every render):\n" + r.text.trim();
  writeFileSync(join(dir, "shapes.md"), shapesNote + "\n");
  mark("defining shapes");
}
const runAgent = (prompt, label) => {
  const r = spawnSync("claude", ["-p", "--plugin-dir", PLUGIN, "--model", PHASE1_MODEL_ID, "--effort", effort,
    "--allowedTools", "Bash Read Write Edit Glob Grep", "--output-format", "json", prompt], { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let o = {};
  try { o = JSON.parse(r.stdout); } catch { o = { result: r.stdout?.slice(0, 2000), error: r.stderr?.slice(0, 2000) }; }
  usage.cost += o.total_cost_usd || 0;
  mark(label, { turns: o.num_turns, cost: o.total_cost_usd });
  return o.result || "";
};
const twoPass = process.argv.includes("--two-pass");
if (twoPass) {
  // PASS 1 — the front: tracing + depth map, one focused job. PASS 2 — a fresh session designs the sides, back and roof
  // from the side elevation's silhouette and rhythm, keeping the front unchanged. Each pass gets the attention it needs.
  const pass1 = [
    ...base,
    "THIS PASS IS THE FRONT ONLY (a second pass will design the sides, back and roof). Build the whole volume so it stands (the side elevation's depth,",
    "plain side walls and a simple flat roof are fine for now), and put all your care into the FRONT FACE and its relief.",
    ...(traceNote ? [traceNote + " Build the front face to match the tracing cell for cell."] : []),
    ...(viewsNote.includes("depth.txt") ? ["depth.png / depth.txt: a DEPTH MAP of the front: for every front cell, how many blocks it sits proud of (+) or recessed from (-) the main wall plane. " +
      "Build the relief from it: fins, piers, mouldings, reveals, recessed openings. Same-colour features (cream on cream) exist ONLY in this map, so follow it."] : []),
    ...(shapesNote ? [shapesNote] : []), ...paletteRule,
    ...thinRules, ...formRules, ...geometry,
    "ROUND 1: build, save round-1.nbt, render: mcd render round-1.nbt --front n --tiles r1-tiles. Compare r1-tiles/front-elevation.png with trace.png and",
    "concept.jpg, and r1-tiles/front-left.png with the 3/4 view, cell by cell for the front: list the mismatches (outline, zones, openings, colours, relief).",
    "Fix them in build.mjs and re-render until the front matches, then save the final as round-1.nbt (overwrite). Keep build.mjs readable: the front in",
    "its own clearly named function, so the next pass can change the sides without touching it. Report in ≤6 lines.",
  ].join(" ");
  const rep1 = runAgent(pass1, "pass 1 (front)");
  const pass2 = [
    ...base,
    "A first pass built the FRONT in build.mjs (saved as round-1.nbt). THIS PASS designs the SIDES, the BACK and the ROOF. Do NOT change the front face:",
    "its front elevation must render the same as round-1.",
    ...(viewsNote.includes("side-trace") ? [viewsNote.split("depth.png")[0]] : []),
    "Read the concept's 3/4 view for how the side meets the front and how the roof steps; give the side walls the same quality as the front: the side",
    "elevation's silhouette, storey and band lines and bay rhythm, piers and frames with depth, a designed roof (steps, parapets, copings), and a back",
    "that finishes the building (it can be simpler).",
    ...paletteRule, ...thinRules, ...formRules, ...geometry,
    "Render: mcd render round-2.nbt --front n --tiles r2-tiles. Compare r2-tiles/right-elevation.png with side-trace.png and r2-tiles/front-left.png with",
    "the 3/4 view; fix the biggest mismatches, re-render, and save the final as round-2.nbt. Keep round-1.nbt untouched. Report in ≤6 lines.",
  ].join(" ");
  const rep2 = runAgent(pass2, "pass 2 (sides, back, roof)");
  writeFileSync(join(dir, "agent-report.md"), `## Pass 1 (front)\n\n${rep1}\n\n## Pass 2 (sides, back, roof)\n\n${rep2}\n`);
} else {
const agentPrompt = [
  ...base,
  ...(traceNote ? [traceNote + " Build the front face to match the tracing cell for cell (then add the depth the 3/4 view shows), and compare your front elevation against trace.png in each round."] : []),
  ...(viewsNote ? [viewsNote + "In each round also compare r*-tiles/right-elevation.png with side-trace.png, and check the front's relief against depth.txt."] : []),
  ...thinRules, ...geometry,
  "Get the silhouette and massing right first (critique the 3/4 view for massing before details).",
  "ROUND 1: build, save round-1.nbt, then render: mcd render round-1.nbt --front n --tiles r1-tiles. Read r1-tiles/front-elevation.png and",
  "r1-tiles/front-left.png next to concept.jpg and list the biggest mismatches (silhouette, roof, zones, bays, openings, materials, depth).",
  "ROUND 2: fix them, save round-2.nbt, render it the same way (r2-tiles), and compare again.",
  "Keep BOTH files. Report in ≤8 lines: what you built, the mismatches you fixed, which round you think is better and why.",
].join(" ");
writeFileSync(join(dir, "agent-report.md"), runAgent(agentPrompt, "agentic build") + "\n");
}

// 4. external keep-the-better on matched composites
const rounds = ["round-1", "round-2"].filter((r) => existsSync(join(dir, `${r}.nbt`)));
const composites = {};
for (const r of rounds) {
  const tiles = join(dir, `${r}-judge-tiles`);
  execFileSync("node", [MCD, "render", join(dir, `${r}.nbt`), "--front", "n", "--out", join(dir, `${r}-sheet.png`), "--tiles", tiles], { stdio: "ignore" });
  composites[r] = join(dir, `${r}-matched.png`);
  execFileSync("magick", ["(", concept, "-resize", "x420", ")", "(", join(tiles, "front-elevation.png"), "-resize", "x420", ")",
    "(", join(tiles, "front-left.png"), "-resize", "x420", ")",
    ...(existsSync(join(dir, "side.png")) ? ["(", join(dir, "side.png"), "-resize", "x420", ")", "(", join(tiles, "right-elevation.png"), "-resize", "x420", ")"] : []),
    "+append", composites[r]]);
}
let kept = rounds.at(-1), why = "only one round";
if (rounds.length === 2) {
  const p = await requestTextWithImage({
    prompt: (existsSync(join(dir, "side.png")) ? "Two builds of the same building, each shown as [reference sheet | build front elevation | build 3/4 | reference side elevation | build side elevation]. " :
      "Two builds of the same building, each shown as [reference sheet | build front elevation | build 3/4]. ") + "Image 1 = build A, image 2 = build B. " +
      "Which build better matches the reference sheet (form, roof, materials, details) AND is better crafted? Reply ONLY JSON: {\"better\": \"A\"|\"B\", \"why\": \"one sentence\"}",
    images: [img(composites["round-1"]), img(composites["round-2"])], model: PICKER,
  });
  usage.cost += p.raw?.total_cost_usd || 0;
  const j = JSON.parse(p.text.slice(p.text.indexOf("{"), p.text.lastIndexOf("}") + 1));
  kept = j.better === "A" ? "round-1" : "round-2"; why = j.why;
}
if (kept) { writeFileSync(join(dir, "final.nbt"), readFileSync(join(dir, `${kept}.nbt`))); }
mark("keep-better", { kept, why });
writeFileSync(join(dir, "summary.json"), JSON.stringify({ runId, subject: key, model: PHASE1_MODEL_ID, effort, kept, why, rounds, costUsd: usage.cost,
  durationMs: Date.now() - t0, stages }, null, 1) + "\n");
console.log(`[${key}] done: kept ${kept}, $${usage.cost.toFixed(2)}, ${Math.round((Date.now() - t0) / 1000)}s`);

// More views of the same design than the front: the image model draws, from the concept sheet, (1) a SIDE ELEVATION
// sprite at depth x height and (2) a DEPTH MAP of the front at width x height in five grey levels, so the builder gets
// the sides and the relief, which a coloured front tracing cannot carry. Each is traced on its grid like the front.
//   node benchmarks/gauntlet/views.mjs <concept> <out-dir> <W>x<H> <D>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateImage } from "../../src/nano-banana.mjs";
import { locateWithGemini, findElevation, fitGrid } from "./sheet-trace.mjs";

// depth levels: grey value -> blocks proud of the main wall plane (+ forward, - recessed)
export const DEPTH_LEVELS = [[255, 2], [192, 1], [128, 0], [64, -1], [0, -2]];
const BG = "pure bright green (#00ff00)";

const sprite = (what, w, h, rules) =>
  `Make a ${w}x${h} pixel sprite of ${what} of the building in the attached Minecraft builder's reference sheet, then show it enlarged with nearest-neighbour ` +
  `scaling so every sprite pixel is a big crisp square. Exactly ${w} pixels wide and ${h} tall; one pixel = one block. ${rules} ` +
  `Flat colours only, no grid lines, no shading, no text, background ${BG}. It must be the SAME building as the sheet: same height, same storeys, same roof, same features.`;

export function prompts(W, H, D) {
  return {
    side: sprite("the RIGHT SIDE ELEVATION (straight-on orthographic view of the right side wall; the front of the building is at the LEFT edge, the back at the right)", D, H,
      "Show the side wall's real design as the 3/4 view suggests (piers, windows, bands, roof steps, the profile of anything that projects at the front), not a blank wall."),
    depth: sprite("a DEPTH MAP of the FRONT ELEVATION", W, H,
      "Same outline and layout as the front elevation, but each pixel's grey shows how far that block sits from the main wall plane: white = 2 blocks forward, light grey (#c0c0c0) = 1 forward, mid grey (#808080) = on the wall plane, dark grey (#404040) = 1 recessed, black = 2 or more recessed (deep openings, doorways). Use ONLY these five greys."),
  };
}

async function best(kind, concept, dir, w, h, prompt, n = 3) {
  const cands = await Promise.all(Array.from({ length: n }, async (_, i) => {
    const r = await generateImage({ prompt, images: [{ base64: readFileSync(concept).toString("base64"), mediaType: /\.png$/.test(concept) ? "image/png" : "image/jpeg" }] });
    const p = join(dir, `${kind}-${i + 1}.${r.mediaType === "image/png" ? "png" : "jpg"}`);
    writeFileSync(p, Buffer.from(r.base64, "base64"));
    try {
      const box = await locateWithGemini(p, undefined, kind === "side" ? "the SIDE ELEVATION sprite of the building" : "the DEPTH MAP sprite of the building");
      const m = findElevation(p, box);
      const sizeErr = Math.max(Math.abs(m.cols - w) / w, Math.abs(m.rows - h) / h);
      const fit = fitGrid(p, join(dir, `${kind}-${i + 1}-trace`), box, m.cols, m.rows, { spread: 1 });
      return { p, i: i + 1, sizeErr, ...fit };
    } catch (e) { return null; }
  }));
  const ok = cands.filter(Boolean).sort((a, b) => (a.sizeErr + a.score / 1000) - (b.sizeErr + b.score / 1000));
  return { pick: ok[0], all: ok.map(({ i, sizeErr, score, cols, rows }) => ({ i, sizeErr: +sizeErr.toFixed(2), score, cols, rows })) };
}

export async function makeViews(concept, dir, W, H, D) {
  mkdirSync(dir, { recursive: true });
  const P = prompts(W, H, D);
  const [side, depth] = await Promise.all([best("side", concept, dir, D, H, P.side), best("depth", concept, dir, W, H, P.depth)]);
  const out = {};
  if (side.pick) {
    for (const f of ["trace.txt", "trace.png"]) writeFileSync(join(dir, `side-${f}`), readFileSync(join(dir, `side-${side.pick.i}-trace`, f)));
    writeFileSync(join(dir, "side.png"), readFileSync(side.pick.p));
    out.side = { cols: side.pick.cols, rows: side.pick.rows, cands: side.all };
  }
  if (depth.pick) {
    // quantise each traced cell to the nearest depth level; background (green) -> "."
    const lines = readFileSync(join(dir, `depth-${depth.pick.i}-trace`, "trace.txt"), "utf8").trim().split("\n").slice(1);
    const rows = lines.map((l) => {
      const [label, ...cells] = l.split(" ");
      return label + " " + cells.map((hx) => {
        const r = parseInt(hx.slice(0, 2), 16), g = parseInt(hx.slice(2, 4), 16), b = parseInt(hx.slice(4, 6), 16);
        if (g > 160 && r < 120 && b < 120) return " .";
        const v = (r + g + b) / 3;
        const lv = DEPTH_LEVELS.reduce((a, c) => (Math.abs(c[0] - v) < Math.abs(a[0] - v) ? c : a))[1];
        return (lv > 0 ? "+" : lv < 0 ? "-" : " ") + Math.abs(lv);
      }).join(" ");
    });
    writeFileSync(join(dir, "depth.txt"), [`# front depth map at ${depth.pick.cols} x ${depth.pick.rows}: blocks proud of the main wall plane (+2 forward .. -2 recessed, 0 = wall plane, . = outside the building); first row = top`, ...rows].join("\n") + "\n");
    writeFileSync(join(dir, "depth.png"), readFileSync(depth.pick.p));
    writeFileSync(join(dir, "depth-trace.png"), readFileSync(join(dir, `depth-${depth.pick.i}-trace`, "trace.png")));
    out.depth = { cols: depth.pick.cols, rows: depth.pick.rows, cands: depth.all };
  }
  writeFileSync(join(dir, "views.json"), JSON.stringify(out, null, 1) + "\n");
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [concept, dir, wh, d] = process.argv.slice(2);
  const [W, H] = wh.split("x").map(Number);
  console.log(JSON.stringify(await makeViews(concept, dir, W, H, Number(d))));
}

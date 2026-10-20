import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1335587034";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, HT = 19, D = 36;
const g = new Voxels([W, HT, D]);

// footprint lookup: "x,z" -> ground
const G = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  if (gr > maxG) maxG = gr;
}
const has = (x, z) => G.has(`${x},${z}`);

// Roof: record says roof ~7 blocks above lowest ground -> walls top at y=6 on lowest ground.
// Clamped so downhill foundations and the penthouse stay inside the volume.
const top = Math.min(HT - 4, Math.max(6, maxG + 5));

const PANE_X = (n, s) => ({ north: n, south: s, east: "false", west: "false", waterlogged: "false" });

for (const [x, z, b] of cells) {
  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  const wF = !has(x - 1, z), eF = !has(x + 1, z);
  const nF = !has(x, z - 1), sF = !has(x, z + 1);
  const perim = wF || eF || nF || sF;
  const xFace = wF || eF;               // facade runs along z
  const corner = (wF || eF) && (nF || sF);
  const along = xFace ? z : x;
  const shop = wF;                      // west face is the street shopfront

  if (!perim) {
    // interior: floor slabs and roof deck only, no interior fit-out
    g.set(x, b, z, "smooth_stone");
    if (b + 3 < top) g.set(x, b + 3, z, "smooth_stone");
    g.set(x, top, z, "smooth_stone");
    continue;
  }

  for (let y = b; y <= top; y++) {
    // main entrance on the street face
    if (shop && !corner && along === 17 && (y === b || y === b + 1)) {
      g.set(x, y, z, "oak_door", {
        facing: "west",
        half: y === b ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (y === top) {                    // cornice / parapet
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y === b) {                      // base course
      g.set(x, y, z, shop && !corner ? "polished_granite" : "polished_granite");
      continue;
    }
    if (y === b + 3) {                  // storey line
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    const groundBand = y < b + 3;
    const frame = corner || (shop && groundBand && along % 6 === 0) || (!(shop && groundBand) && along % 3 === 0);

    if (frame) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (shop && groundBand) {
      // shopfront glazing: full glass blocks
      g.set(x, y, z, "glass");
      continue;
    }

    // upper and non-shop ground windows: glass panes
    g.set(x, y, z, "glass_pane", PANE_X(xFace ? "true" : "false", xFace ? "true" : "false"));
    if (xFace) {
      // pane connects along z
    } else {
      g.set(x, y, z, "glass_pane", {
        north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
      });
    }

    // some windows lit: glowstone one cell inside, behind the glass
    if ((along * 7 + y * 13 + x * 3 + z * 5) % 9 === 0) {
      const ix = wF ? x + 1 : eF ? x - 1 : x;
      const iz = wF || eF ? z : nF ? z + 1 : z - 1;
      if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }
}

// rooftop penthouse and mechanical plant on the roof
for (let x = 2; x <= 5; x++) {
  for (let z = 13; z <= 22; z++) {
    if (!has(x, z)) continue;
    for (let y = top + 1; y <= top + 2; y++) {
      g.set(x, y, z, (x === 2 || x === 5 || z === 13 || z === 22) ? "light_gray_concrete" : "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

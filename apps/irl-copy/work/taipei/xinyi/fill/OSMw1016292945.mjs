import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016292945";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Mid-rise 1980s-90s Xinyi office block: five storeys (ground + four), a
// setback top tier (inset 2 blocks), a terrace parapet, a grey-tile base, a
// white-concrete mullion grid with blue-tinted glass, and a plant box on the roof.
const W = 22, H = 38, D = 20;
const ROOF = 26;
const DOOR_X = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const INSET = (x, z) => x >= 2 && x <= 19 && z >= 2 && z <= 17;

// One facade block. fb/tb = storey floor and top levels; zF/xF = which faces the
// cell sits on; dx/dz = inward offset to the room behind the glass; base = mullion grid origin.
function facade(x, y, z, fb, tb, zF, xF, dx, dz, base, gnd) {
  const off = y - fb;
  const h = tb - fb;
  const s = zF ? x : z;
  const corner = zF && xF;

  // Entrance: double-height door on the front (z = 0) ground bay.
  if (gnd && zF && !xF && z === 0 && x === DOOR_X && off <= 1 && h >= 3) {
    g.set(x, y, z, "oak_door", {
      facing: "south",
      half: off === 0 ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    return;
  }
  if (off === 0) { g.set(x, y, z, gnd ? "gray_concrete" : "light_gray_concrete"); return; }
  if (off === h - 1) { g.set(x, y, z, "light_gray_concrete"); return; }
  if (corner) { g.set(x, y, z, "white_concrete"); return; }
  // Lintel / canopy band over the entrance.
  if (gnd && zF && z === 0 && off === 2 && h >= 4 && x >= 8 && x <= 12) {
    g.set(x, y, z, "white_concrete");
    return;
  }
  if (((s - base) % 3 + 3) % 3 === 0) { g.set(x, y, z, "white_concrete"); return; }

  const glass = (x + y + z) % 5 === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
  const props = zF
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  g.set(x, y, z, glass, props);

  // Warm light in the room behind some window bays.
  if (off === 2 && ((s - base) % 6 + 6) % 6 === 4) {
    const ix = x + dx, iz = z + dz;
    if (inFp(ix, iz)) g.set(ix, y, iz, "glowstone");
  }
}

for (const [x, z, gc] of cells) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  // Floor levels for this cell: its ground, then the absolute storey lines.
  const lv = [gc, ...[5, 10, 15, 20].filter(v => v > gc)];
  for (const f of lv) if (f <= 20) g.set(x, f, z, "smooth_stone");

  const zF = !inFp(x, z - 1) || !inFp(x, z + 1);
  const xF = !inFp(x - 1, z) || !inFp(x + 1, z);
  const isFullEdge = zF || xF;
  const fullDx = xF ? (!inFp(x - 1, z) ? 1 : -1) : 0;
  const fullDz = zF ? (!inFp(x, z - 1) ? 1 : -1) : 0;

  // Full-footprint tiers: storeys from ground up to the 20 line.
  for (let y = gc; y <= 19; y++) {
    if (!isFullEdge) continue;
    const fb = Math.max(...lv.filter(v => v <= y));
    const tb = lv.find(v => v > y) ?? 20;
    facade(x, y, z, fb, tb, zF, xF, fullDx, fullDz, 0, fb === gc);
  }

  const ins = INSET(x, z);
  const zF2 = z === 2 || z === 17;
  const xF2 = x === 2 || x === 19;
  const insEdge = ins && (zF2 || xF2);
  const insDx = xF2 ? (x === 2 ? 1 : -1) : 0;
  const insDz = zF2 ? (z === 2 ? 1 : -1) : 0;

  // Terrace line at 20: spandrel on the edges, floor slab elsewhere.
  if (gc <= 20 && (isFullEdge || insEdge)) g.set(x, 20, z, "light_gray_concrete");

  // Setback top storey (20..24) on the inset perimeter.
  if (insEdge) {
    for (let y = 21; y <= 24; y++) {
      facade(x, y, z, 20, 25, zF2, xF2, insDx, insDz, 2, false);
    }
    g.set(x, 26, z, "white_concrete");
  }

  // Terrace parapet around the outer ring.
  if (isFullEdge && !ins) g.set(x, 21, z, "light_gray_concrete");

  // Roof deck over the setback tier.
  if (ins) g.set(x, 25, z, "gray_concrete");

  // Plant box and lightning mast on the roof.
  if (ins && x >= 8 && x <= 13 && z >= 7 && z <= 12) {
    g.set(x, 26, z, "light_gray_concrete");
    g.set(x, 27, z, "light_gray_concrete");
  }
  if (ins && x === 10 && z === 9) g.set(x, 28, z, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);

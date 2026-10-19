// 16 West 47th Street (1924), a commercial and office building: a one-storey street front along 47th, a stepped
// limestone-and-brick office block rising in setbacks to a 16-storey tower with a penthouse. Built from the lidar roof
// per cell, median-smoothed and quantised to storey-multiple tiers, so every tier is solid from y 0 up (nothing floats).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034341.cells.json`, "utf8"));
const W = 28, D = 27, Y = 65;

// --- footprint, smoothed roof tiers -----------------------------------------------------------------------------------
const roof = new Map();                                    // "x,z" -> lidar roof height above y 0
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, r);
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
// Tiers in blocks, each a storey multiple (3 blocks = one storey): street front 2 storeys, wings 8, 12, 16, tower 17+.
const tier = (s) => (s < 12 ? 6 : s < 30 ? 24 : s < 43 ? 36 : s < 49 ? 48 : 53);
const H = new Map();                                       // "x,z" -> top of the column (the roof surface), blocks
for (const key of roof.keys()) {
  const [x, z] = key.split(",").map(Number), near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (roof.has(`${x + dx},${z + dz}`)) near.push(roof.get(`${x + dx},${z + dz}`));
  H.set(key, tier(median(near)));
}
const hAt = (x, z) => H.get(`${x},${z}`) ?? 0;
const bld = (x, y, z) => y < hAt(x, z);                    // a building cell at (x, y, z)

// --- the block map ----------------------------------------------------------------------------------------------------
const blocks = new Map();
const K = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= Y || z >= D) return;
  blocks.set(K(x, y, z), { block, state });
};
const isInterior = (x, y, z) => bld(x, y, z) && bld(x - 1, y, z) && bld(x + 1, y, z) && bld(x, y, z - 1) && bld(x, y, z + 1);

// A warm light on the air side of a window: the interior cell behind the pane, facing the exposed side.
const lightBehind = (x, y, z, exW, exE, exN, exS) => {
  const cand = [];
  if (exS) cand.push([x, z - 1]); if (exN) cand.push([x, z + 1]);
  if (exE) cand.push([x - 1, z]); if (exW) cand.push([x + 1, z]);
  for (const [cx, cz] of cand) if (isInterior(cx, y, cz) && !blocks.has(K(cx, y, cz))) { put(cx, y, cz, "glowstone"); return; }
};

// --- columns: plinth, storefront, piered limestone and sash, spandrel bands, cornice, floors ---------------------------
for (const [key, h] of H) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < h; y++) {
    const exW = !bld(x - 1, y, z), exE = !bld(x + 1, y, z), exN = !bld(x, y, z - 1), exS = !bld(x, y, z + 1);
    const skin = exW || exE || exN || exS;
    if (y === h - 1) { put(x, y, z, "polished_diorite"); continue; }        // cornice course over every column
    if (!skin) { if (y % 3 === 0) put(x, y, z, "smooth_stone"); continue; } // storey floor slabs; air behind the glass
    const zFace = exN || exS, xFace = exE || exW;
    const pier = zFace && xFace ? true : zFace ? x % 3 === 0 : z % 3 === 0;  // piers every third block, frames the sash
    if (y === 0) { put(x, y, z, "polished_andesite"); continue; }          // granite-like plinth
    if (y < 3) {                                                          // commercial storefront
      if (pier) { put(x, y, z, "polished_andesite"); continue; }
      put(x, y, z, "glass_pane");
      if ((x + 2 * z + y) % 3 === 0) lightBehind(x, y, z, exW, exE, exN, exS);
      continue;
    }
    if (pier) { put(x, y, z, "calcite"); continue; }
    if (y % 3 === 0) { put(x, y, z, "smooth_sandstone"); continue; }      // spandrel band at each storey line
    const bay = Math.floor((zFace ? x : z) / 3);
    put(x, y, z, (bay + Math.floor(y / 3)) % 4 === 0 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane");
    if ((x * 5 + z * 3 + y) % 17 === 0) lightBehind(x, y, z, exW, exE, exN, exS);
  }
}

// --- the 47th Street entrance: portal between two piers, a lintel, lanterns above -------------------------------------
const doorX = 13, doorZ = D - 1;
put(doorX, 1, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, 2, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = doorX - 1; x <= doorX + 2; x++) put(x, 3, doorZ, "calcite");
put(doorX - 1, 4, doorZ, "lantern");
put(doorX + 2, 4, doorZ, "lantern");

// --- the tower's penthouse: a stone box on the 53-block roof, a band of glass, a cornice ---------------------------
const PH = { x0: 10, x1: 17, z0: 11, z1: 18 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  if (hAt(x, z) !== 53) continue;
  const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  put(x, 53, z, ring ? "calcite" : "smooth_stone");
  put(x, 54, z, ring ? "light_blue_stained_glass_pane" : "smooth_sandstone");
  put(x, 55, z, "polished_diorite");
  if (ring && (x + z) % 5 === 0) put(x, 56, z, "lantern");                // a few warm lamps on the crown
}

// --- parapets on the exposed roof edges of every tier -----------------------------------------------------------------
for (const [key, h] of H) {
  const [x, z] = key.split(",").map(Number);
  if (blocks.has(K(x, h + 1, z)) || blocks.has(K(x, h, z))) continue;      // the penthouse, or a light already there
  if (!bld(x - 1, h - 1, z) || !bld(x + 1, h - 1, z) || !bld(x, h - 1, z - 1) || !bld(x, h - 1, z + 1)) {
    put(x, h, z, "calcite");
  }
}

// --- pane connections: a pane joins neighbouring panes and solid stone, not air or lights --------------------------
const SOLID = new Set(["calcite", "smooth_sandstone", "polished_andesite", "polished_diorite", "smooth_stone"]);
const isPane = (b) => b && (b.block === "glass_pane" || b.block.endsWith("_stained_glass_pane"));
for (const [k, b] of blocks) {
  if (!isPane(b)) continue;
  const [x, y, z] = k.split(",").map(Number);
  const link = (x2, z2) => { const n = blocks.get(K(x2, y, z2)); return Boolean(n && (isPane(n) || SOLID.has(n.block))); };
  b.state = { north: String(link(x, z - 1)), south: String(link(x, z + 1)), east: String(link(x + 1, z)), west: String(link(x - 1, z)) };
}

// --- write ------------------------------------------------------------------------------------------------------------
const g = new Voxels([W, Y, D]);
for (const [k, b] of blocks) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, b.block, b.state); }
const out = g.save(`${DIR}/NYC1034341.nbt`);

const tiers = {}; for (const h of H.values()) tiers[h] = (tiers[h] || 0) + 1;
console.log("columns by top:", JSON.stringify(tiers), "blocks:", out.blocks, "palette:", out.palette);

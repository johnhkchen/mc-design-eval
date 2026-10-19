// 56 East 54th Street, a 1926 commercial and office block: 16 storeys (48 blocks, about 53 m) of pale limestone on a
// andesite base. The north front (low z) is a two-storey street wall (8) with a forecourt court at ground in front of the
// centre; its corners rise to 11 storeys (34) and step back to 13 (39) behind them, and the 48-block shaft stands at the
// centre with 39-block flanks. The south end steps down through 11- and 8-block wings to 22-block corners on the lowest
// ground. Lidar roofs are quantised to these clean tiers, not followed cell by cell. Facades: a calcite spandrel at each
// storey line, smooth-quartz piers every third bay, glass in a one-block recess with air behind it (flush where the wall
// is two blocks thick), a floor slab per storey, and glowstone behind some panes. The entrance is in the north front
// (x 6-8) under a copper fascia, the roof is gravel with a smooth-quartz cornice, and a gilded crown tops the penthouse.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035733.cells.json`, "utf8"));
const X = 15, Y = 60, Z = 29;

const ground = Array.from({ length: Z }, () => new Array(X).fill(0));
for (const [x, z, gr] of cells) ground[z][x] = gr;

// Roof tiers in blocks above y 0, quantised from the lidar roof map. Rows are z (low z = north front), columns x.
// '.' open ground (court, lightwell, notch); a 8, b 11, c 14, d 22, e 34, f 39, g 48.
const TIER = { ".": 0, a: 8, b: 11, c: 14, d: 22, e: 34, f: 39, g: 48 };
const ROWS = [
  "eeeeaaaaaaa.eee",                                              // z0: corners 34, street wall 8, notch at x11
  "eeeeaaaaaa..eee",                                              // z1
  "eeee........eee",                                              // z2: forecourt court at ground
  "ffff.ggggggffff",                                              // z3: shoulders 39, shaft 48, lightwell at x4
  "ffff.ggggggffff",                                              // z4
  ...Array.from({ length: 16 }, () => "ff" + "g".repeat(11) + "ff"), // z5-20: shaft with 39 flanks
  "f".repeat(15),                                                 // z21: 39 setback course
  ...Array.from({ length: 3 }, () => "dddd" + "b".repeat(8) + "ddd"), // z22-24: 22 corners, 11 centre
  "a".repeat(15),                                                 // z25: 8 rear wall
  "." + "a".repeat(14),                                           // z26: lightwell at the SW corner
  ...Array.from({ length: 2 }, () => "d" + "c" + "b".repeat(13)), // z27-28: 22 SW pier, 14, 11 wing
];
if (ROWS.length !== Z || ROWS.some((r) => r.length !== X)) throw new Error("tier map does not match the footprint");

const topAt = (x, z) => TIER[ROWS[z][x]];
const inBox = (x, y, z) => x >= 0 && x < X && z >= 0 && z < Z && y >= 0;
// Solid where the foundation (below each cell's ground) or the massing is; everything else is air.
const solid = (x, y, z) => inBox(x, y, z) && (y < ground[z][x] || y < topAt(x, z));
const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const facesAt = (x, y, z) => Object.keys(FACES).filter((f) => { const [dx, dz] = FACES[f]; return !solid(x + dx, y, z + dz); });

const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // pane on a face along z
const PANE = "light_blue_stained_glass_pane";
const K = { N: 0, S: 1, W: 2, E: 3 };
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const windows = [];
const glaze = (x, y, z, face, u) => {
  g.set(x, y, z, PANE, face === "N" || face === "S" ? NS : EW);
  windows.push({ x, y, z, face, u, k: K[face] });
};

// 1 and 2. Foundation and massing, cell by cell, with the facades dressed where the massing is exposed.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const gr = ground[z][x], top = topAt(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, y === gr - 1 && top === 0 ? "smooth_stone" : "polished_andesite");
  for (let y = gr; y < top; y++) {
    const ex = facesAt(x, y, z);
    if (y === top - 1) { g.set(x, y, z, ex.length ? "smooth_quartz" : "gravel"); continue; }   // cornice, or tar and gravel
    if (!ex.length) { g.set(x, y, z, "calcite"); continue; }
    const corner = ex.some((f) => f === "N" || f === "S") && ex.some((f) => f === "W" || f === "E");
    const face = ex.find((f) => f === "N" || f === "S") ?? ex[0];
    const u = face === "N" || face === "S" ? x : z;   // position along the face
    const pier = corner || u % 3 === 0;
    const rel = y - gr;
    if (rel < 3) {   // the base: andesite plinth with shopfronts in the bays, and the entrance on the north front
      if (face === "N" && z === 0 && x >= 6 && x <= 8) {
        if (x === 7 && rel < 2) g.set(x, y, z, "iron_door", { facing: "north", half: rel === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else if (x === 7) g.set(x, y, z, "copper_block");
        else if (rel === 0) g.set(x, y, z, "polished_andesite");
        else glaze(x, y, z, face, u);
        continue;
      }
      if (pier || rel === 0) g.set(x, y, z, "polished_andesite");
      else glaze(x, y, z, face, u);
      continue;
    }
    if (pier) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }   // spandrel at the storey line
    glaze(x, y, z, face, u);
  }
}

// 3. Recesses: each window is glass in the face, with air behind it and a floor slab above and below (no interiors).
// Where the wall is only one interior cell thick the glass stays flush on solid stone, since air there would open through.
for (const w of windows) {
  const [dx, dz] = FACES[w.face];
  const ix = w.x - dx, iz = w.z - dz;
  const behind = ix >= 0 && ix < X && iz >= 0 && iz < Z && w.y % 3 !== 0 && w.y >= ground[iz][ix]
    && solid(ix, w.y, iz) && facesAt(ix, w.y, iz).length === 0;
  if (!behind) continue;
  g.set(ix, w.y, iz, lit(w.u, w.y, w.k) ? "glowstone" : "air");
}

// 4. Mechanical penthouse on the centre shaft: a calcite box, a smooth-quartz cap and a gilded crown.
for (let z = 9; z <= 13; z++) for (let x = 5; x <= 9; x++) for (let y = 48; y <= 50; y++) {
  g.set(x, y, z, y === 50 ? "smooth_quartz" : "calcite");
}
g.set(7, 51, 11, "gold_block");

const stats = g.save(`${DIR}/NYC1035733.nbt`);
console.log(`NYC1035733.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);

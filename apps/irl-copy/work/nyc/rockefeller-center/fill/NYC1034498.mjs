// 48 West 48th Street, 1926: a Midtown commercial and office block, 17 storeys on a setback massing, 27 x 28 cells.
// Street front is the high-z end (48th Street, south); z 0 is the rear. The lidar steps down toward the street: a 17-storey
// shaft behind, 14- and 11-storey wings, 9- and 7-storey setbacks, and a two-storey shop base on the street.
// Massing: lidar roofs median-smoothed over 3x3, snapped to tiers that are whole 3-block storeys (2, 3, 5, 7, 9, 11, 14, 17).
// Materials: polished granite base, pale limestone walls (calcite) with stone-brick storey bands, smooth quartz quoins,
// a chiseled cornice, grey glass in 2-wide bays between 1-wide limestone piers, light grey concrete roof decks.
// Interior is air behind the glazing with a floor slab per storey (no rooms); some windows and the lobby carry warm light.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034498.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 27, D = 28;

// Tier tops above y 0; every one is a multiple of 3, so each tier ends on a storey line.
const TIERS = [6, 9, 15, 21, 27, 33, 42, 51];
const snap = (v) => TIERS.reduce((b, t) => (Math.abs(t - v) < Math.abs(b - v) ? t : b));
const roofAt = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const median = (a) => { a = a.filter((v) => v > 0).sort((p, q) => p - q); return a.length ? a[a.length >> 1] : 0; };
const TOP = new Map();                                  // "x,z" -> tier top; lidar noise is medianed over the neighbours
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = roofAt.get(`${x + dx},${z + dz}`); if (r !== undefined) nb.push(r); }
  TOP.set(`${x},${z}`, snap(median(nb)));
}

const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const solid = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < top(x, z);
// Exposed faces of a block: a side whose neighbour at the same height is air. S = street (high z), N = rear.
const FACES = [["S", 0, 1], ["N", 0, -1], ["E", 1, 0], ["W", -1, 0]];
const faces = (x, y, z) => FACES.filter(([, dx, dz]) => !solid(x + dx, y, z + dz)).map(([f]) => f);
const inward = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

const PANE_ALONG_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // faces N or S
const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // faces E or W

const MAT = {
  base: "polished_granite", wall: "calcite", quoin: "smooth_quartz", band: "stone_bricks",
  glass: "gray_stained_glass_pane", cornice: "chiseled_stone_bricks", roof: "light_gray_concrete", floor: "smooth_stone",
  trim: "polished_granite", mech: "stone_bricks",
};
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };

const g = new Voxels([W, 62, D]);
const glow = [];
for (const key of TOP.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const s = Math.floor(y / 3), r = y % 3;             // storey s; row r within it (0 = storey line, 1-2 = glazing)
    const fs = faces(x, y, z);
    if (!fs.length) {                                    // interior: floor slab per storey, roof deck on top
      if (y === t - 1) g.set(x, y, z, MAT.roof);
      else if (r === 0) g.set(x, y, z, MAT.floor);
      continue;
    }
    if (y === t - 1) { g.set(x, y, z, MAT.cornice); continue; }        // cornice on every exposed top edge
    if (r === 0) { g.set(x, y, z, s === 0 ? MAT.base : MAT.band); continue; }   // base course, then storey bands
    if (fs.length >= 2) { g.set(x, y, z, MAT.quoin); continue; }      // corner quoins

    const face = fs[0];
    if (s === 0 && face === "S") {                       // street shopfront with the lobby in the middle (x 10..14)
      if (x === 10 || x === 14) g.set(x, y, z, MAT.trim);            // entrance surround
      else if (x === 12) g.set(x, y, z, "dark_oak_door", { ...DOOR, half: r === 1 ? "lower" : "upper" });
      else if (x === 11 || x === 13) g.set(x, y, z, MAT.glass, PANE_ALONG_X);
      else g.set(x, y, z, x % 3 === 0 ? MAT.wall : MAT.glass, x % 3 === 0 ? undefined : PANE_ALONG_X);
      continue;
    }
    const alongX = face === "S" || face === "N";
    const pier = alongX ? x % 3 === 0 : z % 3 === 0;      // 1-wide limestone piers, 2-wide glazed bays
    if (pier) { g.set(x, y, z, MAT.wall); continue; }
    g.set(x, y, z, MAT.glass, alongX ? PANE_ALONG_X : PANE_ALONG_Z);
    if (r === 1 && (x * 5 + z * 3 + s * 7) % 9 === 0) {  // a few lit offices: glowstone just behind the glass
      const [dx, dz] = inward[face];
      glow.push([x + dx, y, z + dz]);
    }
  }
}

// Lobby: warm light just inside the street glass, behind the door.
glow.push([12, 1, 26]);
for (const [x, y, z] of glow) {
  if (faces(x, y, z).length === 0 && top(x, z) > y && y % 3 !== 0) g.set(x, y, z, "glowstone");
}

// Entrance canopy: the granite lintel over the lobby bay, carried across the surround from storey line to storey line.
for (let x = 10; x <= 14; x++) if (top(x, D - 1) > 3) g.set(x, 3, D - 1, MAT.trim);

// Mechanical penthouse on the 14-storey north wing: two 3 x 2 boxes, 2 blocks high, stone-brick walls and a cornice cap.
for (const x0 of [10, 15]) for (let z = 2; z <= 3; z++) for (let x = x0; x <= x0 + 2; x++) {
  if (top(x, z) !== 42) continue;
  g.set(x, 42, z, MAT.mech);
  g.set(x, 43, z, MAT.cornice);
}

const out = `${DIR}/NYC1034498.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, palette ${palette}`);

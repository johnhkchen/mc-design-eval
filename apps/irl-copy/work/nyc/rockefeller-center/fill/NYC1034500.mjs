// 60 West 48th Street, 1920: a mixed residential and commercial block in Midtown, 5 x 27 cells.
// Street front is the high-z end (48th Street, south); z 0 is the rear. Shopfronts on the street front, residential above.
// Massing: lidar roofs median-smoothed over 3x3 and snapped to tiers (1, 2, 3 and 5 storeys, each 3 blocks, +1 cornice).
// Materials: polished granite base, red brick walls, stone-brick sill bands, chiseled cornice, stone-brick quoins.
// Interior is air behind the glazing with a floor slab per storey (no rooms); a few windows carry glowstone light.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034500.cells.json`, "utf8"));   // [x, z, ground, roof]

// Tier tops above y 0: 4 = one storey, 7 = two, 10 = three, 16 = five (15 of walls + a cornice block).
const TIERS = [4, 7, 10, 16];
const snap = (v) => TIERS.reduce((b, t) => (Math.abs(t - v) < Math.abs(b - v) ? t : b));
const roofAt = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const median = (a) => { a = a.filter((v) => v > 0).sort((p, q) => p - q); return a.length ? a[a.length >> 1] : 0; };
const TOP = new Map();                                  // "x,z" -> tier top; zero-roof noise is filled from neighbours
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = roofAt.get(`${x + dx},${z + dz}`); if (r !== undefined) nb.push(r); }
  TOP.set(`${x},${z}`, snap(median(nb)));
}

const inFoot = (x, z) => TOP.has(`${x},${z}`);
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const solid = (x, y, z) => x >= 0 && x < 5 && z >= 0 && z < 27 && y >= 0 && inFoot(x, z) && y < top(x, z);
// Exposed faces of a block, street (S, high z) first, then rear (N), east (E), west (W).
const FACES = [["S", 0, 1], ["N", 0, -1], ["E", 1, 0], ["W", -1, 0]];
const faces = (x, y, z) => FACES.filter(([, dx, dz]) => !solid(x + dx, y, z + dz)).map(([f]) => f);
const inward = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_ALONG_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const g = new Voxels([5, 28, 27]);
const lit = [];
for (const key of TOP.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const s = Math.floor(y / 3), r = y % 3;             // storey s, row r within it (0 = band, 1-2 = glazing)
    const fs = faces(x, y, z);
    if (!fs.length) {                                    // interior: a floor slab per storey, the roof deck on top
      if (r === 0 || y === t - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === t - 1) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }     // cornice
    const face = fs[0];
    if (r === 0) {                                       // base course at grade, sill bands above (granite fascia on the street)
      g.set(x, y, z, s === 0 || (face === "S" && s === 1) ? "polished_granite" : "stone_bricks");
      continue;
    }
    if (s === 0 && face === "S") {                       // street shopfront: display glass, a door in the middle bay
      if (x === 1) {
        const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
        g.set(x, y, z, "dark_oak_door", { ...door, half: r === 1 ? "lower" : "upper" });
      } else g.set(x, y, z, "glass");
      continue;
    }
    if (fs.length >= 2) { g.set(x, y, z, "stone_bricks"); continue; }     // corner quoins
    const isWindow = face === "S" || face === "N" ? x % 2 === 1 : z % 3 !== 0;   // 2-wide glazing, 1-wide piers
    if (!isWindow) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", face === "S" || face === "N" ? PANE_ALONG_X : PANE_ALONG_Z);
    if (r === 1 && (x * 5 + z * 3 + s * 7) % 9 === 0) {  // a few lit rooms: glowstone just behind the glass
      const [dx, dz] = inward[face];
      lit.push([x + dx, y, z + dz]);
    }
  }
}

// Penthouse on the five-storey roof: brick walls, glazing on the middle of each side, a stone-brick cap.
for (let z = 6; z <= 9; z++) for (let x = 1; x <= 3; x++) {
  const edge = x === 1 || x === 3 || z === 6 || z === 9;
  for (let y = 16; y <= 18; y++) {
    if (y === 18) { g.set(x, y, z, "stone_bricks"); continue; }
    if (!edge) { if (y === 16) g.set(x, y, z, "smooth_stone"); continue; }
    const mid = (x === 1 || x === 3) ? z === 7 || z === 8 : x === 2;
    if (y === 17 && mid) g.set(x, y, z, "glass_pane", (x === 1 || x === 3) ? PANE_ALONG_Z : PANE_ALONG_X);
    else g.set(x, y, z, "bricks");
  }
}

// Lit windows last, so nothing overwrites them; only on interior air cells.
let nLit = 0;
for (const [x, y, z] of lit) {
  if (!inFoot(x, z) || y % 3 === 0 || faces(x, y, z).length || g.get(x, y, z)) continue;
  g.set(x, y, z, "glowstone"); nLit++;
}

const stats = g.save(`${DIR}/NYC1034500.nbt`);
console.log(`cells ${cells.length}, lit windows ${nLit}, blocks ${stats.blocks}, palette ${stats.palette}`);

// 25 West 51st Street, 1950 commercial and office building: a nine-storey limestone-and-glass base (the wing along the
// street and the east side) with a 60-block setback ledge, and a 72-block slab tower in the west half with a 75-block
// penthouse crown. Footprint 19 x 21 (low z = north, the street front is the high-z side, z 20). Glass in steel-framed
// bays: stone piers every third block, light-grey spandrels at each storey line, blue-grey glass between, one block
// in from a stone face. The shopfront has a granite base and a recessed portal with a lintel, double doors and lanterns.
// Interiors are a floor slab per storey with air between, and glowstone sits behind some lower panes. Tiers are read as
// clean flat roofs from the lidar: the lidar holes are filled from neighbours, and open ground (roof 1) is a paved plaza.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034511.cells.json`, "utf8"));
const X = 19, Y = 87, Z = 21;

const GRANITE = "polished_andesite", QUARTZ = "smooth_quartz", SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass", FLOOR = "smooth_stone", CORE = "stone", ROOF = "stone";
const NB = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
const STREET = 20;                                    // the 51st Street front is z 20

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFoot = (x, z) => raw.has(key(x, z));
const roofOf = (x, z) => raw.get(key(x, z)).roof;

// Lidar holes (roof 0 inside the footprint): take the commonest roof among the four neighbours.
const roof = new Map();
for (const [k, { roof: r }] of raw) {
  if (r > 0) { roof.set(k, r); continue; }
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (const [dx, dz] of NB) if (inFoot(x + dx, z + dz) && roofOf(x + dx, z + dz) > 0) votes.set(roofOf(x + dx, z + dz), (votes.get(roofOf(x + dx, z + dz)) || 0) + 1);
  roof.set(k, [...votes].sort((a, b) => b[1] - a[1])[0][0]);
}

// Tiers (blocks above y 0 to the roof surface): open plaza, the nine-storey base, the setback, the tower, the crown.
const tierH = (x, z, r) => {
  if (r <= 1) return 1;
  if (r < 41) return 27;
  if (r < 70) return 60;
  if (x <= 6 && z >= 2 && z <= 12 && r >= 70) return 75;
  return 72;
};
const H = new Map();
for (const [k, r] of roof) { const [x, z] = k.split(",").map(Number); H.set(k, tierH(x, z, r)); }
const Hof = (x, z) => H.get(key(x, z)) ?? 0;

// The entrance: a portal recessed one block into the street front at x 7..9, open at y 1..2 (lintel at y 3).
const voidAt = (x, y, z) => z === STREET && x >= 7 && x <= 9 && (y === 1 || y === 2);
const solid = (x, y, z) => y < Hof(x, z) && !voidAt(x, y, z);
const exts = (x, y, z) => NB.filter(([dx, dz]) => !solid(x + dx, y, z + dz)).map(([, , d]) => d);
// A taller block stands on its neighbour's roof: the column is solid up to the highest shorter neighbour.
const deckBelow = (x, z) => {
  const h = Hof(x, z); let d = 0;
  for (const [dx, dz] of NB) { const n = Hof(x + dx, z + dz); if (n < h && n > d) d = n; }
  return d;
};

const blk = new Map(), face = new Map();
const set = (x, y, z, b, s) => blk.set(`${x},${y},${z}`, { b, s });
const door = (y) => ({ facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });

// The shell block for a street, wall or top course: granite base, a street shopfront, storey lines, piers, cornice.
const shell = (x, y, z, e, h) => {
  const f = e.includes("S") ? "S" : e[0];
  const p = f === "N" || f === "S" ? x : z;               // position along the face, for the pier rhythm
  const pier = p % 3 === 0;
  if (y === 0) return [z === STREET && x >= 7 && x <= 9 ? FLOOR : GRANITE];
  if (f === "S" && z === STREET - 1 && x >= 7 && x <= 9 && (y === 1 || y === 2)) return x === 8 ? ["iron_door", door(y)] : [GLASS];
  if (y === h - 1) return [QUARTZ];                        // cornice course
  if (f === "S" && y < 3) return [pier ? GRANITE : GLASS]; // shopfront under a transom-less lintel
  if (y % 3 === 0) return [pier ? QUARTZ : SPANDREL];      // storey line
  return [pier ? QUARTZ : GLASS];
};

for (const [k, h] of H) {
  const [x, z] = k.split(",").map(Number);
  if (h === 1) { set(x, 0, z, x % 4 === 0 ? QUARTZ : "stone_bricks"); continue; }   // open plaza, paving joints
  const d = deckBelow(x, z);
  for (let y = 0; y <= h; y++) {
    if (voidAt(x, y, z)) continue;
    if (y === h) { if (exts(x, y, z).length) set(x, y, z, QUARTZ); continue; }      // parapet on the outside edge
    const e = exts(x, y, z);
    if (e.length) {
      const [b, s] = shell(x, y, z, e, h);
      set(x, y, z, b, s);
      face.set(`${x},${y},${z}`, e.includes("S") ? "S" : e[0]);
    } else if (y < d) set(x, y, z, CORE);
    else if (y === h - 1) set(x, y, z, ROOF);
    else if (y % 3 === 0) set(x, y, z, FLOOR);
  }
}

// Warm light behind some lower panes: glowstone in the air just inside a glass block that has a floor under it.
for (const [k, { b }] of blk) {
  if (b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 3 !== 1 || y < 4 || (x * 5 + y * 3 + z * 11) % 13 !== 0) continue;
  const f = face.get(k);
  const [ix, iz] = { N: [x, z + 1], S: [x, z - 1], E: [x - 1, z], W: [x + 1, z] }[f];
  if (!blk.has(`${ix},${y},${iz}`) && Hof(ix, iz) > y) set(ix, y, iz, "glowstone");
}

// Shopfront lanterns hung under the portal lintel, and roof units on the south wing's deck (x 13..15, z 17).
set(7, 2, STREET, "lantern", { hanging: "true", waterlogged: "false" });
set(9, 2, STREET, "lantern", { hanging: "true", waterlogged: "false" });
for (let x = 13; x <= 15; x++) { set(x, 27, 17, "gray_concrete"); set(x, 28, 17, "gray_concrete"); }

const v = new Voxels([X, Y, Z]);
for (const [k, { b, s }] of blk) { const [x, y, z] = k.split(",").map(Number); v.set(x, y, z, b, s); }

// Check: every block rests on something below it, except the lintel over the portal and the hung lanterns.
const floating = [];
for (const [k, { b }] of blk) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || b === "lantern" || b === FLOOR || b === ROOF) continue;   // floor slabs and roofs span between walls
  if (!blk.has(`${x},${y - 1},${z}`)) floating.push(`${x},${y},${z} ${b}`);
}
console.error("floating:", floating.length ? floating.join(" | ") : "none");

const out = v.save(`${DIR}/NYC1034511.nbt`);
console.error("saved", out);

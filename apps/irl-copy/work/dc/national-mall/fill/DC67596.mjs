// DC67596: 2001 L St NW, a 1980s-90s Commercial-Office-Large. A 15-block glazed podium ring (7 storeys, 2 blocks each)
// around a 17-block core: calcite piers, quartz spandrels, tinted glass panes, a granite base, a glass shopfront and a
// doored entrance on the north (street) face, lit windows, and a glazed penthouse with plant boxes on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67596.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 17, Z = 16, Y = 29;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k2 = (x, z) => `${x},${z}`;
const key = (x, y, z) => `${x},${y},${z}`;

// footprint, and the lidar roof with its noise smoothed: 16s go to the majority tier; a cell whose footprint
// neighbours mostly sit on the other tier (a one-row dip in the core, a lone bump) moves with them
const fp = new Set(cells.map(([x, z]) => k2(x, z)));
const inFP = (x, z) => fp.has(k2(x, z));
let R = new Map(cells.map(([x, z, , r]) => [k2(x, z), r]));
const nbRoofs = (x, z, M) => NB.map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inFP(a, b)).map(([a, b]) => M.get(k2(a, b)));
const pass = (fn) => { const next = new Map(R); for (const [k, v] of R) { const [x, z] = k.split(",").map(Number); next.set(k, fn(v, nbRoofs(x, z, R))); } R = next; };
pass((v, nb) => (v === 16 ? (nb.filter((n) => n === 17).length >= nb.filter((n) => n === 15).length ? 17 : 15) : v));
for (let i = 0; i < 3; i++) pass((v, nb) => {
  const up = nb.filter((n) => n === 17).length, down = nb.filter((n) => n === 15).length;
  if (v === 15 && up >= 3) return 17;
  if (v === 17 && down >= 3) return 15;
  return v;
});
const top = (x, z) => R.get(k2(x, z));

// the solid massing: footprint cells up to their roof; a cell is shell if a side neighbour at that height is air
const solid = (x, y, z) => inFP(x, z) && y >= 0 && y < top(x, z);
const M = new Map();
const put = (x, y, z, b, s, n) => M.set(key(x, y, z), { x, y, z, b, s, n });
const outward = (x, y, z) => NB.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

for (const k of R.keys()) {
  const [x, z] = k.split(",").map(Number), t = top(x, z);
  for (let y = 0; y < t; y++) {
    const out = outward(x, y, z), ex = out.length > 0;
    const n = out[0];
    if (y === t - 1) { put(x, y, z, ex ? "polished_andesite" : "stone"); continue; }     // cornice / roof covering
    if (y === 0) { put(x, y, z, ex ? "polished_granite" : "stone"); continue; }          // base course on the ground
    if (!ex) { if (y % 2 === 1 && y >= 3) put(x, y, z, "smooth_stone"); continue; }      // floor slabs; air between
    const corner = out.length >= 2;
    const alongI = n[0] !== 0 ? z : x;                                                    // position along the face
    const pier = corner || alongI % 2 === 0;
    if (y <= 2) {                                                                          // ground floor: shopfront
      if (n[1] === -1 && (x === 7 || x === 8)) {                                           // entrance doors, north face
        const hinge = x === 7 ? "left" : "right";
        const st = { facing: "north", half: y === 1 ? "lower" : "upper", hinge, open: "false", powered: "false" };
        put(x, y, z, "dark_oak_door", st);
      } else put(x, y, z, pier ? "calcite" : "glass_pane", null, n);
      continue;
    }
    if (y === 3 && n[1] === -1 && x >= 5 && x <= 10) {                                    // canopy over the entrance
      put(x, y, z, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
      continue;
    }
    if (y % 2 === 1) { put(x, y, z, "smooth_quartz"); continue; }                         // storey line / spandrel
    if (pier) { put(x, y, z, "calcite"); continue; }                                       // window mullion
    // some offices lit: warm amber glass with a glowstone in the air gap behind it, on the slab below
    const lit = y >= 4 && y <= t - 4 && (x * 3 + y * 5 + z * 7) % 11 === 0;
    put(x, y, z, lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane", null, n);
    if (lit) put(x - n[0], y, z - n[1], "glowstone");
  }
}

// hanging lanterns in the shopfront's air gap, from the first-floor slab
for (const x of [3, 12]) put(x, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// glazed penthouse set back on the core, with a roof deck and plant boxes on the podium
const PH = { x0: 5, x1: 12, z0: 4, z1: 11, y: 17 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  put(x, PH.y + 1, z, "polished_andesite");                                              // roof cap over the glazed walls
  const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  if (!edge) continue;
  const corner = (x === PH.x0 || x === PH.x1) && (z === PH.z0 || z === PH.z1);
  const n = x === PH.x0 ? [-1, 0] : x === PH.x1 ? [1, 0] : z === PH.z0 ? [0, -1] : [0, 1];
  if (corner || (x + z) % 2 === 0) put(x, PH.y, z, "calcite");
  else put(x, PH.y, z, "light_blue_stained_glass_pane", null, n);
}
for (const [x0, z0] of [[14, 5], [1, 9]]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++)
  for (let y = 15; y <= 16; y++) put(x0 + dx, y, z0 + dz, "light_gray_concrete");

// panes join only the neighbours in their own wall plane (a glass wall, not a pane poking into the air gap)
const glassy = (b) => b.endsWith("glass_pane");
const has = (x, y, z) => M.has(key(x, y, z));
for (const e of M.values()) {
  if (!glassy(e.b)) continue;
  const alongX = e.n ? e.n[0] === 0 : true;                                                // plane runs along x
  const s = { waterlogged: "false", north: "false", south: "false", east: "false", west: "false" };
  if (alongX) { s.east = has(e.x + 1, e.y, e.z) ? "true" : "false"; s.west = has(e.x - 1, e.y, e.z) ? "true" : "false"; }
  else { s.north = has(e.x, e.y, e.z - 1) ? "true" : "false"; s.south = has(e.x, e.y, e.z + 1) ? "true" : "false"; }
  e.s = s;
}

const g = new Voxels([X, Y, Z]);
for (const e of M.values()) g.set(e.x, e.y, e.z, e.b, e.s ?? undefined);
const out = g.save(`${DIR}/DC67596.nbt`);
console.log("built DC67596.nbt", out, "roof tiers", [...new Set(R.values())].sort());

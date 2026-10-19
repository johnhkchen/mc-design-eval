// I.T.T. American Building, 437 Madison Avenue, 1967 commercial and office building: a 1960s International-style
// office tower of about 47 storeys (142 blocks, about 158 m) on a set of 15-storey wings (48 blocks) and a one-storey
// shop frontage at the low ground. Its skin is a bronze-tinted glass curtain wall (gray stained-glass panes) in
// light-grey spandrels at every third block and iron mullions every third column; the ground storey is polished
// granite and clear shopfront glass. Lidar roofs are median-smoothed in 3x3 windows, then read as flat tiers: 142
// (tower), 136 (a shoulder on the west), 48 (wings), 18 (a short wing) and a one-storey plinth. The tower carries a
// mechanical penthouse and a parapet. Madison is taken as the west (low x) face, with the double doors at z 19-20.
// The walls are hollow: the skin (depth 1), an air gap behind it (depth 2) with floor slabs at each spandrel row, and
// a solid core (depth 3 and in). Warm glowstone sits on the slab behind some lit panes. Every block stands on what is
// below it (foundation to each cell's ground, then storeys on storeys). No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035455.cells.json`, "utf8"));
const X = 48, Y = 154, Z = 42;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Lidar roof, median-smoothed over the 3x3 footprint neighbourhood so single-cell noise (a 1, a 2, a 41) goes.
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const smoothRoof = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(cell.get(`${x + dx},${z + dz}`).roof);
  return median(v);
};

// Flat tiers (block heights above y 0): a one-storey shop plinth at the low ground, an 18-block short wing, 48-block
// wings (about 15 storeys), a 136-block shoulder and the 142-block tower.
const topOf = (x, z) => {
  const v = smoothRoof(x, z), g = groundAt(x, z);
  if (v <= 4) return g + 3;
  if (v < 30) return 18;
  if (v < 60) return 48;
  if (v < 140) return 136;
  return 142;
};
const top = new Map();
for (const key of cell.keys()) { const [x, z] = key.split(",").map(Number); top.set(key, topOf(x, z)); }
const T = (x, z) => (inFoot(x, z) ? top.get(`${x},${z}`) : 0);
const maxTop = Math.max(...top.values());

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACES = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];   // N = low z (the 44th-street end of the grid), in the NYC frame

// Depth of each built cell at height y: 1 = on the outside (skin), 2 = one in (air gap), 3+ = core. Breadth-first from
// every cell that touches open air at this height.
const depthsAt = (y) => {
  const d = new Map(), q = [];
  for (const [key, t] of top) {
    if (t <= y) continue;
    const [x, z] = key.split(",").map(Number);
    if (NB.some(([dx, dz]) => T(x + dx, z + dz) <= y)) { d.set(key, 1); q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], dd = d.get(`${x},${z}`);
    for (const [dx, dz] of NB) {
      const k = `${x + dx},${z + dz}`;
      if (T(x + dx, z + dz) > y && !d.has(k)) { d.set(k, dd + 1); q.push([x + dx, z + dz]); }
    }
  }
  return d;
};
const faceOf = (x, y, z) => { for (const [f, dx, dz] of FACES) if (T(x + dx, z + dz) <= y) return f; return null; };

// The entrance: double doors on Madison's face (x 0) at z 19-20, at the ground of those cells.
const DOOR_Z = [19, 20];
const doorG = Math.max(...DOOR_Z.map((z) => groundAt(0, z)));
const isDoor = (x, y, z) => x === 0 && DOOR_Z.includes(z) && (y === doorG || y === doorG + 1);
const isLit = (x, y, z, g) => y % 3 === 1 && y > g && (x * 5 + y * 7 + z * 3) % 13 === 0;

const g = new Voxels([X, Y, Z]);
const mullionOf = (f, x, z) => (f === "W" || f === "E" ? z : x) % 3 === 0;

for (let y = 0; y < maxTop; y++) {
  const D = depthsAt(y);
  for (const [key, d] of D) {
    const [x, z] = key.split(",").map(Number);
    const t = top.get(key), gr = groundAt(x, z), f = faceOf(x, y, z);

    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }          // foundation to the cell's own ground
    if (y === t - 1) {                                                  // roof covering; calcite cornice on the edge
      g.set(x, y, z, d === 1 ? "calcite" : "gray_concrete");
      if (d === 1 && t >= 18) g.set(x, t, z, "smooth_quartz");           // a one-block parapet on the edge
      continue;
    }
    if (isDoor(x, y, z)) {
      const hinge = z === DOOR_Z[0] ? "left" : "right";
      g.set(x, y, z, "iron_door", { facing: "west", half: y === doorG ? "lower" : "upper", hinge, open: "false", powered: "false" });
      continue;
    }
    if (d === 1) {                                                      // the skin
      if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }   // base course
      if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel and slab line
      if (mullionOf(f, x, z)) { g.set(x, y, z, "iron_block"); continue; }
      const b = (dx, dz) => String(T(x + dx, z + dz) > y);
      const state = f === "W" || f === "E"
        ? { north: b(0, -1), south: b(0, 1), east: "false", west: "false", waterlogged: "false" }
        : { east: b(1, 0), west: b(-1, 0), north: "false", south: "false", waterlogged: "false" };
      g.set(x, y, z, "gray_stained_glass_pane", state);
      continue;
    }
    if (d === 2) {                                                      // the air gap, with the floor slab per storey
      if (y % 3 === 0 && y > gr) { g.set(x, y, z, "light_gray_concrete"); continue; }
      const behindLit = NB.some(([dx, dz]) => {
        const n = [x + dx, z + dz], nd = D.get(`${n[0]},${n[1]}`);
        return nd === 1 && isLit(n[0], y, n[1], groundAt(n[0], n[1])) && !mullionOf(faceOf(n[0], y, n[1]), n[0], n[1]);
      });
      if (behindLit) g.set(x, y, z, "glowstone");
      continue;
    }
    g.set(x, y, z, "light_gray_concrete");                              // core
  }
}

// Mechanical penthouse on the tower roof, with a row of vents; sits on the roof covering below.
for (let z = 15; z <= 20; z++) for (let x = 21; x <= 26; x++) {
  if (!inFoot(x, z) || top.get(`${x},${z}`) !== 142) continue;
  g.set(x, 142, z, "light_gray_concrete"); g.set(x, 143, z, "light_gray_concrete");
  g.set(x, 144, z, "smooth_quartz");
}
g.set(22, 145, 16, "iron_bars"); g.set(25, 145, 19, "iron_bars");

const out = g.save(`${DIR}/NYC1035455.nbt`);
console.log(`NYC1035455: ${out.blocks} blocks, ${out.palette} palette entries, top ${maxTop}`);

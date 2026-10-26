// 1111 Massachusetts Ave NW: a 1920s-style red-brick apartment block with limestone (calcite) string courses, a
// stone base, punched windows and a setback core. The lidar roof tiers (12 / 13 / 15) become flat massing:
// the 15 tier is kept only on the inner core and steps back to the 12 cap at its edge, the 13 tier is a lower wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC60522.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 12, D = 22, H = 27;

const key = (x, z) => `${x},${z}`;
const lidar = new Map(), ground = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); lidar.set(key(x, z), r); }
const inFoot = (x, z) => ground.has(key(x, z));

// Flat tiers: a lidar 15 cell is tower core only if all four neighbours are 15 too; the ring around it steps back to 12.
const top = new Map();
for (const [k, r] of lidar) {
  const [x, z] = k.split(",").map(Number);
  const core = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => (lidar.get(key(x + dx, z + dz)) ?? 0) >= 15);
  top.set(k, r >= 15 && !core ? 12 : r);
}
const R = (x, z) => top.get(key(x, z)) ?? 0;
// the foundation: every cell is solid from y 0 up to its ground (0 or 1 here, so the y 0 base course already covers it)
const solid = (x, y, z) => inFoot(x, z) && y >= 0 && y < Math.max(R(x, z), ground.get(key(x, z)) ?? 0);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, y, z) => solid(x, y, z) ? Object.entries(DIRS).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz)).map(([n]) => n) : [];
const INWARD = { N: "S", S: "N", W: "E", E: "W" };
const STREET = { x: 7, z: 0 };                                   // the entrance on the north (street) face

// Window bays: a 1-block pier every fourth cell along each wall, glass in between; the pane sits in the wall with
// an air pocket behind it (lit with glowstone in some), the storey floors and the cap stay solid.
const isGlass = (x, y, z, ex) => {
  if (y % 2 === 0 || y === 0 || y >= R(x, z) - 1 || ex.length !== 1) return false;
  const i = ex[0] === "N" || ex[0] === "S" ? x : z;
  return i % 4 === 1 || i % 4 === 2;
};
const pockets = new Map();                                       // key -> lit?
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < R(x, z); y++) {
  const ex = exposed(x, y, z);
  if (!isGlass(x, y, z, ex)) continue;
  const [dx, dz] = DIRS[INWARD[ex[0]]];
  const px = x + dx, pz = z + dz;
  if (solid(px, y, pz) && !exposed(px, y, pz).length) pockets.set(key3(px, y, pz), (x + y + z) % 3 === 0);
}
function key3(x, y, z) { return `${x},${y},${z}`; }

const v = new Voxels([W, H, D]);
const PANE = (ns) => ({ north: ns ? "false" : "true", south: ns ? "false" : "true", east: ns ? "true" : "false", west: ns ? "true" : "false", waterlogged: "false" });
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = R(x, z);
  if (!h) continue;
  for (let y = 0; y < h; y++) {
    const ex = exposed(x, y, z);
    const k3 = key3(x, y, z);
    // interior: solid fill, except the pockets behind the glass
    if (!ex.length) {
      if (pockets.has(k3)) { if (pockets.get(k3)) v.set(x, y, z, "glowstone"); continue; }
      v.set(x, y, z, "stone");
      continue;
    }
    // the street entrance: double-height door under a calcite lintel
    if (x === STREET.x && z === STREET.z && ex.includes("N")) {
      if (y === 1) { v.set(x, y, z, "dark_oak_door", DOOR("lower")); continue; }
      if (y === 2) { v.set(x, y, z, "dark_oak_door", DOOR("upper")); continue; }
      if (y === 3) { v.set(x, y, z, "calcite"); continue; }
    }
    if (y === 0) { v.set(x, y, z, "stone_bricks"); continue; }
    if (y === h - 1) { v.set(x, y, z, "calcite"); continue; }       // parapet / coping
    const corner = ex.some((n) => n === "N" || n === "S") && ex.some((n) => n === "E" || n === "W");
    if (corner) { v.set(x, y, z, "calcite"); continue; }              // quoins
    if (y % 2 === 0) { v.set(x, y, z, "calcite"); continue; }        // storey string courses (sill and lintel)
    if (isGlass(x, y, z, ex)) {
      const ns = ex[0] === "N" || ex[0] === "S";
      v.set(x, y, z, "glass_pane", PANE(ns));
    } else {
      v.set(x, y, z, "bricks");                                       // piers
    }
  }
}

// a brick chimney on the low roof, standing on the roof deck
for (const y of [12, 13]) v.set(9, y, 4, "bricks");
v.set(9, 14, 4, "calcite");
// rooftop plant on the low roof
v.set(9, 12, 19, "iron_block");
v.set(10, 12, 19, "iron_block");

const stats = v.save(`${HERE}/DC60522.nbt`);
console.log("saved", stats);

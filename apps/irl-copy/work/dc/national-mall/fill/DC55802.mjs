// 1816 12th St NW, the Anthony Bowen YMCA: an early-20th-century institutional block in red brick with limestone trim,
// the lidar's roof read as flat tiers (a 9-block east pavilion over an 8-block main block, 6-block west wing, 3-4 block
// notches). Walls are one block thick on the footprint's edge with air behind the glass; every floor (rows 0, 2, 4, 6,
// and each cell's ground) is a solid slab across the footprint and the roof is a deck, so nothing hangs. Rows: base
// course, window row, string course, window row, string, window row, string, window row, cornice.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55802.cells.json`, "utf8"));

const W = 21, H = 9, D = 9;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

// ---- massing: the lidar roof's 3x3 median (1-block noise does not make a tier); ground as lidar gives it ----
const roofOf = new Map(), groundOf = new Map();
const raw = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr, roof }]));
for (const [x, z, gr] of cells) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  roofOf.set(key(x, z), Math.min(H, median(near)));
  groundOf.set(key(x, z), gr);
}
const inFoot = (x, z) => roofOf.has(key(x, z));
const top = (x, z) => roofOf.get(key(x, z)) ?? 0;        // rows below this are solid
const ground = (x, z) => groundOf.get(key(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
// the faces of a cell at row y that look onto air: the neighbour is outside the footprint or its roof is at or below y
const exposed = (x, z, y) => ["N", "S", "E", "W"].filter((d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return !inFoot(nx, nz) || top(nx, nz) <= y;
});

const BRICK = "bricks", LIMESTONE = "calcite", BASE = "stone_bricks", FOUND = "stone";
const GLASS = "light_blue_stained_glass_pane", FLOOR = "smooth_stone", CORNICE = "stone_brick_stairs", CAP = "stone_brick_slab";
const ENTRY = [9, 10, 11];                                // the front bays around the door on the z = 0 face

const stairs = (d) => ({ facing: FACING[d], half: "bottom", shape: "straight", waterlogged: "false" });
const pane = (ns) => (ns                                  // a pane in a z-face wall joins its neighbours east and west
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [x, z] of [...roofOf.keys()].map((k) => k.split(",").map(Number))) {
  const t = top(x, z), gr = ground(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, z, y);
    const zFace = ex.includes("N") || ex.includes("S");
    const xFace = ex.includes("E") || ex.includes("W");

    if (y < gr) { g.set(x, y, z, FOUND); continue; }                                  // foundation, below the ground
    if (y === t - 1) {                                                                 // cornice or roof deck
      if (ex.length) g.set(x, y, z, CAP, { type: "top", waterlogged: "false" }); else g.set(x, y, z, FLOOR);
      continue;
    }
    if (!ex.length) {                                                                  // inside: floor slabs, air between
      if (y === gr || y % 2 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    // ---- the front (z = 0) entrance: door in the base, a hood over it, a lantern on the hood ----
    if (z === 0 && ENTRY.includes(x)) {
      if (x === 10 && y <= 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y <= 1) { g.set(x, y, z, LIMESTONE); continue; }                              // door surround
      if (y === 2) { g.set(x, y, z, CORNICE, stairs("N")); continue; }                  // the hood
      if (x === 10 && y === 3) { g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }); continue; }
    }
    if (y === gr) { g.set(x, y, z, zFace && xFace ? LIMESTONE : BASE); continue; }    // base course
    if (y % 2 === 0) { g.set(x, y, z, LIMESTONE); continue; }                          // string course at each floor
    if (zFace && xFace) { g.set(x, y, z, LIMESTONE); continue; }                       // quoins at the corners
    if (zFace) {                                                                        // long faces: piers every third bay
      if (x % 3 === 0) g.set(x, y, z, BRICK); else g.set(x, y, z, GLASS, pane(true));
    } else {                                                                            // ends: piers at z = 0, 3, 6
      if (z % 3 === 0) g.set(x, y, z, BRICK); else g.set(x, y, z, GLASS, pane(false));
    }
  }
}
// ---- rooftop: two brick chimney stacks on the main roof (a block above the deck, still within the 9-block height) ----
for (const [x, z] of [[12, 4], [15, 4]]) if (inFoot(x, z) && top(x, z) <= H - 1) g.set(x, top(x, z), z, BRICK);

// ---- warm light: glowstone in the air gap behind a few glass panes on the front and back faces ----
const lamp = (x, y, z) => { if (!exposed(x, z, y).length && g.get(x, y, z) === null) g.set(x, y, z, "glowstone"); };
for (const x of [5, 13, 17]) for (const y of [3, 5]) lamp(x, y, 1);
for (const x of [4, 14]) for (const y of [3, 5]) lamp(x, y, 7);

const r = g.save(`${DIR}/DC55802.nbt`);
console.log(JSON.stringify(r));

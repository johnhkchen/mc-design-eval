// Auckland, Mt Eden / Eden Terrace fringe: a 1930s two-storey brick-and-plaster commercial block (red brick, cream
// plaster bands, volcanic-stone base) with shopfronts on the ground floor, a one-storey wing on the west, and a raised
// plant deck. Storeys are 4 blocks: slabs at y 0, 4, 8; walls one block thick; glass in the wall with air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241885.cells.json`, "utf8"));
const W = 28, D = 32, H = 23;

const key = (x, z) => `${x},${z}`;
const cell = new Map();
// lidar roof heights to three clean tiers: wing (<=5), main (6-9), raised core (10)
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, roof, top: roof <= 5 ? 5 : roof <= 9 ? 9 : 10 });
const get = (x, z) => cell.get(key(x, z));
const NB = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const faces = (c) => NB.filter(([dx, dz]) => !get(c.x + dx, c.z + dz)).map(([, , f]) => f);

// a lone 10 is lidar noise: the raised core stays only where it joins another 10
for (const c of cell.values()) if (c.top === 10 && NB.filter(([dx, dz]) => get(c.x + dx, c.z + dz)?.top === 10).length < 2) c.top = 9;
// and no raised poles on the outside: an exterior 10 needs three 10 neighbours, else it stays at the main tier
for (const c of cell.values()) if (c.top === 10 && faces(c).length && NB.filter(([dx, dz]) => get(c.x + dx, c.z + dz)?.top === 10).length <= 2) c.top = 9;

const FACING = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const BASE = "polished_andesite", BAND = "smooth_quartz", WALL = "bricks", GLASS = "glass";
const SLAB = "stone", ROOF = "smooth_stone", PLANT = "light_gray_concrete";

// the entrance: the middle of the main south frontage
const southFront = [...cell.values()].filter((c) => c.top >= 9 && faces(c).length === 1 && faces(c)[0] === "south").sort((a, b) => a.x - b.x);
const door = southFront[Math.floor(southFront.length / 2)];

const g = new Voxels([W, H, D]);
for (const c of cell.values()) {
  const fs = faces(c), wall = fs.length > 0, corner = fs.length >= 2;
  if (!wall) {
    // interior: floor slabs at 0, 4, 8 and the roof deck on top; air between (no interiors)
    for (const y of [0, 4, 8, c.top - 1]) if (y >= 0 && y < c.top) g.set(c.x, y, c.z, y === c.top - 1 ? ROOF : SLAB);
    continue;
  }
  const face = fs[0], idx = face === "north" || face === "south" ? c.x : c.z;
  const isWin = !corner && (idx % 4 === 1 || idx % 4 === 2);   // 2 glass bays, then a 2-block pier
  const isDoor = c === door;
  for (let y = 0; y < c.top; y++) {
    let b;
    if (y === 0) b = [BASE];
    else if (corner) b = [BAND];                                        // quoined corner pilasters
    else if (isDoor && (y === 1 || y === 2)) {
      const half = y === 1 ? "lower" : "upper";
      b = ["dark_oak_door", { facing: face, half, hinge: "left", open: "false", powered: "false" }];
    }
    else if (y === 3 || y === 4 || y === 7 || y === 8 || y === 9) b = [BAND];  // lintels, storey lines, cornice, coping
    else b = [isWin ? GLASS : WALL];                                    // shopfront / window rows, piers between
    g.set(c.x, y, c.z, ...b);
  }
}

// warm light behind some glass: a glowstone in the room behind every other bay
for (const c of cell.values()) {
  const fs = faces(c);
  if (fs.length !== 1) continue;
  const face = fs[0], idx = face === "north" || face === "south" ? c.x : c.z;
  if (idx % 8 !== 1 && idx % 8 !== 2) continue;
  if (idx % 4 === 0 || idx % 4 === 3) continue;
  const [ox, oz] = FACING[face];
  const inner = get(c.x - ox, c.z - oz);
  if (!inner || faces(inner).length) continue;
  g.set(inner.x, 1, inner.z, "glowstone");
  if (inner.top >= 9) g.set(inner.x, 5, inner.z, "glowstone");
}

// roof plant: up to two light-grey plant boxes on the raised core, clear of the parapet
const coreOK = (c) => c && c.top === 10 && faces(c).length === 0 && NB.every(([dx, dz]) => { const n = get(c.x + dx, c.z + dz); return n && faces(n).length === 0; });
const used = new Set();
let boxes = 0;
for (const c of [...cell.values()].sort((a, b) => a.z - b.z || a.x - b.x)) {
  if (boxes >= 2) break;
  const patch = [];
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) patch.push(get(c.x + dx, c.z + dz));
  if (!patch.every(coreOK) || patch.some((p) => used.has(key(p.x, p.z)))) continue;
  for (const p of patch) { g.set(p.x, 10, p.z, PLANT); used.add(key(p.x, p.z)); }
  boxes++;
}

g.save(`${DIR}/way_332241885.nbt`);
console.log(`wrote way_332241885.nbt: ${g.count()} blocks, ${g.palette.length - 1} block states, ${cell.size} cells, door at ${door.x},${door.z}, ${boxes} plant boxes`);

// Way 162153999: a three-storey Stripped Classical brick commercial block (c. 1920s) on a basalt plinth, the
// Auckland Mt Eden / Eden Terrace street type. Massing follows the lidar roof, median-smoothed into three flat tiers
// (11, 12, 13); the body is solid from the ground (foundation below it), with an air pocket behind every window and
// the door, string courses at y 5 and 9, a quartz cornice at the cap, and a stone-brick parapet on the ring.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162153999.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inFp = (x, z) => byXZ.has(key(x, z));

// outward normals; W/E walls run along z, N/S walls along x
const OUT = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const OPP = { W: "east", E: "west", N: "south", S: "north" };    // a door faces into the building

// median-smoothed lidar roof: mean over the 3x3 footprint neighbourhood, then one of three flat tiers
for (const c of byXZ.values()) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = byXZ.get(key(c.x + dx, c.z + dz)); if (o) { s += o.r; n++; }
  }
  const m = s / n;
  c.T = m < 11.5 ? 11 : m < 12.5 ? 12 : 13;
  c.faces = Object.keys(OUT).filter((f) => !inFp(c.x + OUT[f][0], c.z + OUT[f][1]));
  c.ring = c.faces.length > 0;
  c.corner = false;                                      // a stair-stepped edge is a facade: its cells keep windows
  c.face = c.faces[0];
  c.along = c.face === "W" || c.face === "E" ? c.z : c.x;
}

const S1 = 5, S2 = 9;                                    // string course lines (storey tops)
const winRow = (y, c) => (y >= c.g + 1 && y <= S1 - 1) || (y >= S1 + 1 && y <= S2 - 1) || (y >= S2 + 1 && y <= c.T - 1);

// the entrances: the two lowest-ground ring cells on the longest facade, near its middle
const runs = {};
for (const c of byXZ.values()) if (c.ring && !c.corner) runs[c.face] = (runs[c.face] || 0) + 1;
const mainFace = Object.keys(runs).sort((a, b) => runs[b] - runs[a])[0];
const onFace = (f) => [...byXZ.values()].filter((c) => c.ring && !c.corner && c.face === f && c.g <= 1).sort((a, b) => a.along - b.along);
const mainCands = onFace(mainFace);
const mainDoor = mainCands[Math.floor(mainCands.length / 2)];
const sideFace = Object.keys(runs).filter((f) => f !== mainFace).sort((a, b) => runs[b] - runs[a])[0];
const sideCands = onFace(sideFace);
const sideDoor = sideCands[Math.floor(sideCands.length / 2)];
const doors = new Map([[key(mainDoor.x, mainDoor.z), mainDoor], [key(sideDoor.x, sideDoor.z), sideDoor]]);

// the air behind each window and door: the inward neighbour, carved out of the solid body
const carved = new Set();
const pockets = [];                                      // { x, y, z, c } for lights
const windows = [];                                      // { c, y } glass cells on the ring
for (const c of byXZ.values()) {
  if (!c.ring || c.corner) continue;
  const [dx, dz] = OUT[c.face];
  const inward = byXZ.get(key(c.x - dx, c.z - dz));
  const isDoor = doors.has(key(c.x, c.z));
  const pilaster = c.along % 3 === 0;
  for (let y = c.g; y <= c.T; y++) {
    const isWin = !pilaster && (isDoor ? y === c.g + 1 || y === c.g + 2 : winRow(y, c));
    if (!isWin) continue;
    if (inward && !inward.ring) carved.add(`${inward.x},${y},${inward.z}`);
    if (!isDoor) windows.push({ c, y });
  }
}

const g = new Voxels([23, 25, 35]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const PARAPET = { east: "low", west: "low", north: "low", south: "low", up: "true", waterlogged: "false" };

// the body, cell by cell (y from the cell's ground to its cap)
for (const c of byXZ.values()) {
  const { x, z, g: gr, T } = c;
  for (let y = 0; y < gr; y++) set(x, y, z, c.ring ? "polished_andesite" : "stone");   // foundation
  for (let y = gr; y <= T; y++) {
    if (carved.has(`${x},${y},${z}`)) continue;
    if (!c.ring) { set(x, y, z, y === T ? "smooth_stone" : "stone"); continue; }    // interior: solid, roof deck on top
    if (y === T) { set(x, y, z, "smooth_quartz"); continue; }                        // cornice
    if (y === gr) { set(x, y, z, "polished_andesite"); continue; }                  // basalt plinth
    if (y === S1 || y === S2 || c.corner || c.along % 3 === 0) { set(x, y, z, "smooth_quartz"); continue; }
    if (doors.has(key(x, z)) && (y === gr + 1 || y === gr + 2)) continue;          // door: set below
    if (winRow(y, c)) { set(x, y, z, "glass_pane", c.face === "W" || c.face === "E" ? PANE_EW : PANE_NS); continue; }
    set(x, y, z, "bricks");                                                        // spandrel
  }
  // the parapet on the ring, the roof deck's plant on the interior
  if (c.ring) set(x, T + 1, z, "stone_brick_wall", PARAPET);
}

// doors: two blocks, into the carved pocket
for (const d of doors.values()) {
  set(d.x, d.g + 1, d.z, "oak_door", { facing: OPP[d.face], half: "lower", hinge: "left", open: "false", powered: "false" });
  set(d.x, d.g + 2, d.z, "oak_door", { facing: OPP[d.face], half: "upper", hinge: "left", open: "false", powered: "false" });
}

// warm light behind some glass: glowstone in the pocket, shopfront and upper storeys
let lit = 0;
for (const { c, y } of windows) {
  const [dx, dz] = OUT[c.face];
  const pocketCell = byXZ.get(key(c.x - dx, c.z - dz));
  if (!pocketCell || pocketCell.ring) continue;
  const along = c.along;
  const lightRow = y === 2 || y === 7 || y === 11;
  if (lightRow && (along + y) % 4 === 1) { set(pocketCell.x, y, pocketCell.z, "glowstone"); lit++; }
}

// roof plant: 2x2 units on the deck of the top tier, set in from the parapet
let plant = 0;
for (const c of byXZ.values()) {
  if (c.ring || c.T !== 13 || c.x % 7 !== 3 || c.z % 7 !== 3) continue;
  const cells4 = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
  if (!cells4.every(([x, z]) => inFp(x, z) && byXZ.get(key(x, z)).T === 13 && !byXZ.get(key(x, z)).ring)) continue;
  for (const [x, z] of cells4) set(x, 14, z, "light_gray_concrete");
  plant++;
}

const info = g.save(`${DIR}/way_162153999.nbt`);
console.log(JSON.stringify({ cells: cells.length, mainFace, sideFace, mainDoor: [mainDoor.x, mainDoor.z], sideDoor: [sideDoor.x, sideDoor.z], windows: windows.length, lit, plant, carved: carved.size, ...info }));

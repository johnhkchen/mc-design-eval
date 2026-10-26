// DC78821: 9th St NW, Penn Quarter commercial block. A brick and stone street block with shopfronts on the ground
// floor, a calcite belt course at each storey line, a stone cornice, and a setback attic tier in the middle of the roof.
// Lidar roof heights are quantised to five tiers (17 / 15 / 13 / 9 / 7) and mode-filtered so single noisy cells do not
// stick up; each column stands from its own ground to its own roof, so every storey sits on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cellList = JSON.parse(readFileSync(`${DIR}/DC78821.cells.json`, "utf8"));

// --- massing: quantise the lidar roof into tiers, then mode-filter the noise -----------------------------------
const tierOf = (r) => (r >= 16 ? 17 : r >= 14 ? 15 : r >= 12 ? 13 : r >= 9 ? 9 : 7);
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, g, r] of cellList) raw.set(key(x, z), { g, H: tierOf(r) });

const cell = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const count = {};
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!dx && !dz) continue;
    const n = raw.get(key(x + dx, z + dz));
    if (n) count[n.H] = (count[n.H] || 0) + 1;
  }
  let H = c.H;
  for (const t of Object.keys(count)) if (count[t] >= 5 && Number(t) !== c.H) H = Number(t);
  cell.set(k, { g: c.g, H });
}
const at = (x, z) => cell.get(key(x, z));

// --- which faces of a column are outside at height y: no neighbour, or the neighbour's roof is below y --------
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const n = at(x + dx, z + dz); return !n || n.H <= y;
});

// --- roles: decide what each cell of each column is, before anything is written -----------------------------
const GLASS_ROWS = [6, 7, 10, 11, 13, 15];   // upper window bands (between calcite sills and belts)
const BELTS = [4, 8, 12, 14];                 // calcite storey lines
const SILLS = [5, 9];                         // sill row under each upper window band

const roles = new Map();   // "x,y,z" -> role
const air = new Set();     // cells held open as the air behind a window
const facing = new Map();  // "x,y,z" -> outward direction, for panes and the door

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.H; y++) {
    const kk = `${x},${y},${z}`;
    if (y < c.g) { roles.set(kk, "fill"); continue; }
    if (y === c.g) { roles.set(kk, "plinth"); continue; }
    const ex = exposed(x, z, y);
    if (y === c.H - 1) { roles.set(kk, ex.length ? "cap" : "deck"); continue; }
    if (!ex.length) { roles.set(kk, "core"); continue; }
    if (ex.length >= 2) { roles.set(kk, "pier"); continue; }      // a corner is always solid
    const d = ex[0]; const [dx, dz] = DIRS[d];
    const index = dx ? z : x;                                        // position along the facade
    const pier = index % 3 === 0;
    // the cell behind a window: inside the footprint, taller than y, and not itself a face at y
    const inn = at(x - dx, z - dz);
    const inOK = !!inn && inn.H > y && inn.g <= y && exposed(x - dx, z - dz, y).length === 0;
    facing.set(kk, d);
    if (y >= c.g + 1 && y <= 2) {
      roles.set(kk, !pier && inOK ? "shopglass" : "shopfascia");
      if (!pier && inOK) air.add(`${x - dx},${y},${z - dz}`);
      continue;
    }
    if (y === 3) { roles.set(kk, "shopfascia"); continue; }
    const glassRow = GLASS_ROWS.includes(y) || (y === 5 && c.H === 7);
    if (glassRow && y < c.H - 1 && !pier && inOK) {
      roles.set(kk, "glass");
      air.add(`${x - dx},${y},${z - dz}`);
      continue;
    }
    if (BELTS.includes(y) && y < c.H - 1) { roles.set(kk, "belt"); continue; }
    if (SILLS.includes(y) && y !== c.H - 2) { roles.set(kk, "sill"); continue; }
    roles.set(kk, pier ? "pier" : "brick");
  }
}

// the street entrance: a door on the north face, in the shopfront
const DOOR = { x: 6, z: 0 };
{
  const c = at(DOOR.x, DOOR.z);
  const yLow = c.g + 1, yUp = c.g + 2;
  roles.set(`${DOOR.x},${yLow},${DOOR.z}`, "doorLow");
  roles.set(`${DOOR.x},${yUp},${DOOR.z}`, "doorUp");
}

// --- write: blocks in the grid, then the lights in the air behind some windows, then roof plant -----------------
const blocks = new Map();     // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const BLOCK = {
  fill: "stone", plinth: "stone_bricks", deck: "smooth_stone", cap: "stone_bricks", core: "stone",
  pier: "stone_bricks", brick: "bricks", belt: "calcite", sill: "calcite", shopfascia: "dark_oak_planks",
};

for (const [kk, role] of roles) {
  const [x, y, z] = kk.split(",").map(Number);
  if (air.has(kk) && role !== "shopglass" && role !== "glass") continue;      // open cells stay air
  if (role === "shopglass" || role === "glass") { put(x, y, z, "glass_pane", {}); continue; }
  if (role === "doorLow") { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
  if (role === "doorUp") { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
  put(x, y, z, BLOCK[role], undefined);
}

// lights behind some glass: lanterns in the shopfronts, glowstone and shroomlight in the upper windows
for (const kk of air) {
  const [x, y, z] = kk.split(",").map(Number);
  const hash = (x * 31 + z * 17 + y * 7) % 11;
  if (y <= 2 && hash % 4 === 0) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  else if (y > 2 && hash % 5 === 0) put(x, y, z, "glowstone", undefined);
  else if (y > 2 && hash === 7) put(x, y, z, "shroomlight", undefined);
}

// roof plant: a few stone boxes on the flat roofs (interior deck cells only)
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z, c.H - 1).length) continue;
  if (c.H !== 15 || (x * 7 + z * 11) % 37 !== 0) continue;   // a couple of boxes on the main roof, not battlements on the tower
  put(x, c.H, z, "polished_andesite", undefined);
  put(x, c.H + 1, z, "chiseled_stone_bricks", undefined);
}

// glass panes join the walls and each other along their facade: connected to any neighbour in the plane
for (const [kk, role] of roles) {
  if (role !== "glass" && role !== "shopglass") continue;
  const [x, y, z] = kk.split(",").map(Number);
  const d = facing.get(kk);
  const has = (X, Z) => blocks.has(`${X},${y},${Z}`);
  const ns = d === "W" || d === "E";
  const state = {
    north: String(ns && has(x, z - 1)), south: String(ns && has(x, z + 1)),
    east: String(!ns && has(x + 1, z)), west: String(!ns && has(x - 1, z)),
  };
  put(x, y, z, "glass_pane", state);
}

const g = new Voxels([26, 29, 18]);
for (const [kk, { block, state }] of blocks) {
  const [x, y, z] = kk.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC78821.nbt`);
console.log(`DC78821: ${out.blocks} blocks, ${out.palette} palette entries`);

// FR245190026: an Indifférencié block on the Île de la Cité, read as a five-storey Parisian limestone building (cream
// smooth sandstone, cut-stone piers, chiseled string courses, a shopfront and entrance at street level) under a slate
// mansard. Storeys are 5 blocks: y = 5k is the string course, y = 5k+1..5k+3 the windows, y = 5k+4 the lintel row.
// The lidar roof is median-smoothed and snapped to three flat tiers (26, 30, 34). Walls are a 1-block shell with an air
// gap behind the glass; each storey has a floor slab; the roof stands on the deck at y = 25.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245190026.cells.json`, "utf8"));

const W = 16, H = 50, D = 12;
const STOREY = 5, STOREYS = 5, DECK = STOREY * STOREYS;     // deck at y = 25
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// The footprint, its lidar roof, and each cell's snapped tier top (the roof's top surface is at y = T - 1).
const roofAt = new Map();
for (const [x, z, , r] of cells) roofAt.set(`${x},${z}`, r);
const inFp = (x, z) => roofAt.has(`${x},${z}`);
const snap = (v) => (v < 28 ? 26 : v < 32 ? 30 : 34);
const fp = new Map();
for (const key of roofAt.keys()) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const v = roofAt.get(`${x + dx},${z + dz}`); if (v !== undefined) vals.push(v);
  }
  vals.sort((a, b) => a - b);
  fp.set(key, { x, z, T: snap(vals[Math.floor(vals.length / 2)]), exposed: [] });
}
for (const c of fp.values()) for (const [d, [dx, dz]] of Object.entries(DIRS)) if (!inFp(c.x + dx, c.z + dz)) c.exposed.push(d);
const at = (x, z) => fp.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const glass = (d) => ({ north: d === "north" || d === "south" ? "false" : "true", south: d === "north" || d === "south" ? "false" : "true",
  east: d === "east" || d === "west" ? "false" : "true", west: d === "east" || d === "west" ? "false" : "true", waterlogged: "false" });
const pane = (d) => glass(d);

// 1. Interior: a floor slab per storey, the deck at y = 25, and an attic mass under the roof. Everything else is air.
for (const c of fp.values()) {
  if (c.exposed.length) continue;
  for (let k = 0; k <= STOREYS; k++) {
    const y = k * STOREY;
    if (y > DECK) break;
    g.set(c.x, y, c.z, "stone_bricks");
  }
  for (let y = DECK + 1; y < c.T; y++) g.set(c.x, y, c.z, "deepslate_tiles");
}

// 2. Shell: the exposed cells are walls to the top of their tier; the roof faces are slate with glass dormers.
for (const c of fp.values()) {
  if (!c.exposed.length) continue;
  const corner = c.exposed.length >= 2;
  const onNS = c.exposed.includes("north") || c.exposed.includes("south");
  const idx = onNS ? c.x : c.z;
  const pier = corner || idx % 3 === 0;
  const face = c.exposed[0];
  for (let y = 0; y < c.T; y++) {
    if (y >= DECK) {
      if (y === DECK) g.set(c.x, y, c.z, "chiseled_sandstone");
      else if (y <= DECK + 2 && idx % 3 === 1 && onNS && !corner) g.set(c.x, y, c.z, "glass_pane", pane(c.exposed.find((d) => d === "north" || d === "south")));
      else g.set(c.x, y, c.z, "deepslate_tiles");
      continue;
    }
    const k = Math.floor(y / STOREY), r = y % STOREY;
    if (y === 0) { g.set(c.x, y, c.z, "stone_bricks"); continue; }
    if (r === 0) { g.set(c.x, y, c.z, "chiseled_sandstone"); continue; }
    if (r === 4) { g.set(c.x, y, c.z, k === 0 ? "dark_oak_planks" : "chiseled_sandstone"); continue; }
    if (pier) { g.set(c.x, y, c.z, "cut_sandstone"); continue; }
    // An entrance on the north face, between two piers at street level; a window above it as a transom.
    if (k === 0 && r <= 2 && face === "north" && c.x === 4 && c.z === 0) {
      g.set(c.x, y, c.z, "dark_oak_door", { facing: "north", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    g.set(c.x, y, c.z, "glass_pane", pane(face));
  }
}

// 3. Warm light in some windows: a glowstone just inside the glass, in the air gap.
for (const c of fp.values()) {
  if (c.exposed.length !== 1) continue;
  const d = c.exposed[0];
  const [dx, dz] = DIRS[OPP[d]];
  const ix = c.x + dx, iz = c.z + dz;
  if (!inFp(ix, iz) || at(ix, iz).exposed.length) continue;
  for (let k = 0; k < STOREYS; k++) {
    if ((c.x * 7 + c.z * 3 + k * 5) % 5 !== 0) continue;
    const y = k * STOREY + 2;
    if (c.T <= y || y >= DECK) continue;
    if (k === 0 && c.x === 4 && c.z === 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 4. Chimney stacks rising from the roof of the two tallest tiers, standing on the cap.
for (const [x, z] of [[5, 5], [10, 5]]) {
  const c = fp.get(`${x},${z}`);
  if (!c) continue;
  for (let y = c.T; y < c.T + 3; y++) g.set(x, y, z, "bricks");
}

const stats = g.save(`${DIR}/FR245190026.nbt`);
console.log(JSON.stringify(stats));

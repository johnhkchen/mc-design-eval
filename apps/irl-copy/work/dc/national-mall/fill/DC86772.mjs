// DC86772: a 1930s limestone office block on the Mall's north edge. Five storeys and a set-back core over a plinth, fitted to the
// lidar: 12 blocks at the ring, a 13-block ring and a 14-block core set in from it. Calcite piers between glass panes, smooth
// quartz storey bands and cornice, a columned entrance on the front (z 0) with iron doors, lanterns behind a few panes.
// Rows are blocks above y 0; a cell's roof is its tier height t (its top row is t - 1). Interior is air except the storey floors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86772.cells.json`, "utf8"));
const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g }]));
const inside = (x, z) => at.has(`${x},${z}`);

// Clean tiers from the noisy lidar roof (12/13/14 patchy): a 14 core inside a 13 ring inside the 12 base.
const topOf = (x, z) =>
  x >= 4 && x <= 8 && z >= 6 && z <= 12 ? 14 : x >= 3 && x <= 9 && z >= 4 && z <= 13 ? 13 : 12;

// Storey rows: 0 plinth; 1-2 ground storey glazing; 3 band; 4-5 glazing; 6 band; 7-8 glazing; 9 band; 10 glazing; 11 band; 12 glazing.
// The top row of every cell is its cornice (exterior) or roof deck (interior).
const BANDS = new Set([3, 6, 9, 11]);
const BASE = "stone_bricks", PIER = "calcite", BAND = "smooth_quartz", FLOOR = "smooth_stone", DECK = "stone";
const PLANT = "stone_bricks";

// Faces of cell c that show at row y: a missing neighbour always shows; a lower neighbour shows from its top upward (a set-back wall).
function facesAt(c, y) {
  const out = [];
  for (const [d, dx, dz] of [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]]) {
    const nx = c.x + dx, nz = c.z + dz;
    if (!inside(nx, nz)) out.push(d);
    else if (topOf(nx, nz) < c.t && y >= topOf(nx, nz)) out.push(d);
  }
  return out;
}

const V = new Voxels([13, 26, 18]);
const placed = new Map();
const put = (x, y, z, block, state) => { V.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };
const DOOR = { facing: "north", open: "false", powered: "false" };

// Pass 1: the body, cell by cell, row by row.
const list = cells.map(([x, z, g]) => ({ x, z, g, t: topOf(x, z) }));
const panes = [];
for (const c of list) {
  for (let y = 0; y < c.t; y++) {
    const faces = facesAt(c, y);
    const shell = faces.length > 0;
    if (y === 0) { put(c.x, 0, c.z, BASE); continue; }                       // plinth / foundation row, every cell
    if (y < c.g) { put(c.x, y, c.z, BASE); continue; }
    if (y === c.t - 1) { put(c.x, y, c.z, shell ? BAND : DECK); continue; }   // cornice or roof deck
    if (BANDS.has(y)) { put(c.x, y, c.z, shell ? BAND : FLOOR); continue; }    // storey line, or floor slab
    if (!shell) continue;                                                       // interior air behind the glass
    // Glazing row: a corner or the pier stations (every third block along the face) are calcite, the rest glass.
    if (faces.length >= 2) { put(c.x, y, c.z, PIER); continue; }
    const u = faces[0] === "N" || faces[0] === "S" ? c.x : c.z;
    if (u % 3 === 0) { put(c.x, y, c.z, PIER); continue; }
    put(c.x, y, c.z, "glass_pane");
    panes.push({ x: c.x, y, z: c.z, face: faces[0] });
  }
}

// Pass 2: the entrance (front, z 0, x 4..7): pillars either side of a double iron door, a lintel over, no interior.
for (const x of [4, 5, 6, 7]) {
  if (!inside(x, 0)) continue;
  if (x === 5 || x === 6) {
    const hinge = x === 5 ? "left" : "right";
    put(x, 1, 0, "iron_door", { ...DOOR, half: "lower", hinge });
    put(x, 2, 0, "iron_door", { ...DOOR, half: "upper", hinge });
  } else {
    put(x, 1, 0, "quartz_pillar", { axis: "y" });
    put(x, 2, 0, "quartz_pillar", { axis: "y" });
  }
  put(x, 3, 0, BAND);                                                            // lintel on the pillars
}

// Pass 3: pane connections along the face (a pane arms towards any shell block beside it, as the vanilla glass pane does).
for (const p of panes) {
  if (placed.get(`${p.x},${p.y},${p.z}`) !== "glass_pane") continue;   // the entrance bay keeps its doors and pillars
  const arms = p.face === "N" || p.face === "S"
    ? { west: placed.has(`${p.x - 1},${p.y},${p.z}`), east: placed.has(`${p.x + 1},${p.y},${p.z}`), north: false, south: false }
    : { north: placed.has(`${p.x},${p.y},${p.z - 1}`), south: placed.has(`${p.x},${p.y},${p.z + 1}`), west: false, east: false };
  const st = Object.fromEntries(Object.entries(arms).map(([k, v]) => [k, v ? "true" : "false"]));
  V.set(p.x, p.y, p.z, "glass_pane", { ...st, waterlogged: "false" });
}

// Pass 4: lanterns hanging from the floor above, behind some panes (interior cells just inside the front and back faces).
const lanterns = [
  ...[2, 5, 8, 10].flatMap((y) => [2, 8].map((x) => [x, y, 1])),
  ...[5, 8].flatMap((y) => [2, 8].map((x) => [x, y, 16])),
];
for (const [x, y, z] of lanterns) {
  if (!inside(x, z) || placed.has(`${x},${y},${z}`) || !placed.has(`${x},${y + 1},${z}`)) continue;
  V.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 5: roof plant on the 12 ring: two small boxes stood on the deck (their deck, the row below, is solid).
for (const [x, z] of [[1, 9], [2, 9], [1, 10], [2, 10], [9, 15], [10, 15]]) {
  if (topOf(x, z) !== 12 || !inside(x, z)) continue;
  put(x, 12, z, PLANT);
}

const stats = V.save(`${DIR}/DC86772.nbt`);
console.log(JSON.stringify(stats));

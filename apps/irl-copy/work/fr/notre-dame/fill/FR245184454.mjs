// FR245184454: a 1910 residential block, seven storeys in limestone (calcite piers, smooth-stone strings and lintels,
// a stone-brick plinth) on a flat deepslate roof behind a stone-brick parapet. Storeys are 4 blocks: strings at y = 1 mod 4,
// lintels at 0 mod 4, so every roof tier (21, 25, 29, from the lidar) lands on a string course and stands on a lintel.
// Rows 2-3 of each storey are the window band on the facade and air behind the glass inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184454.cells.json`, "utf8"));

const W = 14, H = 45, D = 17;
const TIERS = [21, 25, 29];                           // 5, 6 and 7 storeys: all 1 mod 4

// Footprint: lidar roof per cell, 3x3 median to kill the noisy edge cells, then snapped to the nearest tier (ties go up).
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const T = (x, z) => at(x, z)?.T ?? 0;                 // no building is open air, so an edge reads as a face
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = TIERS.reduce((best, t) => (Math.abs(t - med) <= Math.abs(best - med) ? t : best));
}

const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
// Faces of a cell at height y that look onto air: the neighbour beside it does not reach that row.
const exposed = (x, z, y) => NEI.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([n]) => n);

// The roof's edge: a side with no building or a lower one beside it (an equal neighbour is deck, not a drop).
const roofEdge = (x, z) => NEI.some(([, dx, dz]) => T(x + dx, z + dz) < T(x, z));

// Entrance: the middle of the street (south) run of cells on the footprint's last row.
const zMax = Math.max(...[...fp.keys()].map((k) => Number(k.split(",")[1])));
const southRow = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === zMax).map(([x]) => x).sort((a, b) => a - b);
const DOOR_X = southRow[Math.floor(southRow.length / 2)];
const DOOR = `${DOOR_X},${zMax}`;

const Y = { PLINTH: 0 };
const isFloorRow = (y) => y % 4 === 0 || y % 4 === 1; // lintel (0 mod 4) and string (1 mod 4): solid floors and ceilings

const LIGHT_STOREYS = [2, 4, 6];                      // a few lit windows on the noble-to-upper floors

// Parapet connections: a wall joins its neighbours that stand at the same roof height.
const wallState = (x, z, t) => {
  const s = { up: "true" };
  for (const [name, dx, dz] of NEI) s[name] = T(x + dx, z + dz) === t ? "low" : "none";
  s.waterlogged = "false";
  return s;
};

// Glass pane whose connections run along the face it is on (east-west on a north or south face, else north-south).
const paneState = (face) => {
  const along = face === "north" || face === "south" ? ["east", "west"] : ["north", "south"];
  const s = {};
  for (const d of ["north", "east", "south", "west"]) s[d] = along.includes(d) ? "true" : "false";
  s.waterlogged = "false";
  return s;
};

// Classify one cell: [block, state] for filled cells, null for air.
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  const t = c.T;
  if (y > t) return null;
  if (y === t) {                                       // roof: parapet on the exposed edge, deck inside
    if (roofEdge(x, z)) return ["stone_brick_wall", wallState(x, z, t)];
    return ["deepslate_tiles"];
  }
  if (y === Y.PLINTH) return ["stone_bricks"];
  if (isFloorRow(y)) return ["smooth_stone"];          // floor slab and lintel: solid under every storey, inside too
  const faces = exposed(x, z, y);
  if (!faces.length) return null;                      // interior air behind the glass
  const face = faces[0];
  const u = face === "north" || face === "south" ? x : z;
  const storey = Math.ceil(y / 4);
  if (`${x},${z}` === DOOR) {
    if (y === 1) return ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === 2) return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === 3 && (`${x},${z}` === `${DOOR_X - 1},${zMax}` || `${x},${z}` === `${DOOR_X + 1},${zMax}`)) {
    return ["lantern", { hanging: "true", waterlogged: "false" }];
  }
  if (u % 3 === 0) return ["calcite"];                // piers between the windows
  if (y === 2 && LIGHT_STOREYS.includes(storey) && (x * 7 + z * 3 + storey) % 5 === 0) return ["glowstone"];
  return ["glass_pane", paneState(face)];
}

// Roof equipment: two brick chimneys on the top deck, set well inside the roof (the interior cells nearest two targets).
const roofInside = [...fp.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => T(x, z) === TIERS[TIERS.length - 1] && !roofEdge(x, z));
const nearest = (tx, tz) => roofInside.reduce((best, c) =>
  (Math.abs(c[0] - tx) + Math.abs(c[1] - tz) < Math.abs(best[0] - tx) + Math.abs(best[1] - tz) ? c : best));
const CHIMNEYS = [nearest(4, 5), nearest(9, 11)];

const g = new Voxels([W, H, D]);
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= c.T; y++) {
    const b = cls(x, z, y);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}
for (const [x, z] of CHIMNEYS) {
  const t = T(x, z);
  if (!t || roofEdge(x, z)) continue;
  for (let y = t + 1; y <= t + 2; y++) g.set(x, y, z, "bricks");
  g.set(x, t + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/FR245184454.nbt`);

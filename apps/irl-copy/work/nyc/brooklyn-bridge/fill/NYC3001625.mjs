import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001625";
const W = 10, H = 27, D = 12;

// ---- read footprint -------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const cells = list.map((c) =>
  Array.isArray(c)
    ? { x: Math.round(c[0]), z: Math.round(c[1]), g: Math.round(c[2]), r: Math.round(c[3]) }
    : { x: Math.round(c.x), z: Math.round(c.z), g: Math.round(c.ground), r: Math.round(c.roof) }
);

const key = (x, z) => `${x},${z}`;
const S = new Map(cells.map((c) => [key(c.x, c.z), c]));
const has = (x, z) => S.has(key(x, z));

const minX = Math.min(...cells.map((c) => c.x));
const minZ = Math.min(...cells.map((c) => c.z));

// Ground-floor level: uphill (highest) ground.
const F = Math.max(1, Math.max(...cells.map((c) => c.g)));

// Flat roof: median of lidar roof heights, kept inside the volume.
const roofs = cells.map((c) => c.r).sort((a, b) => a - b);
const ROOF = Math.min(H - 2, Math.max(F + 6, roofs[Math.floor(roofs.length / 2)]));

// ---- exposure -------------------------------------------------------------
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x - 1, z)) f.push("west");
  return f;
};
const isPerim = (x, z) => faces(x, z).length > 0;
// Core: interior cell whose four neighbours are all interior, so it sits behind the air gap.
const isCore = (x, z) =>
  !isPerim(x, z) &&
  [[x, z - 1], [x, z + 1], [x + 1, z], [x - 1, z]].every(([a, b]) => has(a, b) && !isPerim(a, b));

const idxOf = (x, z, dir) => (dir === "north" || dir === "south" ? x - minX : z - minZ);
const innerOf = (x, z, dir) => {
  if (dir === "north") return [x, z + 1];
  if (dir === "south") return [x, z - 1];
  if (dir === "east") return [x - 1, z];
  return [x + 1, z];
};

// Entrance: the facade with the most exposed cells, middle bay of that facade.
const dirs = ["north", "south", "east", "west"];
const count = { north: 0, south: 0, east: 0, west: 0 };
for (const c of cells) for (const f of faces(c.x, c.z)) count[f]++;
const entDir = dirs.reduce((a, b) => (count[b] > count[a] ? b : a));
const onEnt = cells
  .filter((c) => faces(c.x, c.z).includes(entDir))
  .sort((a, b) => idxOf(a.x, a.z, entDir) - idxOf(b.x, b.z, entDir));
const entC = onEnt[Math.floor(onEnt.length / 2)];
const entKey = key(entC.x, entC.z);

// ---- block plan -----------------------------------------------------------
const paneProps = (dir) =>
  dir === "north" || dir === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function plan(c, y) {
  const { x, z, g } = c;
  const fc = faces(x, z);
  const perim = fc.length > 0;
  const dir = fc.includes(entDir) ? entDir : fc[0];

  // solid ground below the cell
  if (y < g) return ["stone_bricks"];

  if (!perim) {
    // masonry core behind the air gap
    if (isCore(x, z)) return y === ROOF - 1 ? ["smooth_stone"] : ["bricks"];
    // ring behind the glass: floor slabs per storey, roof deck, air gap elsewhere
    if (y < F) return y === F - 1 ? ["smooth_stone"] : null;
    return y === ROOF - 1 || (y - F) % 2 === 0 ? ["smooth_stone"] : null;
  }

  // entrance door, two blocks tall at the ground floor
  if (key(x, z) === entKey && dir === entDir && (y === F || y === F + 1)) {
    return ["dark_oak_door", {
      facing: entDir, half: y === F ? "lower" : "upper",
      hinge: "left", open: "false", powered: "false",
    }];
  }

  if (y === ROOF) return ["stone_brick_wall"];                 // parapet
  if (y === ROOF - 1 && y >= F) return ["stone_bricks"];       // cornice
  if (y === F - 1) return ["stone_bricks"];                    // base course

  const windowRow = y >= F ? (y - F) % 2 === 1 : (F - 1 - y) % 2 === 1;
  if (!windowRow) {
    // storey bands in brownstone-coloured terracotta; basement bands in stone
    return y >= F ? ["brown_terracotta"] : ["stone_bricks"];
  }
  const i = idxOf(x, z, dir);
  if (i % 3 === 0) return ["bricks"];                          // piers
  return ["glass_pane", paneProps(dir)];                       // windows
}

// ---- build ----------------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, arr) => {
  if (!arr) return;
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (arr.length > 1) g.set(x, y, z, arr[0], arr[1]);
  else g.set(x, y, z, arr[0]);
};

for (const c of cells) {
  for (let y = 0; y <= ROOF; y++) put(c.x, y, c.z, plan(c, y));
}

// Warm light behind some upper-storey windows (inner cell must be open air).
for (const c of cells) {
  const fc = faces(c.x, c.z);
  if (fc.length === 0) continue;
  const dir = fc.includes(entDir) ? entDir : fc[0];
  const [ix, iz] = innerOf(c.x, c.z, dir);
  if (!has(ix, iz) || isPerim(ix, iz) || isCore(ix, iz)) continue;
  const idx = idxOf(c.x, c.z, dir);
  if (idx % 3 === 0) continue;
  for (let y = F + 1; y < ROOF - 1; y += 2) {
    const s = Math.floor((y - F) / 2);
    if (c.g > y) continue;
    if ((idx + s * 2) % 4 === 1) put(ix, y, iz, ["glowstone"]);
  }
}

g.save(`${DIR}/${ID}.nbt`);

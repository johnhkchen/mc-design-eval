import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833622";
const W = 21, H = 23, D = 21;
const ROOF_Y = 10;   // top block of parapet; roof surface at 9, parapet to 10

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = raw.map(c => (Array.isArray(c) ? c : [c.x, c.z, c.ground]));
const minG = Math.min(...rows.map(r => r[2]));

// footprint: key -> { x, z, g } with g relative to the lowest ground (y 0)
const cells = new Map();
for (const [x, z, gr] of rows) {
  const g = Math.min(8, Math.max(0, Math.round(gr - minG)));
  cells.set(`${x},${z}`, { x, z, g });
}

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const PRIORITY = ["south", "north", "east", "west"];

const has = (x, z) => cells.has(`${x},${z}`);

// Exposed faces per cell and depth (0 = facade ring, >=1 = interior)
const exposed = new Map();
const depth = new Map();
const queue = [];
for (const [k, c] of cells) {
  const faces = Object.keys(DIRS).filter(f => {
    const [dx, dz] = DIRS[f];
    return !has(c.x + dx, c.z + dz);
  });
  exposed.set(k, faces);
  if (faces.length) {
    depth.set(k, 0);
    queue.push(k);
  }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i];
  const c = cells.get(k);
  const d = depth.get(k);
  for (const [dx, dz] of Object.values(DIRS)) {
    const nk = `${c.x + dx},${c.z + dz}`;
    if (cells.has(nk) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push(nk);
    }
  }
}

// Entrance: median facade cell on the south face (fallback north)
let doorKey = null;
{
  const pick = face => [...cells.values()]
    .filter(c => depth.get(`${c.x},${c.z}`) === 0 && exposed.get(`${c.x},${c.z}`).includes(face))
    .sort((a, b) => a.x - b.x);
  const list = pick("south").length ? pick("south") : pick("north");
  if (list.length) {
    const m = list[Math.floor(list.length / 2)];
    doorKey = `${m.x},${m.z}`;
  }
}

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

for (const [k, c] of cells) {
  const { x, z, g } = c;
  const d = depth.get(k);
  const faces = exposed.get(k);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  if (d >= 1) {
    // Interior: floor slabs per storey and the roof deck; air elsewhere (no interiors)
    put(x, 5, z, "smooth_stone");
    put(x, 9, z, "smooth_stone");
    continue;
  }

  // Facade ring
  const primary = PRIORITY.find(f => faces.includes(f)) ?? faces[0];
  const alongX = primary === "north" || primary === "south";
  const along = alongX ? x : z;
  const mullion = ((along % 3) + 3) % 3 === 0;
  const isDoor = k === doorKey;
  const [ox, oz] = DIRS[primary];
  const inner = [x - ox, z - oz];
  const innerKey = `${inner[0]},${inner[1]}`;
  const canLight = cells.has(innerKey) && depth.get(innerKey) === 1 && (((along % 6) + 6) % 6 === 1);

  for (let y = g; y <= ROOF_Y; y++) {
    // Entrance doors at ground level
    if (isDoor && (y === g || y === g + 1)) {
      const props = {
        facing: primary,
        half: y === g ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
      put(x, y, z, "dark_oak_door", props);
      continue;
    }

    let id;
    if (y === g) id = "polished_granite";                       // base course
    else if (isDoor && y === g + 2) id = "light_gray_concrete"; // door lintel
    else if (y < 4) id = mullion ? "white_concrete" : "glass";  // shopfront glazing
    else if (y === 4) id = "light_gray_concrete";               // ground storey lintel
    else if (y === 5 || y === 8) id = "light_gray_concrete";    // spandrels
    else if (y === 6 || y === 7) id = mullion ? "white_concrete" : "light_blue_stained_glass";
    else if (y === 9) id = "smooth_quartz";                     // cornice
    else id = "white_concrete";                                 // parapet

    put(x, y, z, id);

    // Warm light behind some upper-storey windows
    if (canLight && (y === 6 || y === 7) && !mullion && y === 6) {
      put(inner[0], 6, inner[1], "glowstone");
    }
  }
}

// Rooftop plant: central block with a lantern on top
for (const [k, c] of cells) {
  const { x, z } = c;
  if (Math.abs(x - 10) <= 3 && Math.abs(z - 10) <= 3 && depth.get(k) >= 2) {
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
    if (Math.abs(x - 10) <= 1 && Math.abs(z - 10) <= 1) {
      put(x, ROOF_Y + 2, z, "light_gray_concrete");
    }
  }
}
if (has(10, 10)) put(10, ROOF_Y + 3, 10, "lantern", { hanging: "false", waterlogged: "false" });

vox.save(`${DIR}/${ID}.nbt`);

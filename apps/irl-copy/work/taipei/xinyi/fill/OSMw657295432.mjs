import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 遠東大廈 (Far Eastern Building), Xinyi. Late-1980s Taipei mid-rise:
// two storeys of glazed bays on a stone base, white-tile spandrels,
// grey string courses, a plain parapet, and a shopfront ground floor.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw657295432";
const W = 35, H = 23, D = 35;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const roofY = minG + 11;          // lidar: roof ~11 blocks above lowest ground
const CENTRE = Math.floor(W / 2); // entrance column on the south front

const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const exposedOf = (x, z) =>
  DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz)).map((d) => d[0]);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, shell, floor slabs, roof.
for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gy; y++) put(x, y, z, "stone_bricks");

  const ex = exposedOf(x, z);
  const facade = ex.length > 0;
  const corner = ex.length >= 2;
  const alongX = ex.includes("north") || ex.includes("south"); // wall runs east-west
  const idx = alongX ? x : z;

  for (let y = minG + 1; y <= roofY; y++) {
    if (y <= gy) continue; // already foundation
    const rel = y - minG;

    if (y === roofY) {
      put(x, y, z, facade ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    if (!facade) {
      // Interior: only the storey slabs (ground floor and second floor).
      if (rel === 1 || rel === 6) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade rows.
    if (rel === 1) { put(x, y, z, "stone_bricks"); continue; }      // base course
    if (rel === 5) { put(x, y, z, "light_gray_concrete"); continue; } // string course
    if (rel === 6 || rel === 10) { put(x, y, z, "white_concrete"); continue; } // spandrels

    // Window rows: 2-4 (shopfront / ground storey) and 7-9 (upper storey).
    if (corner) { put(x, y, z, "white_concrete"); continue; }

    const pillar = idx % 3 === 0;
    if (pillar) {
      put(x, y, z, rel <= 4 ? "stone_bricks" : "white_concrete");
      continue;
    }

    // Entrance on the south front, centre bay.
    if (ex.includes("south") && x === CENTRE && (rel === 2 || rel === 3)) {
      const half = rel === 2 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (ex.includes("south") && Math.abs(x - CENTRE) <= 2 && rel === 4) {
      put(x, y, z, "light_gray_concrete"); // entrance canopy lintel
      continue;
    }

    put(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
  }
}

// Pass 2: warm light behind some upper-storey glass (glowstone in the room behind).
for (const [x, z, gy] of cells) {
  const ex = exposedOf(x, z);
  if (ex.length !== 1) continue; // straight facades only
  const side = ex[0];
  const alongX = side === "north" || side === "south";
  const idx = alongX ? x : z;
  if (idx % 3 === 0 || idx % 6 !== 4) continue;
  const y = minG + 8;
  if (y <= gy) continue;

  let ix = x, iz = z;
  if (side === "north") iz = z + 1;
  else if (side === "south") iz = z - 1;
  else if (side === "west") ix = x + 1;
  else ix = x - 1;

  if (!has(ix, iz)) continue;
  if (exposedOf(ix, iz).length > 0) continue; // thin wing: no room behind
  if (y <= ground.get(`${ix},${iz}`)) continue;
  put(ix, y, iz, "glowstone");
}

// Pass 3: roof equipment (small plant boxes on the roof), if the canvas allows.
if (roofY + 1 < H) {
  for (const [x, z] of cells) {
    if (exposedOf(x, z).length > 0) continue;
    if (x % 8 === 4 && z % 8 === 4) {
      put(x, roofY + 1, z, "white_concrete");
      if (roofY + 2 < H) put(x, roofY + 2, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

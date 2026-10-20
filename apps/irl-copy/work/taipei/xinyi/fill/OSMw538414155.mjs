import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414155";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const missing = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);
const isB = (x, z) => missing(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Bounding box centre (for the roof plant and the door choice)
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const cz = (Math.min(...zs) + Math.max(...zs)) / 2;

// Main entrance: a north or south facade cell nearest the centre line, preferring south
let doorKey = null, doorDir = null, best = Infinity;
for (const [x, z] of cells) {
  const m = missing(x, z);
  for (const d of ["S", "N"]) {
    if (!m.includes(d)) continue;
    const score = Math.abs(x - cx) + (d === "S" ? 0 : 0.5);
    if (score < best) { best = score; doorKey = `${x},${z}`; doorDir = d; }
  }
}

const paneProps = (axisX) =>
  axisX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, walls, floors, roof
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const m = missing(x, z);
  if (m.length === 0) {
    // Interior: floor slabs at the storey lines, roof deck, central roof plant
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 8, z, "smooth_stone");
    put(x, gr + 9, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 3) put(x, gr + 10, z, "gray_concrete");
    continue;
  }

  // Boundary cell: facade wall
  const axisX = m.includes("N") || m.includes("S");
  const corner = (m.includes("N") || m.includes("S")) && (m.includes("W") || m.includes("E"));
  const i = axisX ? x : z;
  const pier = (n) => corner || i % n === 0;
  const key = `${x},${z}`;
  const isDoor = key === doorKey;
  const outward = m.includes(doorDir) && isDoor ? doorDir : m[0];

  // Plinth
  put(x, gr, z, "stone_bricks");

  // Ground storey shopfronts (glass with white piers)
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor && y === gr + 1) continue;
    if (isDoor && y === gr + 2) continue;
    if (isDoor && y === gr + 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (pier(4)) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps(axisX));
  }
  if (isDoor) {
    const doorProps = (half) => ({
      facing: FACING[outward], half, hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 1, z, "oak_door", doorProps("lower"));
    put(x, gr + 2, z, "oak_door", doorProps("upper"));
  }

  // Sign band, spandrel, upper storey windows, header, parapet
  put(x, gr + 4, z, "red_concrete");
  put(x, gr + 5, z, "smooth_quartz");
  for (let y = gr + 6; y <= gr + 7; y++) {
    if (pier(3)) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps(axisX));
  }
  put(x, gr + 8, z, "smooth_quartz");
  put(x, gr + 9, z, "white_concrete");
  put(x, gr + 10, z, "white_concrete");
}

// Pass 2: warm lights behind some windows (inside the air gap)
for (const [x, z, gr] of cells) {
  const m = missing(x, z);
  if (!m.length) continue;
  const axisX = m.includes("N") || m.includes("S");
  const i = axisX ? x : z;
  if (`${x},${z}` === doorKey) continue;
  const out = m[0];
  const [dx, dz] = DIRS[out];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isB(ix, iz)) continue;
  if (i % 6 === 1) put(ix, gr + 2, iz, "shroomlight");
  if (i % 6 === 4) put(ix, gr + 6, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);

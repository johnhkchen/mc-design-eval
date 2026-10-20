import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 14 x 8 footprint, roof ~21 blocks above lowest ground.
// Read: a 1960s-80s Taipei mid-rise commercial block, four storeys of ~5 blocks,
// cream tiled facade with a stone base, pale quartz storey bands, blue-tinted
// window bays, a ground-floor shopfront with a canopy and entrance, and a
// parapet with rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833887";
const W = 14, H = 33, D = 8;
const ROOF = 20;      // roof deck / cornice level
const PARAPET = 21;   // parapet and rooftop plant level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${Number(x)},${Number(z)}`, Number(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const exposure = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Front (north-facing, z minimum) cells decide the entrance position.
const frontXs = cells
  .filter(([x, z]) => !has(Number(x), Number(z) - 1))
  .map(([x]) => Number(x));
const midX = (W - 1) / 2;
const doorX = frontXs.length
  ? frontXs.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), frontXs[0])
  : Math.floor(midX);

for (const [cx, cz, cg0] of cells) {
  const x = Number(cx), z = Number(cz);
  const gr = Math.min(Number(cg0), 20);
  const e = exposure(x, z);
  const wall = e.N || e.S || e.W || e.E;
  const corner = (e.N || e.S) && (e.W || e.E);
  const alongX = e.N || e.S;
  const front = e.N;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Inward neighbour (interior side of a wall cell) for lights behind glass.
  const inward = (() => {
    if (e.N) return [x, z + 1];
    if (e.S) return [x, z - 1];
    if (e.W) return [x + 1, z];
    if (e.E) return [x - 1, z];
    return null;
  })();
  const inwardIsInterior = (() => {
    if (!inward) return false;
    const [ix, iz] = inward;
    if (!has(ix, iz)) return false;
    const ie = exposure(ix, iz);
    return !(ie.N || ie.S || ie.W || ie.E);
  })();

  if (!wall) {
    // Interior: floor slabs and roof deck only, air between.
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr) put(x, y, z, "smooth_stone");
      else if (y === ROOF) put(x, y, z, "smooth_stone");
      else if (y % 5 === 0) put(x, y, z, "smooth_stone");
    }
    // Rooftop plant on the deck.
    if ((x * 3 + z) % 7 === 0) put(x, PARAPET, z, "light_gray_concrete");
    continue;
  }

  if (corner) {
    // Corner pillars run the full height.
    for (let y = gr; y <= PARAPET; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
    continue;
  }

  const paneProps = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
  const idx = alongX ? x : z;

  for (let y = gr; y <= PARAPET; y++) {
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }
    if (y === ROOF) { put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === PARAPET) { put(x, y, z, "quartz_block"); continue; }
    if (y > ROOF) continue;

    // Storey line.
    if (y % 5 === 0) { put(x, y, z, "quartz_block"); continue; }

    const row = y % 5; // 1..4
    const groundFloor = y < 5;

    // Entrance door on the front, ground floor.
    if (front && x === doorX && groundFloor && (y === gr + 1 || y === gr + 2) && gr + 2 < 5) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    // Canopy above the shopfront entrance.
    if (row === 4 && front && groundFloor && Math.abs(x - doorX) <= 3) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Spandrel row between window bands.
    if (row === 4) { put(x, y, z, "smooth_quartz"); continue; }

    // Shopfront glass on the front ground floor.
    if (front && groundFloor && y > gr) {
      put(x, y, z, "glass_pane", { ...paneProps });
      continue;
    }

    // Window bays with piers.
    if (idx % 3 === 0) { put(x, y, z, "quartz_block"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", { ...paneProps });

    // Warm light behind some panes, standing on the floor slab inside.
    const lightRow = (y === gr + 1) || (y > gr + 1 && row === 1);
    if (lightRow && idx % 4 === 1 && inwardIsInterior) {
      put(inward[0], y, inward[1], "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

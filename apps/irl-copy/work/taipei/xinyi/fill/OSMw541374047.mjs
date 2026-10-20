import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unnamed 1980s-90s Xinyi-style mid-rise: two storeys of tiled concrete over a
// stone plinth, with ribbon glazing between quartz pilasters, a light grey
// spandrel band, a parapet cap and a central roof box. Front door faces north.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374047";
const W = 24, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.round(gr));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
let B = Infinity;
for (const v of ground.values()) B = Math.min(B, v);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const faceOf = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  return f;
};
const INWARD = { west: [1, 0], east: [-1, 0], north: [0, 1], south: [0, -1] };
const paneProps = (face) =>
  (face === "west" || face === "east")
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// 1. Foundation from y 0 up to each cell's ground, and floor slabs at storey lines
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (const r of [5, 10]) {
    if (gr <= B + r) put(x, B + r, z, "smooth_stone");
  }
}

// 2. Perimeter walls: plinth, ribbon glazing with quartz pilasters, spandrels, parapet
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const faces = faceOf(x, z);
  if (!faces.length) continue;
  const corner = faces.length >= 2;
  const face = faces[0];
  const t = (face === "west" || face === "east") ? z : x;
  for (let y = gr; y <= B + 11; y++) {
    const r = y - B;
    let id, props;
    if (r === 0) id = "stone_bricks";
    else if (r === 4 || r === 5 || r === 10) id = "smooth_quartz";
    else if (r === 9) id = "light_gray_concrete";
    else if (r === 11) { id = "smooth_quartz_slab"; props = { type: "bottom", waterlogged: "false" }; }
    else if ((r >= 1 && r <= 3) || (r >= 6 && r <= 8)) {
      if (corner || t % 3 === 0) id = "smooth_quartz";
      else { id = "light_blue_stained_glass_pane"; props = paneProps(face); }
    } else continue;
    put(x, y, z, id, props);
  }
}

// 3. Warm light just inside some windows
for (const [x, z] of cells) {
  const faces = faceOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const t = (face === "west" || face === "east") ? z : x;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  const gi = gAt(ix, iz), gw = gAt(x, z);
  for (const r of [2, 7]) {
    const y = B + r;
    if (t % 3 === 0 || (t + r) % 4 !== 0) continue;
    if (y >= gi && y >= gw) put(ix, y, iz, "glowstone");
  }
}

// 4. Entrance on the north face: doors, a canopy over them, and a light inside
const northRow = cells.filter(([x, z]) => !has(x, z - 1));
if (northRow.length) {
  const xs = northRow.map((c) => c[0]).sort((a, b) => a - b);
  const dx = xs[Math.floor(xs.length / 2)];
  const dz = northRow.find((c) => c[0] === dx)[1];
  const gr = gAt(dx, dz);
  put(dx, gr, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const ox of [-1, 0, 1]) {
    const x = dx + ox;
    if (northRow.some(([cx]) => cx === x)) {
      put(x, gr + 2, dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  if (has(dx, dz + 1)) put(dx, gr + 1, dz + 1, "glowstone");
}

// 5. Roof: central solid plant box with a capping slab
const px0 = minX + 4, px1 = maxX - 4, pz0 = minZ + 3, pz1 = maxZ - 3;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    const gr = gAt(x, z);
    if (gr > B + 10) continue;
    const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
    put(x, B + 11, z, edge ? "light_gray_concrete" : "smooth_stone");
    put(x, B + 12, z, edge ? "light_gray_concrete" : "smooth_stone");
    put(x, B + 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial-office block, Xinyi, c. 1980s: cream tiled wall, granite base,
// light-blue glass bands, quartz storey lines and a parapet. Two storeys over a
// shopfront, roof at y 10 above the lowest ground, sloped foundation below.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703665";
const W = 19, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const FACE_ORDER = ["north", "south", "west", "east"];
const faces = (x, z) => FACE_ORDER.filter(f => !has(x + OUT[f][0], z + OUT[f][1]));
const isEdge = (x, z) => faces(x, z).length > 0;
const firstFace = (x, z) => faces(x, z)[0];

const keys = [...ground.keys()].map(k => k.split(",").map(Number));
const xs = keys.map(k => k[0]), zs = keys.map(k => k[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const maxG = Math.max(...ground.values());

// Uniform roof level, about 11 blocks above the lowest ground (parapet top = roofY + 2).
const roofY = Math.min(Math.max(10, maxG + 8), H - 8);

// Entrance: south face, near the middle of its run.
const southCells = [];
for (const [x, z] of keys) if (faces(x, z).includes("south")) southCells.push(x);
southCells.sort((a, b) => a - b);
const medX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : Math.floor((minX + maxX) / 2);
let ex = medX, ez = null;
for (const [x, z] of keys) {
  if (faces(x, z).includes("south") && x === medX) ez = z;
}
if (ez === null) {
  // Fallback: any southern-most cell nearest the middle.
  let best = Infinity;
  for (const [x, z] of keys) {
    if (faces(x, z).includes("south") && Math.abs(x - medX) < best) { best = Math.abs(x - medX); ex = x; ez = z; }
  }
}
const entranceFace = "south";

const g = new Voxels([W, H, D]);

const set = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const paneProps = (face) =>
  (face === "north" || face === "south")
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

function wall(x, y, z, face, t, gr) {
  if (y === gr) { set(x, y, z, "polished_granite"); return; }
  const isEntrance = face === entranceFace && x === ex && z === ez;
  if (y < 5) {
    if (isEntrance && y <= gr + 2) return; // doorway, door placed afterwards
    if (face === "south" && Math.abs(x - ex) <= 1 && y === gr + 3 && gr + 3 <= 4) {
      set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      return;
    }
    if (y === 4) { set(x, y, z, "smooth_quartz"); return; }
    if (t % 3 === 0) set(x, y, z, "polished_andesite");
    else set(x, y, z, "light_blue_stained_glass");
    return;
  }
  if (y === 5) { set(x, y, z, "smooth_quartz"); return; }
  if (y < roofY - 1) {
    if (t % 3 === 0) { set(x, y, z, "polished_andesite"); return; }
    set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
    // Warm light in some upper windows, one block inside the glass.
    if (y === 7 && t % 6 === 2) {
      const ix = x - OUT[face][0], iz = z - OUT[face][1];
      if (has(ix, iz) && !isEdge(ix, iz)) set(ix, y, iz, "glowstone");
    }
    return;
  }
  set(x, y, z, "smooth_quartz"); // spandrel under the roof line
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of keys.map(([x, z]) => [x, z, G(x, z)])) {
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
}

// 2. Body: hollow shell with floor slabs; roof slab and parapet.
for (const [x, z] of keys) {
  const gr = G(x, z);
  const edge = isEdge(x, z);
  const face = firstFace(x, z);
  const t = (face === "north" || face === "south") ? x : z;

  for (let y = gr; y < roofY; y++) {
    if (edge) {
      if (y === roofY - 1 && y < 5) continue;
      wall(x, y, z, face, t, gr);
    } else {
      if (y === gr) set(x, y, z, "smooth_stone");
      else if (y === 5 && gr < 5) set(x, y, z, "smooth_quartz");
    }
  }

  set(x, roofY, z, edge ? "smooth_quartz" : "light_gray_concrete");
  if (edge) {
    set(x, roofY + 1, z, "smooth_quartz");
    set(x, roofY + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 3. Entrance door on the south face.
if (ez !== null) {
  set(ex, G(ex, ez) + 1, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(ex, G(ex, ez) + 2, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 4. Roof plant enclosure and antenna, inside the footprint.
const cx = Math.round((minX + maxX) / 2), cz = Math.round((minZ + maxZ) / 2);
for (let x = cx - 3; x <= cx + 2; x++) {
  for (let z = cz - 2; z <= cz + 1; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    set(x, roofY + 1, z, "light_gray_concrete");
    set(x, roofY + 2, z, "light_gray_concrete");
    set(x, roofY + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(cx - 2, cz - 1) && !isEdge(cx - 2, cz - 1)) {
  for (let y = roofY + 4; y <= roofY + 6 && y < H; y++) {
    set(cx - 2, y, cz - 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

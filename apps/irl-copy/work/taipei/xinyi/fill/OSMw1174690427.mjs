import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690427";
const W = 26, H = 23, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Record: roof ~11 blocks above lowest ground. Era: 1970s-80s Xinyi-fringe commercial block,
// two storeys of ~5 blocks, pale tiled-concrete walls, shopfront ground floor, parapet roof.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const L = Math.min(...cells.map(c => c[2]));
const FL2 = L + 5;   // second-floor slab
const ROOF = L + 10; // roof slab / cornice course
const TOP = L + 11;  // parapet top

const placed = new Set();
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  placed.add(`${x},${y},${z}`);
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const isPlaced = (x, y, z) => placed.has(`${x},${y},${z}`);

const dirs = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const list = cells.map(([x, z, gr]) => {
  const faces = [];
  for (const name of ["north", "south", "west", "east"]) {
    const [dx, dz] = dirs[name];
    if (!has(x + dx, z + dz)) faces.push(name);
  }
  return { x, z, gr, faces, edge: faces.length > 0, face: faces[0] };
});

// Door: pick the south-facing edge cell nearest the middle of that frontage.
let doorCell = null;
{
  let cand = list.filter(c => c.face === "south");
  if (cand.length === 0) cand = list.filter(c => c.edge);
  cand.sort((a, b) => (a.face === "south" || a.face === "north" ? a.x - b.x : a.z - b.z));
  if (cand.length) doorCell = cand[Math.floor(cand.length / 2)];
}

// Pass 1: foundations, floor slabs, roof slab, interior columns, roof plant.
for (const c of list) {
  const { x, z, gr, edge } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");          // foundation fill
  put(x, gr, z, edge ? "stone_bricks" : "smooth_quartz");             // base course / ground slab
  if (FL2 > gr) put(x, FL2, z, "light_gray_concrete");                // second-floor slab
  if (ROOF > gr) put(x, ROOF, z, "light_gray_concrete");              // roof slab
  if (!edge && x % 6 === 3 && z % 6 === 3) {                          // interior columns
    for (let y = gr + 1; y <= ROOF - 1; y++) put(x, y, z, "smooth_quartz");
  }
  if (!edge && x % 6 === 1 && z % 6 === 4 && ROOF > gr) {              // roof AC plant
    put(x, ROOF + 1, z, "iron_block");
  }
}

// Pass 2: exterior walls, windows, shopfronts, cornice and parapet.
for (const c of list) {
  if (!c.edge) continue;
  const { x, z, gr, face } = c;
  const alongX = face === "north" || face === "south";
  const t = alongX ? x : z;
  const bay = t % 3 === 1;
  const [dx, dz] = dirs[face];
  const ix = x - dx, iz = z - dz; // inward neighbour

  for (let y = gr + 1; y <= TOP; y++) {
    if (y === TOP) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === FL2) continue;

    if (y < FL2) {
      // Ground storey: shopfront
      if (y === FL2 - 1) { put(x, y, z, "dark_oak_planks"); continue; } // fascia
      if (t % 4 === 0) put(x, y, z, "smooth_quartz");                    // pillar
      else put(x, y, z, "glass");
      if (y === gr + 2 && (x + z) % 4 === 1 && has(ix, iz) && gAt(ix, iz) < y && !isPlaced(ix, y, iz)) {
        put(ix, y, iz, "glowstone");
      }
    } else {
      // Upper storey: window band
      if (y === ROOF - 1) { put(x, y, z, "light_gray_concrete"); continue; } // spandrel
      if (bay) {
        const p = alongX
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "glass_pane", p);
        if (((x + 2 * z + y) % 5 === 0) && has(ix, iz) && gAt(ix, iz) < y && !isPlaced(ix, y, iz)) {
          put(ix, y, iz, "glowstone");
        }
      } else {
        put(x, y, z, "smooth_quartz");
      }
    }
  }
}

// Pass 3: entrance door with a dark-oak surround.
if (doorCell) {
  const { x, z, gr, face } = doorCell;
  const lower = { facing: face, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" };
  const upper = { facing: face, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" };
  put(x, gr + 1, z, "dark_oak_door", lower);
  put(x, gr + 2, z, "dark_oak_door", upper);
}

g.save(`${DIR}/${ID}.nbt`);

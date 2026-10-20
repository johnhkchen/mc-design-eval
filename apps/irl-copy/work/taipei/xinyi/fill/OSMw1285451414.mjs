import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1285451414";
const W = 42, H = 23, D = 37;

// Storey plan (absolute y, y 0 = lowest ground):
//  ground shopfront  gr..4   (base granite, glass bays, quartz piers, fascia at 4)
//  belt course       5
//  upper storey      6..9    (sill 6, glass 7..8, head 9, quartz piers throughout)
//  cornice           10
//  parapet           11
// Roof deck (light grey concrete) at y 10 over the interior; plant room at 11..12.

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellsXZ = raw.map(c => [c[0], c[1]]);
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of raw) {
  G.set(key(x, z), Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => G.has(key(x, z));

const FACES = [
  { name: "north", dx: 0, dz: -1, facing: "north" },
  { name: "south", dx: 0, dz: 1, facing: "south" },
  { name: "west", dx: -1, dz: 0, facing: "west" },
  { name: "east", dx: 1, dz: 0, facing: "east" },
];
const outFaces = (x, z) => FACES.filter(f => !has(x + f.dx, z + f.dz));

const minx = Math.min(...cellsXZ.map(c => c[0]));
const maxx = Math.max(...cellsXZ.map(c => c[0]));
const minz = Math.min(...cellsXZ.map(c => c[1]));
const maxz = Math.max(...cellsXZ.map(c => c[1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pick the front (street-facing) elevation: prefer south, then north, west, east.
let front = null;
let frontName = null;
for (const name of ["south", "north", "west", "east"]) {
  const cands = [];
  for (const [x, z] of cellsXZ) {
    const f = outFaces(x, z).find(f => f.name === name);
    if (f) cands.push({ x, z, f });
  }
  if (cands.length) {
    cands.sort((a, b) => (a.f.dx !== 0 ? a.z - b.z : a.x - b.x));
    front = cands[Math.floor(cands.length / 2)];
    frontName = name;
    break;
  }
}

// Facade material for a perimeter cell at height y on a given face.
function facadeBlock(x, z, y, gr, face) {
  const along = face.dx !== 0 ? z : x;
  const pier = along % 3 === 0;
  const runsEW = face.dz !== 0; // north/south faces run east-west
  const pane = runsEW
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  if (y === 11) return ["smooth_quartz"];          // parapet
  if (y === 10) return ["quartz_block"];           // cornice
  if (y === 5) return ["chiseled_quartz_block"];   // belt course
  if (y <= 4) {
    if (y === gr) return ["polished_granite"];     // plinth
    if (y === 4) return ["smooth_quartz"];         // shopfront fascia
    if (pier) return ["smooth_quartz"];
    return ["light_blue_stained_glass_pane", pane];
  }
  // upper storey 6..9
  if (pier) return ["smooth_quartz"];
  if (y === 6 || y === 9) return ["light_gray_concrete"]; // sill / head frames
  return ["light_blue_stained_glass_pane", pane];
}

// ---- Foundations, floors, roof deck and facades ----
for (const [x, z] of cellsXZ) {
  const gr = G.get(key(x, z));

  // Foundation: solid from y 0 up to the ground under this cell.
  for (let y = 0; y < Math.max(gr, 1); y++) put(x, y, z, "stone_bricks");

  // Interior floor slab at the belt level where the ground floor ends.
  if (gr <= 5) put(x, 5, z, "chiseled_quartz_block");

  // Roof deck (ceiling of the top storey) across the whole plan.
  put(x, 10, z, "light_gray_concrete");

  // Perimeter walls, shopfront, windows, cornice and parapet.
  const of = outFaces(x, z);
  if (of.length) {
    const face = of.find(f => f.name === frontName) ?? of[0];
    for (let y = gr; y <= 11; y++) {
      const [id, props] = facadeBlock(x, z, y, gr, face);
      put(x, y, z, id, props);
    }
  }
}

// ---- Warm lights behind glass ----
for (const [x, z] of cellsXZ) {
  const gr = G.get(key(x, z));
  const of = outFaces(x, z);
  if (!of.length) continue;
  const face = of.find(f => f.name === frontName) ?? of[0];
  const along = face.dx !== 0 ? z : x;
  const ix = x - face.dx, iz = z - face.dz;
  if (!has(ix, iz) || outFaces(ix, iz).length) continue;

  // Shopfront glowstone just inside the glass.
  if (gr + 1 <= 3 && along % 6 === 1) {
    put(ix, gr + 1, iz, "glowstone");
  }
  // Upper storey shroomlight behind a window.
  if (gr <= 7 && along % 6 === 4) {
    put(ix, 7, iz, "shroomlight");
  }
}

// ---- Main entrance on the front elevation ----
if (front) {
  const { x, z, f } = front;
  const gr = G.get(key(x, z));
  const doorFacing = f.facing;
  put(x, gr, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  put(x, gr + 3, z, "smooth_quartz");
}

// ---- Rooftop plant room and mast ----
const px0 = minx + 7, px1 = maxx - 7, pz0 = minz + 7, pz1 = maxz - 7;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    const ring = x === px0 || x === px1 || z === pz0 || z === pz1;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    if (ring) put(x, 13, z, "smooth_quartz");
  }
}
const cx = Math.round((minx + maxx) / 2);
const cz = Math.round((minz + maxz) / 2);
if (has(cx, cz)) {
  for (let y = 13; y <= 18; y++) put(cx, y, cz, "iron_bars");
  put(cx, 19, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

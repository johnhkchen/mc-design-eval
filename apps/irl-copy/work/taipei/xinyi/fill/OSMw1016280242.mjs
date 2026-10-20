import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280242";
const W = 22, H = 33, D = 14;
const ROOF = 21;      // roof deck, about 21 blocks above lowest ground
const PARAPET = 22;   // parapet course on the perimeter
const STOREYS = [5, 10, 15, 20];   // storey lines (about 5 blocks per storey, 4 storeys)

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of raw) ground.set(`${x},${z}`, Math.max(0, Math.min(18, g)));

const has = (x, z) => ground.has(`${x},${z}`);
const OFF = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const INW = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };
const facesOf = (x, z) =>
  Object.keys(OFF).filter((f) => {
    const [dx, dz] = OFF[f];
    return !has(x + dx, z + dz);
  });

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, walls, windows, roof
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = facesOf(x, z);
  const edge = faces.length > 0;
  const corner = faces.length >= 2;

  // foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  // ground floor slab; perimeter gets a dark base course
  set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  if (!edge) {
    // interior: floor slabs per storey, roof deck, air gap behind glass
    for (const s of STOREYS) if (s > gr) set(x, s, z, "smooth_stone");
    set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  set(x, ROOF, z, "smooth_stone");          // cornice
  set(x, PARAPET, z, "white_concrete");     // parapet

  const f = faces[0];
  const i = f === "north" || f === "south" ? x : z;

  for (let y = gr + 1; y <= 20; y++) {
    if (STOREYS.includes(y)) {
      set(x, y, z, "light_gray_concrete");   // storey line
      continue;
    }
    if (corner) {
      set(x, y, z, "smooth_quartz");         // solid corner piers
      continue;
    }
    const sb = 5 * Math.floor(y / 5);
    const rel = y - sb;
    if (rel === 4) {
      set(x, y, z, "white_concrete");        // spandrel
    } else if (i % 3 === 0) {
      set(x, y, z, "smooth_quartz");         // mullion
    } else {
      set(x, y, z, "gray_stained_glass_pane", paneProps(f));
      // warm light behind some windows, in the air gap of the interior cell
      if (rel === 2 && (sb === 5 || sb === 10) && i % 6 === 1) {
        const [ix, iz] = [x + INW[f][0], z + INW[f][1]];
        if (has(ix, iz) && facesOf(ix, iz).length === 0) {
          set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Entrance: centre of the north face (south if no north face exists)
const edgeCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .map(([x, z]) => ({ x, z, faces: facesOf(x, z), g: ground.get(`${x},${z}`) }))
  .filter((c) => c.faces.length === 1);
let face = "north";
let cands = edgeCells.filter((c) => c.faces[0] === "north");
if (cands.length === 0) {
  face = "south";
  cands = edgeCells.filter((c) => c.faces[0] === "south");
}
if (cands.length > 0) {
  cands.sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2));
  const d = cands[0];
  const gd = d.g;
  const axisX = face === "north" || face === "south";
  // door, lower and upper halves
  set(d.x, gd + 1, d.z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(d.x, gd + 2, d.z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  // lintel canopy over the door, with lanterns flanking it
  for (const k of [-1, 0, 1]) {
    const cx = axisX ? d.x + k : d.x;
    const cz = axisX ? d.z : d.z + k;
    if (!has(cx, cz)) continue;
    set(cx, gd + 3, cz, "smooth_quartz");
    if (k !== 0) set(cx, gd + 2, cz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop plant: a core block with a lightning rod mast
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (facesOf(x, z).length > 0) continue;
  if (x >= 6 && x <= 15 && z >= 4 && z <= 9) {
    set(x, 22, z, "white_concrete");
    set(x, 23, z, "white_concrete");
    if (x % 3 === 0 && z % 2 === 0) set(x, 24, z, "light_gray_concrete");
  }
}
const mast = [...ground.keys()].map((k) => k.split(",").map(Number)).find(([x, z]) => x === 11 && z === 6 && facesOf(x, z).length === 0);
if (mast) {
  set(11, 25, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

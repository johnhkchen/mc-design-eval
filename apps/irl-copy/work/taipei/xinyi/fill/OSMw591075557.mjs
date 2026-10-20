import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1960s-70s Taipei commercial block: two storeys of white concrete
// with quartz bands, a stone plinth, a shopfront on the ground storey,
// a light-grey roof slab with cornice, parapet and rooftop AC plant.
// Roof sits at y 8 above the lowest ground (lidar record).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075557";
const W = 15, H = 20, D = 17;
const ROOF_Y = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inFp = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

const FACES = [
  { dir: "north", dx: 0, dz: -1, axis: "x", t: (x) => x },
  { dir: "south", dx: 0, dz: 1, axis: "x", t: (x) => x },
  { dir: "west", dx: -1, dz: 0, axis: "z", t: (x, z) => z },
  { dir: "east", dx: 1, dz: 0, axis: "z", t: (x, z) => z },
];
const faceOf = (x, z) => FACES.find((f) => !inFp(x + f.dx, z + f.dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const pane = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// centroid
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = sx / cells.length, cz = sz / cells.length;

// entrance: south-facing edge cell nearest centre x (fallback: any edge cell)
let entrance = null;
{
  const edges = cells.filter(([x, z]) => faceOf(x, z));
  const south = edges.filter(([x, z]) => faceOf(x, z).dir === "south");
  const pool = south.length ? south : edges;
  let best = Infinity;
  for (const [x, z] of pool) {
    const d = Math.abs(x - cx);
    if (d < best) { best = d; entrance = [x, z]; }
  }
}

// per-cell top: roof at ROOF_Y, but never less than 2 storeys above the cell's ground
const topOf = (gr) => Math.max(ROOF_Y, gr + 4);

// 1. foundations, floors, walls
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  const top = topOf(gr);
  const face = faceOf(x, z);

  if (!face) {
    // interior: ground floor slab and upper floor slabs
    put(x, gr, z, "smooth_stone");
    for (let fy = gr + 4; fy < top; fy += 4) put(x, fy, z, "smooth_stone");
    continue;
  }

  const t = face.t(x, z);
  const isDoor = entrance && entrance[0] === x && entrance[1] === z;
  const pier = t % 3 === 0;

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    if (rel === 0) {
      put(x, y, z, "stone_bricks");
    } else if (rel < 4) {
      if (rel === 3) {
        put(x, y, z, "smooth_quartz");
      } else if (isDoor && rel === 1) {
        put(x, y, z, "dark_oak_door", { facing: face.dir, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && rel === 2) {
        put(x, y, z, "dark_oak_door", { facing: face.dir, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (pier) {
        put(x, y, z, "polished_andesite");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", pane(face.axis));
      }
    } else {
      const k = rel % 4;
      if (k === 0 || k === 3) {
        put(x, y, z, "smooth_quartz");
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", pane(face.axis));
      }
    }
  }

  // warm lights set back behind some windows (interior cell just inside the glass)
  if (!isDoor && !pier && t % 6 === 4) {
    const ix = x - face.dx, iz = z - face.dz;
    if (inFp(ix, iz) && !faceOf(ix, iz)) {
      const igr = groundAt(ix, iz);
      put(ix, igr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      if (igr + 5 < topOf(igr)) put(ix, igr + 5, iz, "shroomlight");
    }
  }
}

// 2. roof: cornice and parapet on edges, light roof slab inside
for (const [x, z, gr] of cells) {
  const top = topOf(gr);
  const edge = !!faceOf(x, z);
  if (edge) {
    put(x, top, z, "smooth_quartz");
    put(x, top + 1, z, "white_concrete");
  } else {
    put(x, top, z, "light_gray_concrete");
  }
}

// 3. rooftop plant: two AC units on the interior cells nearest the centroid
const interior = cells
  .filter(([x, z]) => !faceOf(x, z))
  .sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
for (const [x, z] of interior.slice(0, 2)) {
  const top = topOf(groundAt(x, z));
  put(x, top + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);

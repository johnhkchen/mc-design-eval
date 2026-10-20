import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610203";

// Footprint 24 x 13. Roof about 11 blocks above the lowest ground.
// Read as a two-storey, c.1990s Xinyi commercial block: pale tiled quartz
// facade, red terracotta storey bands, glazed shopfront at street level,
// parapet and rooftop plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 24, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.max(Math.round(gr), 0), 12));
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward normals of the faces that border nothing (street or open air).
const faceNormals = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push([0, -1]);
  if (!has(x, z + 1)) f.push([0, 1]);
  if (!has(x - 1, z)) f.push([-1, 0]);
  if (!has(x + 1, z)) f.push([1, 0]);
  return f;
};

for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const gr = groundAt(x, z);
  // Roof level: about 11 above the lowest ground, never lower than 10 above this cell.
  const top = Math.min(Math.max(11, gr + 10), 21);

  // Foundation from y 0 up to this cell's ground, so nothing floats on a slope.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = faceNormals(x, z);
  const edge = faces.length > 0;

  if (!edge) {
    // Interior: floor slabs per storey and roof deck, air between.
    put(x, gr, z, "smooth_quartz");
    if (gr + 5 < top) put(x, gr + 5, z, "smooth_quartz");
    put(x, top, z, "smooth_quartz");
    // Rooftop plant boxes on a regular grid.
    if (x % 6 === 3 && z % 5 === 2) put(x, top + 1, z, "light_gray_concrete");
    continue;
  }

  const [dx, dz] = faces[0];
  const along = dx !== 0 ? z : x;          // index along the street face
  const corner = faces.length > 1;
  const pier = corner || along % 4 === 0;
  const entrance = faces.some(([fx, fz]) => fx === 0 && fz === 1) && x === Math.floor(W / 2);

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;
    if (y === top) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (rel === 0) { put(x, y, z, "polished_andesite"); continue; }   // base course
    if (rel === 4 || rel === 9) { put(x, y, z, "red_terracotta"); continue; } // storey bands
    if (rel >= 10) { put(x, y, z, "smooth_quartz"); continue; }       // parapet
    if (rel === 5) { put(x, y, z, "smooth_quartz"); continue; }       // floor line
    const storey1 = rel >= 1 && rel <= 3;
    const storey2 = rel >= 6 && rel <= 8;
    if (storey1 || storey2) {
      if (pier) { put(x, y, z, "quartz_pillar"); continue; }
      if (entrance && storey1 && rel <= 2) continue;                  // door opening, left as air
      if (entrance && rel === 3) { put(x, y, z, "lantern", { hanging: "true" }); continue; }
      put(x, y, z, "glass_pane");
      continue;
    }
    put(x, y, z, "smooth_quartz");
  }

  // Warm light behind selected windows, in the interior cell just inside the face.
  if (!pier && along % 8 === 6) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !faceNormals(ix, iz).length) {
      const igr = groundAt(ix, iz);
      put(ix, igr + 2, iz, "glowstone");
      if (igr + 7 < 21) put(ix, igr + 7, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

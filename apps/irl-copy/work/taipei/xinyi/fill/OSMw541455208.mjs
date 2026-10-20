import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 26, H = 23, D = 17;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455208.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455208.nbt";

// Boîte à bijoux: a two-storey cream quartz shopfront-and-office block with
// copper bands and light-blue glazing, a granite base, a chiseled parapet and
// a small copper crown with a glowing sea lantern on the roof.

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inF = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...ground.values());
const TOP = minG + 10;           // parapet top, roof reads ~11 blocks above lowest ground
const CX = 12, CZ = 8;           // crown centre
const DOOR_X = 12;               // entrance on the south (+z) face

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const outwardFaces = (x, z) =>
  [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(([dx, dz]) => !inF(x + dx, z + dz));
const isInterior = (x, z) => inF(x, z) && outwardFaces(x, z).length === 0;

// Pass 1: foundations, interior floors and roof slabs, parapet walls, shell.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");

  const faces = outwardFaces(x, z);

  if (faces.length === 0) {
    // Interior cell: ground-floor slab, upper floor slab and roof slab; air between.
    put(x, gr, z, "smooth_stone");
    if (minG + 5 > gr) put(x, minG + 5, z, "smooth_stone");
    if (TOP > gr) put(x, TOP, z, "smooth_quartz");
    continue;
  }

  // Exterior cell: walls from its ground up to the parapet.
  const [dx, dz] = faces[0];
  const t = dz !== 0 ? x : z; // position along the face
  for (let y = gr; y <= TOP; y++) {
    const rel = y - minG;
    let id = null, props = undefined;

    if (y === gr) {
      id = "polished_granite";                          // base course
    } else if (rel >= 1 && rel <= 2 && dz === 1 && dx === 0 && x === DOOR_X) {
      id = "dark_oak_door";                             // entrance
      props = {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (rel >= 1 && rel <= 2) {
      id = t % 3 === 0 ? "copper_block" : "glass";      // shopfront glazing + mullions
      if (id === "glass" && t % 6 === 1 && isInterior(x - dx, z - dz)) {
        const ix = x - dx, iz = z - dz;
        if (gAt(ix, iz) === y - 1) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    } else if (rel === 3) {
      id = "smooth_quartz";                             // shopfront transom
    } else if (rel === 4) {
      id = "smooth_quartz";                             // lintel band
    } else if (rel === 5) {
      id = "copper_block";                              // bronze storey line
    } else if (rel >= 6 && rel <= 9) {
      if (t % 3 === 0) {
        id = "quartz_pillar";                           // window mullions
        props = { axis: "y" };
      } else if (rel === 6 || rel === 9) {
        id = "smooth_quartz";                           // sill and head
      } else {
        id = "light_blue_stained_glass";                // upper glazing
        if (rel === 7 && t % 6 === 4 && isInterior(x - dx, z - dz)) {
          const ix = x - dx, iz = z - dz;
          if (gAt(ix, iz) < y) put(ix, y, iz, "glowstone");
        }
      }
    } else if (rel === 10) {
      id = "chiseled_quartz_block";                     // parapet cornice
    }

    if (id) put(x, y, z, id, props);
  }
}

// Pass 2: roof crown of copper with a sea lantern at its heart.
for (let x = CX - 2; x <= CX + 2; x++) {
  for (let z = CZ - 1; z <= CZ + 1; z++) {
    if (!isInterior(x, z)) continue;
    put(x, TOP + 1, z, "copper_block");
  }
}
if (isInterior(CX, CZ)) put(CX, TOP + 1, CZ, "sea_lantern");

g.save(OUT);

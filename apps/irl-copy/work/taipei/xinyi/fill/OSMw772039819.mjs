import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw772039819: 15 x 16 footprint, roof about 11 blocks above the lowest ground.
// Read as a two-storey, 1990s Xinyi commercial block: stone-brick plinth, white tiled
// piers, blue-tinted glazing, a light grey storey band, a quartz cornice and a parapet,
// a shopfront with an entrance canopy on the south face, and a small rooftop plant room.
// Levels are measured from each cell's own ground so the downhill side shows extra storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039819";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Outward faces: a footprint cell with no neighbour on that side is on the exterior.
const FACES = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
];
const outFaces = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));
const isEdge = (x, z) => outFaces(x, z).length > 0;

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Centre of the footprint, used for the rooftop plant room.
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length);
const cz = Math.round(sz / cells.length);

// Entrance: middle of the south-facing exterior cells (falls back to north).
let entranceFace = "south";
let entranceCands = cells.filter(([x, z]) => outFaces(x, z).some((f) => f.name === "south"));
if (entranceCands.length === 0) {
  entranceFace = "north";
  entranceCands = cells.filter(([x, z]) => outFaces(x, z).some((f) => f.name === "north"));
}
entranceCands.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const [ex, ez] = entranceCands.length ? entranceCands[Math.floor(entranceCands.length / 2)] : [-1, -1];
const entranceKey = `${ex},${ez}`;
const entranceFacing = entranceFace;

for (const [x0, z0] of cells) {
  const x = x0, z = z0;
  const gr = gnd(x, z);
  const faces = outFaces(x, z);
  const edge = faces.length > 0;
  const corner = faces.length > 1;
  const primary = faces[0];
  const u = primary ? (primary.along === "x" ? x : z) : 0;
  const pier = corner || (u % 3 === 0);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / ground floor slab.
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  // Storey line at gr+5 (interior floor slab, exterior band).
  put(x, gr + 5, z, "light_gray_concrete");

  // Roof deck and cornice at gr+10.
  put(x, gr + 10, z, edge ? "smooth_quartz" : "light_gray_concrete");

  // Parapet at gr+11 on the exterior.
  if (edge) put(x, gr + 11, z, "white_concrete");

  if (!edge) {
    // Rooftop plant room: 3 x 3 at the centre, with a sparse scatter of units elsewhere.
    const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
    if (dx <= 1 && dz <= 1) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "smooth_stone");
      if (dx === 0 && dz === 0) put(x, gr + 13, z, "lightning_rod");
    } else if ((x + z) % 4 === 0) {
      put(x, gr + 11, z, "iron_block");
    }
    continue;
  }

  // Exterior wall cell: shopfront, upper storey, spandrels.
  const isEntrance = `${x},${z}` === entranceKey;

  // Ground floor shopfront (gr+1 .. gr+3) with a fascia at gr+4.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (pier) put(x, y, z, "polished_granite");
    else put(x, y, z, "light_blue_stained_glass");
  }
  put(x, gr + 4, z, pier ? "polished_granite" : "black_concrete");

  // Upper storey windows (gr+6 .. gr+8) with a spandrel at gr+9.
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (pier) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }
  put(x, gr + 9, z, "light_gray_concrete");

  // Cornice course at gr+10 is already placed; keep the piers continuous through it.
  if (pier) put(x, gr + 10, z, "smooth_quartz");

  // Warm lights behind some glazing, in the interior air gap.
  if (primary && !pier) {
    const ix = x - primary.dx, iz = z - primary.dz;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      if ((x * 5 + z * 3 + gr) % 4 === 0) put(ix, gr + 7, iz, "glowstone");
      if ((x + z) % 3 === 0) put(ix, gr + 2, iz, "shroomlight");
    }
  }

  // Entrance: double-height glass lintel band, door, and a dark canopy soffit.
  if (isEntrance) {
    put(x, gr + 1, z, "oak_door", { facing: entranceFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: entranceFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "black_concrete");
    put(x, gr + 4, z, "black_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

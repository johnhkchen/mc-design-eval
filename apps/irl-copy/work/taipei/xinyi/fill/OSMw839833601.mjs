import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 19 x 20 footprint, roof ~11 blocks above lowest ground.
// Read as a 1990s-2000s Xinyi mid-rise commercial block: two storeys of
// concrete frame, a shopfront ground floor with a granite base, a blue glass
// upper storey with quartz pillars, a cornice and parapet, and a rooftop
// plant box. Storeys are 5 blocks tall, so the roof sits at 10 and the
// parapet tops out at 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833601";
const W = 19, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Outward faces for a footprint cell: a face is outward when its neighbour is not in the footprint.
function outwardFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ name: "N", dx: 0, dz: -1, along: "x" });
  if (!has(x, z + 1)) f.push({ name: "S", dx: 0, dz: 1, along: "x" });
  if (!has(x - 1, z)) f.push({ name: "W", dx: -1, dz: 0, along: "z" });
  if (!has(x + 1, z)) f.push({ name: "E", dx: 1, dz: 0, along: "z" });
  return f;
}

// Pass 1: foundations, floor slabs, and the rooftop plant box on interior cells.
for (const [x, z, gr] of cells) {
  const base = ground.get(`${x},${z}`);
  for (let y = 0; y < base; y++) put(x, y, z, "stone");
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = ground.get(`${x},${z}`);
  const faces = outwardFaces(x, z);
  if (faces.length > 0) continue; // perimeter handled in pass 2

  // Interior: floor slabs at ground, second floor and roof level.
  for (const rel of [0, 5, 10]) put(x, gr + rel, z, "smooth_stone");

  // Rooftop plant box in the centre of the roof, with a grille lid.
  if (x >= 6 && x <= 12 && z >= 7 && z <= 12) {
    for (const rel of [11, 12]) put(x, gr + rel, z, "light_gray_concrete");
    put(x, gr + 13, z, "iron_bars");
  }
}

// Pass 2: perimeter facades.
const DOOR_X = Math.floor(W / 2);
const DOOR_Z = D - 1;

for (const [x, z, gr] of cells) {
  const base = ground.get(`${x},${z}`);
  const faces = outwardFaces(x, z);
  if (faces.length === 0) continue;

  const corner = faces.length > 1;

  for (let rel = 0; rel <= 11; rel++) {
    const y = base + rel;
    const s = rel < 5 ? 0 : 1;
    const rm = rel % 5;
    let block = null;
    let props = null;

    if (rel === 10) {
      block = "polished_andesite"; // cornice
    } else if (rel === 11) {
      block = "white_concrete"; // parapet
    } else if (rm === 0) {
      block = s === 0 ? "polished_granite" : "polished_andesite"; // base course / storey line
    } else if (rm === 4) {
      block = "light_gray_concrete"; // spandrel band
    } else {
      // Window band, rows rel 1..3 of each storey.
      const c = faces[0].along === "x" ? x : z;
      const pillar = corner || c % 3 === 0;
      if (s === 0 && rm === 3) {
        block = "white_concrete"; // shopfront canopy band
      } else if (pillar) {
        block = "quartz_pillar";
        props = { axis: "y" };
      } else if (s === 0) {
        block = "glass";
      } else {
        block = "light_blue_stained_glass_pane";
      }
    }

    // Entrance: dark oak door in the centre of the south face, ground floor.
    const onDoor = s === 0 && x === DOOR_X && z === DOOR_Z && faces.some(f => f.name === "S");
    if (onDoor && (rm === 1 || rm === 2)) {
      block = "dark_oak_door";
      props = {
        facing: "south",
        half: rm === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    }

    put(x, y, z, block, props);
  }

  // Warm light behind some upper and shopfront windows: glowstone one cell inside.
  for (const face of faces) {
    const ix = x - face.dx;
    const iz = z - face.dz;
    if (!has(ix, iz)) continue;
    if (outwardFaces(ix, iz).length > 0) continue;
    const c = face.along === "x" ? x : z;
    if (c % 3 === 0) continue;
    if (((x * 7 + z * 5 + c) % 5) !== 0) continue;
    put(ix, base + 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

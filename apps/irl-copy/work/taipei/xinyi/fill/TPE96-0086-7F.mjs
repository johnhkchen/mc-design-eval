import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE96-0086-7F: 2007 Xinyi mid-rise office/retail block, 7 storeys of 5 blocks,
// pale cladding with blue-green glass, polished granite base, dark roof cap.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE96-0086-7F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 44, H = 47, D = 15;
const ROOF = 35;        // roof surface at y=35
const STOREY = 5;       // blocks per storey
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// One facade per edge cell: south (z+) first, then north, east, west.
function faceOf(x, z) {
  if (!has(x, z + 1)) return { dx: 0, dz: 1 };
  if (!has(x, z - 1)) return { dx: 0, dz: -1 };
  if (!has(x + 1, z)) return { dx: 1, dz: 0 };
  return { dx: -1, dz: 0 };
}

// Entrance: middle of the south-facing edge actually present in the footprint.
const southXs = [];
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z) && faceOf(x, z).dz === 1) southXs.push(x);
}
southXs.sort((a, b) => a - b);
const midX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : Math.floor(W / 2);
const doorXs = new Set([midX - 1, midX]);
const glassEnt = new Set([midX - 2, midX + 1]);
const canopyXs = new Set([midX - 3, midX - 2, midX - 1, midX, midX + 1, midX + 2]);
const frontZ = Math.max(...southXs.length ? [...ground.keys()]
  .map((k) => Number(k.split(",")[1])) : [D - 1]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Storey rows counted down from the top: rel 0 = top header, 4 = band bottom (slab).
const rowOf = (y) => (ROOF - 1 - y) % STOREY;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: air, with floor slabs at each storey line and the top slab under the roof.
    for (let y = gr; y <= ROOF - 1; y++) {
      const p = rowOf(y);
      if (y === gr || p === 0 || p === 4) put(x, y, z, "light_gray_concrete");
    }
  } else {
    const face = faceOf(x, z);
    const along = face.dz !== 0 ? x : z;
    const inX = x - face.dx, inZ = z - face.dz;
    const inward = has(inX, inZ) && !isEdge(inX, inZ);
    const onFront = face.dz === 1 && z === frontZ;
    const doorFace = onFront && doorXs.has(x);
    const entFace = onFront && (glassEnt.has(x) || doorXs.has(x));
    const canopyCell = onFront && canopyXs.has(x);

    for (let y = gr; y <= ROOF - 1; y++) {
      const p = rowOf(y);

      // Entrance: two doors in the middle, glass either side, canopy above.
      if (entFace && y <= gr + 2) {
        if (doorFace && y === gr) {
          put(x, y, z, "dark_oak_door", {
            facing: "south", half: "lower", hinge: x === midX - 1 ? "left" : "right",
            open: "false", powered: "false",
          });
        } else if (doorFace && y === gr + 1) {
          put(x, y, z, "dark_oak_door", {
            facing: "south", half: "upper", hinge: x === midX - 1 ? "left" : "right",
            open: "false", powered: "false",
          });
        } else {
          put(x, y, z, "cyan_stained_glass");
        }
        continue;
      }
      if (canopyCell && y === gr + 3) {
        put(x, y, z, "smooth_stone");
        continue;
      }

      if (y === gr) { put(x, y, z, "polished_andesite"); continue; }          // base course
      if (p === 4) { put(x, y, z, "light_gray_concrete"); continue; }         // spandrel / slab line
      if (p === 0) { put(x, y, z, "white_concrete"); continue; }              // header course

      // Window rows: glass bays, with deeper light-grey pilasters every 6 blocks
      // and white mullions every 3 blocks for a stepped, articulated facade.
      if (along % 6 === 0) put(x, y, z, "light_gray_concrete");
      else if (along % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "cyan_stained_glass");

      // Warm lanterns hanging inside the room behind some windows.
      if (p === 1 && y > gr && along % 6 === 2 && inward) {
        put(inX, y, inZ, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }

    // Parapet on the edge cells above the roof surface.
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
  }

  // Roof surface on every footprint cell.
  put(x, ROOF, z, "gray_concrete");
}

// Rooftop plant room (interior cells only), with a darker cap.
for (let x = 10; x <= 18; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
    if (x >= 11 && x <= 17 && z >= 5 && z <= 9) put(x, ROOF + 4, z, "gray_concrete");
  }
}

vox.save(`${DIR}/${ID}.nbt`);

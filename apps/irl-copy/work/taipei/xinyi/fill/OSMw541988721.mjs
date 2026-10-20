import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style office/retail block, c. 1990s-2000s: a two-storey
// podium-scale block with a pale concrete frame, blue-tinted glazing,
// a stone base, a ground-floor shopfront with a central entrance,
// and a parapet with roof plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988721";
const W = 19, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const R = B + 11;                                // flat roof level, from lidar record

const put = (x, y, z, name, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const exteriorFaces = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);
const alongOf = (x, z, face) => (face === "north" || face === "south" ? x : z);

// Pick the main street-facing side: the exterior face shared by the most cells.
const faceCount = {};
for (const [x, z] of cells) for (const f of exteriorFaces(x, z)) faceCount[f] = (faceCount[f] || 0) + 1;
const entFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const entCands = cells
  .filter(([x, z]) => exteriorFaces(x, z).includes(entFace))
  .sort((a, b) => alongOf(a[0], a[1], entFace) - alongOf(b[0], b[1], entFace));
const ent = entCands.length
  ? { x: entCands[Math.floor(entCands.length / 2)][0], z: entCands[Math.floor(entCands.length / 2)][1], face: entFace }
  : null;

for (const [x, z, gr] of cells) {
  const faces = exteriorFaces(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;
  const primary = faces[0];
  const along = perim ? alongOf(x, z, primary) : 0;
  const isEnt = ent && ent.x === x && ent.z === z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, perim ? "stone_bricks" : "stone");

  // Storey floor levels: ground floor sits on the ground, 5 blocks per storey.
  const floors = [];
  for (let f = gr + 1; f < R; f += 5) floors.push(f);

  floors.forEach((f, k) => {
    // Floor slab / base course for this storey.
    if (perim) put(x, f, z, k === 0 ? "polished_andesite" : "white_concrete");
    else put(x, f, z, "smooth_stone");

    if (!perim) return; // interior: air behind, only slabs

    // Spandrel band just under the next floor.
    if (f + 4 < R) put(x, f + 4, z, "light_gray_concrete");

    for (let rel = 1; rel <= 3; rel++) {
      const y = f + rel;
      if (y >= R) break;

      if (corner) {
        put(x, y, z, "white_concrete");
      } else if (k === 0 && isEnt && rel <= 2) {
        const props = (half) => ({ facing: ent.face, half, hinge: "left", open: "false", powered: "false" });
        put(x, y, z, "oak_door", props(rel === 1 ? "lower" : "upper"));
      } else if (k === 0 && isEnt && rel === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (along % 2 === 0) {
        put(x, y, z, "white_concrete"); // mullion
      } else if (rel === 2 && along % 6 === 1) {
        put(x, y, z, "glowstone");      // warm lit window
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  });

  // Roof slab across the whole footprint.
  put(x, R, z, "light_gray_concrete");

  if (perim) {
    // Parapet ring.
    put(x, R + 1, z, "white_concrete");
  } else if (x >= 6 && x < 12 && z >= 7 && z < 14) {
    // Roof plant block in the middle of the roof.
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

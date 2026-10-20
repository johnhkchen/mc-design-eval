import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339540095";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 19, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground per cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

// Common floor level = highest ground under the footprint; foundation fills up to it
const L = Math.max(...cells.map((c) => c[2]));
// Single storey (~5 blocks) + cornice + parapet => roof about 7 above lowest ground
const FLOOR = L;            // floor slab
const WALL0 = L + 1;        // first wall course
const CORNICE = L + 5;
const ROOF = L + 6;         // roof deck / ceiling slab
const PARAPET = L + 7;      // top course

const FACES = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// Per cell: exterior faces
const info = new Map();
for (const [x, z, gr] of cells) {
  const ext = FACES.filter(([dx, dz]) => !inside(x + dx, z + dz));
  info.set(`${x},${z}`, { x, z, gr, ext, perim: ext.length > 0 });
}

// Foundation, floor slab, roof deck for every footprint cell
for (const [x, z, gr] of cells) {
  for (let y = 0; y < FLOOR; y++) g.set(x, y, z, "stone");
  g.set(x, FLOOR, z, "smooth_stone");
  g.set(x, ROOF, z, "gray_concrete");
}

// Choose the main entrance: the middle single-face cell on the south (street) side
const southSingle = cells
  .filter(([x, z]) => {
    const i = info.get(`${x},${z}`);
    return i.ext.length === 1 && i.ext[0][2] === "south";
  })
  .sort((a, b) => a[0] - b[0]);
let doorCell = null;
if (southSingle.length) doorCell = southSingle[Math.floor(southSingle.length / 2)];
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

// Perimeter walls
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const i = info.get(`${x},${z}`);
  if (!i.perim) continue;
  const corner = i.ext.length >= 2;
  const face = i.ext.length === 1 ? i.ext[0] : null;
  const key = `${x},${z}`;

  // Base course
  g.set(x, WALL0, z, "polished_andesite");

  // Window / pier band
  for (let y = WALL0 + 1; y <= WALL0 + 3; y++) {
    if (corner || !face) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    const [, , dir] = face;
    const idx = dir === "north" || dir === "south" ? x : z;
    if (idx % 3 === 0) {
      g.set(x, y, z, "smooth_quartz"); // pier
    } else if (dir === "north" || dir === "south") {
      g.set(x, y, z, "light_blue_stained_glass_pane", {
        north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
      });
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", {
        north: "true", south: "true", east: "false", west: "false", waterlogged: "false",
      });
    }
  }

  // Cornice band, roof-edge band, parapet
  g.set(x, CORNICE, z, "chiseled_quartz_block");
  g.set(x, ROOF, z, "smooth_quartz");
  g.set(x, PARAPET, z, "smooth_quartz");
}

// Entrance door on the south facade (outward face; player faces north when placing)
if (doorKey) {
  const [dx, dz] = doorCell;
  const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(dx, WALL0, dz, "dark_oak_door", { ...door, half: "lower" });
  g.set(dx, WALL0 + 1, dz, "dark_oak_door", { ...door, half: "upper" });
}

// Warm interior lanterns hanging from the ceiling behind some windows
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const i = info.get(`${x},${z}`);
  if (!i.perim || i.ext.length !== 1) continue;
  const [ox, oz, dir] = i.ext[0];
  const idx = dir === "north" || dir === "south" ? x : z;
  if (idx % 3 === 0 || (x + z) % 4 !== 0) continue;
  const ix = x - ox, iz = z - oz; // inward cell
  if (!inside(ix, iz)) continue;
  const inner = info.get(`${ix},${iz}`);
  if (inner.perim) continue;
  g.set(ix, CORNICE, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant: a small air-handling unit near the centre, sitting on the roof deck
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const i = info.get(`${x},${z}`);
  if (i.perim) continue;
  if (x >= 4 && x <= 7 && z >= 4 && z <= 6) {
    g.set(x, PARAPET, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

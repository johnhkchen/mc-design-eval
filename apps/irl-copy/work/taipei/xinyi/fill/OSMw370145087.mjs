import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Taipei, Xinyi district. OSM way 370145087: 18 x 21 footprint, roof ~11 blocks above lowest ground.
// Reading: a two-storey, tiled-and-glazed commercial block of the 1980s-90s Taipei type:
// white-tiled walls with pier columns, cyan-glazed shopfronts under a red fascia band, a stone plinth,
// a smooth cornice course, storey lines, a roof slab and a half-block stone parapet cap,
// plus rooftop AC units. The parapet top sits at G+11 so the roof reads at about 11 blocks.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370145087";
const W = 18, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), gr);
const inFoot = (x, z) => foot.has(key(x, z));

// Global storey datum: the highest ground under the footprint, so every floor is level.
const G = Math.max(...cells.map((c) => c[2]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const FACES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

// 1. Foundation: solid from y 0 up to each cell's own ground, then a stone plinth up to the datum G.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < G; y++) {
    put(x, y, z, y < gr ? "stone" : "stone_bricks");
  }
}

// 2. Floor slabs at the datum, each storey line, and the roof. Full footprint, so nothing floats.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  put(x, G, z, "smooth_stone");
  put(x, G + 5, z, "light_gray_concrete");
  put(x, G + 10, z, "light_gray_concrete");
}

// 3. Perimeter cells with their outward face.
const perim = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const face of ["north", "south", "east", "west"]) {
    const [dx, dz] = FACES[face];
    if (!inFoot(x + dx, z + dz)) {
      perim.set(key(x, z), {
        x, z, face,
        t: face === "north" || face === "south" ? x : z,
        nx: dx, nz: dz,
      });
      break;
    }
  }
}

// 4. Entrance: centre of the north face (or the first face with cells if no north face exists).
let northList = [...perim.values()].filter((p) => p.face === "north").sort((a, b) => a.t - b.t);
if (northList.length === 0) northList = [...perim.values()].sort((a, b) => a.t - b.t);
const doorCell = northList.length ? northList[Math.floor(northList.length / 2)] : null;
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;
const doorT = doorCell ? doorCell.t : null;
const doorFace = doorCell ? doorCell.face : null;

// 5. Facades: plinth, shopfronts with red fascia, storey lines, upper glazing, cornice, parapet.
for (const [k, p] of perim) {
  const { x, z, t, face } = p;
  const pier = t % 3 === 0;

  // Flank piers either side of the entrance get stone so the door reads at a glance.
  const flankDoor = doorCell && face === doorFace && Math.abs(t - doorT) === 1;
  const groundPier = pier || flankDoor;

  // Ground storey: glazed shopfront with stone piers and a red fascia band.
  for (const y of [G + 1, G + 2]) {
    put(x, y, z, groundPier ? "stone_bricks" : "cyan_stained_glass");
  }
  put(x, G + 3, z, "red_concrete");
  put(x, G + 4, z, "white_concrete");

  // Upper storey: white spandrels top and bottom, glazed band between piers.
  put(x, G + 6, z, "white_concrete");
  put(x, G + 9, z, "white_concrete");
  for (const y of [G + 7, G + 8]) {
    put(x, y, z, pier ? "white_concrete" : "cyan_stained_glass");
  }

  // Cornice course on the roof edge, then a half-block stone parapet cap at G+11.
  put(x, G + 10, z, "smooth_stone");
  put(x, G + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Entrance door in the middle of the north face.
  if (k === doorKey) {
    const doorProps = (half) => ({
      facing: OPP[face],
      half,
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, G + 1, z, "iron_door", doorProps("lower"));
    put(x, G + 2, z, "iron_door", doorProps("upper"));
  }
}

// 6. Warm light behind some glazing: glowstone and lanterns in the air gap inside the glass.
for (const [k, p] of perim) {
  const ix = p.x - p.nx;
  const iz = p.z - p.nz;
  if (!inFoot(ix, iz) || perim.has(key(ix, iz))) continue;
  if (p.t % 6 === 1) {
    put(ix, G + 7, iz, "glowstone");
  } else if (p.t % 6 === 4) {
    put(ix, G + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 7. Roof equipment: AC condenser units on a regular grid of interior roof cells.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (perim.has(key(x, z))) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    put(x, G + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);

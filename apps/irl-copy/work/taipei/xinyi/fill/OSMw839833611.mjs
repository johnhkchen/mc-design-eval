import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source name. Lidar roof ~11 blocks above lowest ground.
// Read as a two-storey commercial block (~5-block storeys), cast concrete
// with granite plinth, glazed shopfront on the ground floor, a pale
// concrete grid above, a quartz cornice, and a small roof plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833611";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  // Keep the whole stack (roof plant reaches gr+12) inside the 23-high volume.
  ground.set(key(x, z), Math.min(10, Math.max(0, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

const outward = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Position along a wall: x for north/south faces, z for east/west faces.
const alongPos = (x, z, d) => (d === "north" || d === "south" ? x : z);

// Pick the entrance facade: the outward direction with most wall cells.
const facadeCount = {};
const perimeter = new Map(); // key -> outward dir (first one)
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);
  if (out.length) {
    perimeter.set(k, out);
    if (out.length === 1) facadeCount[out[0]] = (facadeCount[out[0]] || 0) + 1;
  }
}
let doorFacing = null;
for (const d of Object.keys(facadeCount)) {
  if (!doorFacing || facadeCount[d] > facadeCount[doorFacing]) doorFacing = d;
}
let doorKey = null;
if (doorFacing) {
  const runs = [...perimeter.entries()]
    .filter(([, out]) => out.length === 1 && out[0] === doorFacing)
    .map(([k]) => {
      const [x, z] = k.split(",").map(Number);
      return { k, x, z, p: alongPos(x, z, doorFacing) };
    })
    .sort((a, b) => a.p - b.p);
  if (runs.length) doorKey = runs[Math.floor(runs.length / 2)].k;
}

const S = (x, y, z, b, p) => g.set(x, y, z, b, p);

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");
  // Granite plinth / base course.
  S(x, gr, z, "polished_granite");
  // Floor slab between storeys, roof deck under the parapet level.
  S(x, gr + 5, z, "white_concrete");
  S(x, gr + 10, z, "light_gray_concrete");

  const out = perimeter.get(k);
  if (!out) {
    // Interior cell: nothing more than slabs; a warm light is added below
    // for windows that have an interior neighbour.
    continue;
  }

  const d = out[0];
  const along = alongPos(x, z, d);
  const isCorner = out.length > 1;
  const endOfRun =
    d === "north" || d === "south"
      ? !has(x - 1, z) || !has(x + 1, z)
      : !has(x, z - 1) || !has(x, z + 1);
  const pillar = isCorner || endOfRun || along % 3 === 0;
  const isDoor = k === doorKey;

  // Ground-floor shopfront: pillars, glazing, door and a dark sign band.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor && y === gr + 1) {
      S(x, y, z, "dark_oak_door", { facing: d, half: "lower", hinge: "left", open: "false", powered: "false" });
    } else if (isDoor && y === gr + 2) {
      S(x, y, z, "dark_oak_door", { facing: d, half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (isDoor && y === gr + 3) {
      S(x, y, z, "glowstone");
    } else if (pillar) {
      S(x, y, z, "white_concrete");
    } else {
      S(x, y, z, "glass");
    }
  }
  S(x, gr + 4, z, "black_concrete"); // sign band / canopy line

  // Upper storey: spandrels top and bottom, windows between pillars.
  S(x, gr + 6, z, "white_concrete");
  S(x, gr + 9, z, "white_concrete");
  for (let y = gr + 7; y <= gr + 8; y++) {
    if (pillar) S(x, y, z, "white_concrete");
    else S(x, y, z, "light_gray_stained_glass");
  }

  // Warm light behind some upper windows (only where the inner cell is an
  // interior cell at the same level, so it sits in a real air gap).
  if (!pillar && along % 6 === 4) {
    const inward = OPP[d];
    const ix = x + DIRS[inward][0];
    const iz = z + DIRS[inward][1];
    const ik = key(ix, iz);
    if (ground.has(ik) && ground.get(ik) === gr && !perimeter.has(ik)) {
      S(ix, gr + 7, iz, "glowstone");
    }
  }

  // Cornice and parapet cap.
  S(x, gr + 10, z, "smooth_quartz");
  S(x, gr + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant room in the centre of the roof, on the deck.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (perimeter.has(k)) continue;
  if (x >= 7 && x <= 13 && z >= 8 && z <= 14) {
    S(x, gr + 11, z, "gray_concrete");
    S(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

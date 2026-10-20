import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245231";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 34 x 16 footprint, roof about 26 blocks above the lowest ground: a five-storey
// late-1990s Xinyi office block with a granite-look base, white cladding,
// blue-green glazing and a rooftop plant room.
const W = 34, H = 38, D = 16;
const ROOF = 26;   // parapet top
const DECK = 25;   // roof deck / cornice line

const g = new Voxels([W, H, D]);
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const has = (x, z) => G.has(x + "," + z);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (inside(x, y, z)) g.set(x, y, z, id, props);
};

const GLASS = "light_blue_stained_glass";
const PIER = "smooth_quartz";
const WALL = "white_concrete";
const SPANDREL = "gray_concrete";
const BASE = "polished_granite";
const FOUND = "stone_bricks";

function doorBlock(x, y, z, hinge, half) {
  put(x, y, z, "dark_oak_door", {
    facing: "north", half, hinge, open: "false", powered: "false",
  });
}

function facade(x, z, y, gr, exp) {
  const [dx, dz] = exp[0];
  // Ground-floor base course
  if (y === gr) return put(x, y, z, BASE);
  // Cornice band at the deck line
  if (y === DECK) return put(x, y, z, PIER);
  // Parapet
  if (y === ROOF) return put(x, y, z, WALL);

  // Entrance: two-leaf door on the -z face, centre of the 34 m frontage
  if (dz === -1 && z === 0 && (x === 16 || x === 17) && (y === 1 || y === 2) && gr <= 1) {
    const hinge = x === 16 ? "left" : "right";
    return doorBlock(x, y, z, hinge, y === 1 ? "lower" : "upper");
  }

  // Storey slab bands
  if (y % 5 === 0) return put(x, y, z, PIER);
  // Spandrel below each window band
  if (y % 5 === 4) return put(x, y, z, SPANDREL);

  // Window zone: piers every 3 blocks along the wall, glass between
  const t = dx !== 0 ? z : x;
  if (t % 3 === 0) {
    put(x, y, z, PIER);
    return;
  }
  put(x, y, z, GLASS);

  // Warm light behind some windows, in the air gap of the room
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && y % 5 === 2 && t % 6 === 1 && y > gr) {
    put(ix, y, iz, "shroomlight");
  }
}

// Foundation, interior floors, and facade
for (const [x, z, gr] of cells) {
  const exp = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const edge = exp.length > 0;

  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  if (gr > DECK) continue;

  for (let y = gr; y <= DECK; y++) {
    if (edge) {
      // exposures listed as [dx,dz] where the missing neighbour lies
      const exps = exp.map(([dx, dz]) => [dx, dz]);
      facade(x, z, y, gr, exps);
    } else if (y === gr || y % 5 === 0 || y === DECK) {
      // interior floor slabs, roof deck
      put(x, y, z, PIER);
    }
  }

  // Parapet on edge cells
  if (edge && gr <= ROOF) put(x, ROOF, z, WALL);
}

// Rooftop plant room, centred, sitting on the roof deck
for (let x = 8; x <= 25; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    const perim = x === 8 || x === 25 || z === 5 || z === 10;
    for (let y = 26; y <= 28; y++) {
      if (perim) {
        if (y === 27 && (x + z) % 4 !== 0) put(x, y, z, GLASS);
        else put(x, y, z, WALL);
      }
    }
    put(x, 29, z, PIER);
  }
}

// Antenna mast with a warning lamp on the plant room
if (has(17, 8)) {
  for (let y = 30; y <= 33; y++) put(17, y, 8, "iron_bars");
  put(17, 34, 8, "redstone_lamp", { lit: "true" });
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 南浦東方名宮: 1990s-2000s Taipei residential slab. Reinforced concrete frame,
// white terracotta tile cladding, quartz belt courses and pilasters, tinted glass
// windows in three-bay rhythm, stone-clad plinth, roof parapet, and a mechanical
// penthouse with louvres and a lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw774689155";
const W = 20, H = 71, D = 46;
const ROOF = 58;   // roof deck level (interior) and parapet start
const CAP = 59;    // parapet cap, roof line
const PH_X0 = 6, PH_X1 = 13, PH_Z0 = 17, PH_Z1 = 28; // penthouse core
const PH_TOP = 63; // penthouse roof slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

const DIRS = [
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
];
const edgeOf = (x, z) => DIRS.some((d) => !inside(x + d.dx, z + d.dz));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const miss = DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
  const edge = miss.length > 0;
  const corner = miss.length >= 2;

  if (!edge) {
    // Interior: floor slabs at each storey line, roof deck, and air otherwise.
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y === ROOF || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const d = miss[0];
  const along = d.dx !== 0 ? z : x;

  for (let y = gr; y <= CAP; y++) {
    if (y === CAP) { put(x, y, z, "smooth_quartz"); continue; }
    if (y >= ROOF) { put(x, y, z, "white_terracotta"); continue; }
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }

    // Entrance on the north face: double door with quartz lintel.
    if (d.f === "north" && z === 0 && (x === 9 || x === 10)) {
      const hinge = x === 9 ? "left" : "right";
      if (y === gr) {
        put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
        continue;
      }
      if (y === gr + 1) {
        put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
        continue;
      }
    }
    if (d.f === "north" && z === 0 && y === gr + 2 && x >= 8 && x <= 11) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }
    if (y % 5 === 0) { put(x, y, z, "smooth_quartz"); continue; }

    const r = y % 5;
    if (r === 4) { put(x, y, z, "white_terracotta"); continue; }      // spandrel
    if (along % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; } // pier

    // Glazed bay: tinted glass, with occasional warm light just behind it.
    put(x, y, z, "light_blue_stained_glass");
    if ((x * 7 + z * 13 + y * 5) % 9 === 0) {
      const ix = x - d.dx, iz = z - d.dz;
      if (inside(ix, iz) && !edgeOf(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// Mechanical penthouse: louvred ring walls on the roof deck, quartz roof slab.
for (let x = PH_X0; x <= PH_X1; x++) {
  for (let z = PH_Z0; z <= PH_Z1; z++) {
    if (!inside(x, z)) continue;
    const ring = x === PH_X0 || x === PH_X1 || z === PH_Z0 || z === PH_Z1;
    if (ring) {
      for (let y = CAP; y <= PH_TOP - 1; y++) {
        if (y === 60 || y === 61) {
          if ((x + z) % 2 === 0) put(x, y, z, "iron_bars");
          else put(x, y, z, "light_gray_concrete");
        } else {
          put(x, y, z, "light_gray_concrete");
        }
      }
    }
    put(x, PH_TOP, z, "smooth_quartz");
  }
}

// Lightning rod on the penthouse roof.
const rodX = 9, rodZ = 22;
for (let y = PH_TOP + 1; y <= PH_TOP + 4; y++) {
  put(rodX, y, rodZ, "lightning_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);

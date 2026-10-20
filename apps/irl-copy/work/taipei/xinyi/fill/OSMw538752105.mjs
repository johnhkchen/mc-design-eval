import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 9 x 28 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey (5-block storeys) 1980s-90s Taipei shophouse/office block:
// white-tiled concrete facade, light-grey cornice and parapet, glass windows in
// concrete piers, a shopfront with a double entrance on the west (street) face,
// and a small rooftop plant box. Warm light shows through some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw538752105.cells.json`, "utf8"));

const W = 9, H = 23, D = 28;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// direction name -> [dx, dz]
const DIRS = {
  east: [1, 0],
  west: [-1, 0],
  south: [0, 1],
  north: [0, -1],
};

const outward = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
const inward = (x, z) =>
  Object.keys(DIRS).filter(d => has(x + DIRS[d][0], z + DIRS[d][1]));

const glassPane = (xPlane) =>
  xPlane
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  const per = out.length > 0;
  const corner = out.length >= 2;
  const xPlane = out.includes("east") || out.includes("west");

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab / base course
  put(x, gr, z, per ? "polished_andesite" : "smooth_stone");

  // Storey floor slabs (storey 2 line, roof deck)
  put(x, gr + 5, z, per ? "white_concrete" : "smooth_stone");
  put(x, gr + 10, z, per ? "light_gray_concrete" : "smooth_stone");

  if (!per) continue;

  // Facade walls for both storeys
  for (const y of [gr + 1, gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9]) {
    put(x, y, z, "white_concrete");
  }

  // Parapet with a stone cap course
  put(x, gr + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Entrance: double doors centred on the west face
  const isEntrance = out.includes("west") && x === 0 && (z === 13 || z === 14);
  if (isEntrance) {
    const hinge = z === 13 ? "left" : "right";
    put(x, gr + 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge, open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge, open: "false", powered: "false" });
    put(x, gr + 3, z, "glass_pane", glassPane(false));
    put(x, gr + 4, z, "stone_bricks");
    continue;
  }

  // Window bays: concrete piers at corners and every third bay
  const isWindow = !corner && (x + z) % 3 !== 0;
  if (isWindow) {
    // Sills
    put(x, gr + 1, z, "light_gray_concrete");
    put(x, gr + 6, z, "light_gray_concrete");
    // Glass, storey 1 and storey 2
    for (const y of [gr + 2, gr + 3, gr + 7, gr + 8]) {
      put(x, y, z, "glass_pane", glassPane(xPlane));
    }
    // Warm light behind some glass (interior air cell next to the window)
    if ((x * 7 + z * 3) % 5 === 0) {
      const ins = inward(x, z)[0];
      if (ins) {
        const dx = DIRS[ins][0], dz = DIRS[ins][1];
        put(x + dx, gr + 2, z + dz, "glowstone");
        put(x + dx, gr + 7, z + dz, "glowstone");
      }
    }
  } else {
    // Piers keep their concrete; add a shopfront band at the ground floor
    if (out.includes("west") && x === 0) {
      put(x, gr + 1, z, "dark_oak_trapdoor", { facing: "north", half: "bottom", open: "false", powered: "false", waterlogged: "false" });
    }
  }
}

// Rooftop plant box on the roof deck, inside the footprint
for (let x = 3; x <= 5; x++) {
  for (let z = 10; z <= 17; z++) {
    if (!has(x, z)) continue;
    const gr = ground(x, z);
    if (outward(x, z).length === 0) {
      put(x, gr + 11, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/OSMw538752105.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw653568672";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 21 x 16 footprint, roof about 7 blocks above lowest ground.
// Reading: a low 1960s-80s Xinyi-style commercial block. One shopfront storey
// (about 5 blocks), a roof deck, and a white tiled parapet to about 7 blocks.
const W = 21, H = 19, D = 16;
const DECK_Y = 5;      // roof deck / cornice line
const LINTEL_Y = 4;    // top of ground storey
const STOREFRONT_TOP = 3;
const PARAPET_TOP = 7;

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gnd = new Map();
for (const [x, z, ge] of cells) {
  gnd.set(key(x, z), Math.max(0, Math.min(2, Math.round(ge))));
}
const has = (x, z) => gnd.has(key(x, z));
const gr = (x, z) => gnd.get(key(x, z));

// [dx, dz, name] for the four outward faces
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposedFaces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const allCells = [...gnd.keys()].map((k) => k.split(",").map(Number));
const xs = allCells.map(([x]) => x);
const zs = allCells.map(([, z]) => z);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
const midZ = (Math.min(...zs) + Math.max(...zs)) / 2;

// Main entrance: a south-facing perimeter cell near the middle, low ground preferred
const southCells = allCells.filter(([x, z]) => !has(x, z + 1));
southCells.sort((a, b) =>
  (Math.abs(a[0] - midX) + gr(a[0], a[1]) * 4) - (Math.abs(b[0] - midX) + gr(b[0], b[1]) * 4)
);
const door = southCells.length ? southCells[0] : null;

// Pass 1: foundations, floors, walls, storefronts, parapet
for (const [k, ge] of gnd) {
  const [x, z] = k.split(",").map(Number);

  // foundation under each cell up to its ground
  for (let y = 0; y < ge; y++) g.set(x, y, z, "stone_bricks");

  const faces = exposedFaces(x, z);

  if (faces.length === 0) {
    // interior: floor slab at ground level and roof deck
    g.set(x, ge, z, "polished_andesite");
    g.set(x, DECK_Y, z, "light_gray_concrete");
    continue;
  }

  // base course on the perimeter
  g.set(x, ge, z, "polished_andesite");

  const corner = faces.length >= 2;
  const face = faces[0];
  const along = face[1] !== 0 ? x : z; // position along the face
  const pillar = corner || along % 3 === 0;
  const isDoor = door && door[0] === x && door[1] === z;

  // storefront: glass panes in frames, pillars between bays
  for (let y = ge + 1; y <= STOREFRONT_TOP; y++) {
    if (isDoor && y <= ge + 2) continue; // door handled below
    if (pillar) {
      g.set(x, y, z, "white_terracotta");
    } else {
      const props = face[1] !== 0
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", props);
    }
  }

  // lintel band over the storefront
  g.set(x, LINTEL_Y, z, pillar ? "smooth_quartz" : "smooth_quartz");

  // cornice and parapet
  g.set(x, DECK_Y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, DECK_Y + 1, z, "white_terracotta");
  g.set(x, PARAPET_TOP, z, pillar ? "smooth_quartz" : "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: entrance with door, canopy and lantern (after walls so it wins)
if (door) {
  const [dx, dz] = door;
  const ge = gr(dx, dz);
  g.set(dx, ge + 1, dz, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(dx, ge + 2, dz, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // canopy band over the entrance and its neighbours
  for (const ox of [-1, 0, 1]) {
    if (has(dx + ox, dz) && !has(dx + ox, dz + 1)) {
      g.set(dx + ox, LINTEL_Y, dz, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }
  // hanging lantern in the transom above the door
  g.set(dx, STOREFRONT_TOP, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: warm lights behind glass, roof core and rooftop units
for (const [k, ge] of gnd) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposedFaces(x, z);

  if (faces.length === 1 && !(door && door[0] === x && door[1] === z)) {
    const [dx, dz] = faces[0];
    const along = dz !== 0 ? x : z;
    const ix = x - dx, iz = z - dz; // cell just inside the glass
    if (along % 6 === 1 && has(ix, iz) && exposedFaces(ix, iz).length === 0) {
      g.set(ix, ge + 2, iz, "glowstone");
    }
  }

  if (faces.length === 0) {
    const inCore = Math.abs(x - midX) <= 2 && Math.abs(z - midZ) <= 2;
    if (inCore) {
      g.set(x, DECK_Y + 1, z, "white_terracotta");
      g.set(x, PARAPET_TOP, z, "smooth_quartz");
    } else if (x % 6 === 2 && z % 6 === 2) {
      g.set(x, DECK_Y + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

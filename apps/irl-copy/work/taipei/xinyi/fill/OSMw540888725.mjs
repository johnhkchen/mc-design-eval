import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888725";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 8 x 9, x 0..7, z 0..8. Height 23 covers ground steps up to ~11 blocks.
const W = 8, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Mid-century Taipei commercial block: white/grey concrete, glazed shopfront
// at grade, two office storeys of ribbon glazing with concrete piers, a
// cornice parapet and a few rooftop units.
const FACES = {
  N: { dx: 0, dz: -1, name: "north" },
  S: { dx: 0, dz: 1, name: "south" },
  W: { dx: -1, dz: 0, name: "west" },
  E: { dx: 1, dz: 0, name: "east" },
};
const PREF = ["S", "N", "E", "W"];

const k = (x, z) => `${x},${z}`;
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(k(x, z), gr);
const has = (x, z) => gm.has(k(x, z));
const facesOf = (x, z) =>
  Object.keys(FACES).filter((f) => !has(x + FACES[f].dx, z + FACES[f].dz));
const isPerim = (x, z) => facesOf(x, z).length > 0;

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Front door: middle of the south-facing street edge.
const southXs = cells
  .filter(([x, z]) => facesOf(x, z).includes("S"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

// Pass 1: foundations, floor slabs, roof deck, rooftop units.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");           // ground floor slab
  put(x, gr + 5, z, "smooth_stone");       // storey 1 / storey 2 floor
  put(x, gr + 10, z, "gray_concrete");     // roof deck
  if (!isPerim(x, z) && (x * 3 + z * 5) % 11 === 0) {
    put(x, gr + 11, z, "iron_block");      // rooftop condenser unit
  }
}

// Pass 2: facade on perimeter cells (each perimeter cell is the wall column).
for (const [x, z, gr] of cells) {
  const fs = facesOf(x, z);
  if (fs.length === 0) continue;
  const primary = PREF.find((f) => fs.includes(f));
  const F = FACES[primary];
  const ns = primary === "N" || primary === "S";
  const along = ns ? x - minX : z - minZ;
  const span = ns ? maxX - minX : maxZ - minZ;
  const corner = along === 0 || along === span;
  const isDoor = primary === "S" && x === doorX;
  const pane = ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Base course
  put(x, gr + 1, z, "stone_bricks");

  // Ground floor shopfront
  if (isDoor) {
    const door = { facing: F.name, hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "dark_oak_door", { ...door, half: "lower" });
    put(x, gr + 2, z, "dark_oak_door", { ...door, half: "upper" });
    put(x, gr + 3, z, "light_gray_concrete");
  } else if (corner) {
    put(x, gr + 2, z, "light_gray_concrete");
    put(x, gr + 3, z, "light_gray_concrete");
  } else {
    put(x, gr + 2, z, "glass_pane", pane);
    put(x, gr + 3, z, "glass_pane", pane);
  }
  // Ground-floor lintel / canopy band
  put(x, gr + 4, z, "light_gray_concrete");

  // Upper office storey: spandrels top and bottom, ribbon glazing between piers
  put(x, gr + 6, z, "white_concrete");
  put(x, gr + 9, z, "white_concrete");
  for (const y of [gr + 7, gr + 8]) {
    if (corner) put(x, y, z, "light_gray_concrete");
    else if (along % 2 === 1) put(x, y, z, "glass_pane", pane);
    else put(x, y, z, "light_gray_concrete");
  }

  // Warm light behind some glass (interior cell just inside the facade)
  const ix = x - F.dx, iz = z - F.dz;
  if (has(ix, iz) && !isPerim(ix, iz)) {
    if (!corner && !isDoor && along % 3 === 1) put(ix, gr + 1, iz, "lantern");
    if (!corner && along % 4 === 1) put(ix, gr + 6, iz, "glowstone");
  }

  // Parapet cornice on the roof line
  put(x, gr + 10, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538408111";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 17, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground (rounded, >= 0)
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const isPerim = (x, z) => has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));
const footprint = [...G.keys()].map(k => k.split(",").map(Number));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Building datum: roof deck/parapet top at y 11 (about 11 blocks above lowest ground).
const ROOF = 11;

// ---- Pass 1: foundations, interior floors, perimeter walls ----
for (const [x, z] of footprint) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const nM = !has(x, z - 1), sM = !has(x, z + 1), wM = !has(x - 1, z), eM = !has(x + 1, z);
  const perim = nM || sM || wM || eM;
  const corner = (nM || sM) && (wM || eM);

  if (!perim) {
    // Interior: storey slab at y 5, roof deck at y 11. Air between (no interiors).
    if (gr <= 4) put(x, 5, z, "light_gray_concrete");
    if (gr <= ROOF) put(x, ROOF, z, "gray_concrete");
    continue;
  }

  if (corner) {
    // Corner pillars run full height to the parapet.
    for (let y = gr; y < ROOF; y++) put(x, y, z, "polished_andesite");
    put(x, ROOF, z, "stone_brick_wall");
    continue;
  }

  // Facade cell
  const face = (nM || sM) ? "ns" : "ew";
  const idx = face === "ns" ? x : z;
  const win = idx % 3 === 2;

  for (let y = gr; y <= ROOF; y++) {
    let b;
    if (y === gr) b = "polished_andesite";                       // base course
    else if (y === ROOF) b = "stone_brick_wall";                  // parapet
    else if (y <= 3) b = (idx % 3 === 0) ? "smooth_quartz" : "light_blue_stained_glass"; // shopfront
    else if (y === 4) b = "red_concrete";                         // shop sign band
    else if (y === 5) b = "smooth_quartz";                        // storey line
    else if (y === 10) { put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" }); continue; } // cornice
    else if (win) b = (y === 6 || y === 9) ? "quartz_block" : "light_blue_stained_glass_pane";
    else b = "white_concrete";
    put(x, y, z, b);
  }

  // Entrance on the south facade, centred.
  if (sM && x === 8) {
    put(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Entrance lintel / canopy band over the door.
    for (let dx = -1; dx <= 1; dx++) {
      if (has(x + dx, z)) put(x + dx, gr + 2, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// ---- Pass 2: warm lights (glowstone behind upper windows, lanterns in the ground storey) ----
for (const [x, z] of footprint) {
  const gr = gnd(x, z);
  const nM = !has(x, z - 1), sM = !has(x, z + 1), wM = !has(x - 1, z), eM = !has(x + 1, z);
  if (!isPerim(x, z) || ((nM || sM) && (wM || eM))) {
    // Interior ground-storey lanterns hanging from the y 5 slab.
    if (!isPerim(x, z) && gr <= 4 && x % 4 === 2 && z % 4 === 2) {
      put(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    continue;
  }
  const face = (nM || sM) ? "ns" : "ew";
  const idx = face === "ns" ? x : z;
  const win = idx % 3 === 2;
  if (!win || idx % 6 !== 2) continue;
  let dx = 0, dz = 0;
  if (nM) dz = 1; else if (sM) dz = -1; else if (wM) dx = 1; else if (eM) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !isPerim(ix, iz) && gr <= 5) put(ix, 7, iz, "glowstone");
}

// ---- Pass 3: roof hut (stair access), water tank and AC units on the roof deck ----
const inFoot = (x0, z0, x1, z1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!has(x, z)) return false;
  return true;
};

// Stair hut 5x5, walls y 12..14, cap at y 15.
if (inFoot(6, 6, 10, 10)) {
  for (let x = 6; x <= 10; x++) for (let z = 6; z <= 10; z++) {
    const ring = x === 6 || x === 10 || z === 6 || z === 10;
    for (let y = 12; y <= 14; y++) {
      if (ring) put(x, y, z, "white_concrete");
    }
    put(x, 15, z, "gray_concrete");
  }
  // South door (z=10) and glazing on the west and east walls.
  put(8, 12, 10, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(8, 13, 10, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(6, 13, 8, "light_blue_stained_glass_pane");
  put(10, 13, 8, "light_blue_stained_glass_pane");
  put(8, 14, 6, "glowstone"); // warm light visible through the glazing, inside the hut
}

// Water tank 3x3 on spruce planks, with a lid slab.
if (inFoot(12, 12, 14, 14)) {
  for (let x = 12; x <= 14; x++) for (let z = 12; z <= 14; z++) {
    for (let y = 12; y <= 14; y++) put(x, y, z, "spruce_planks");
    put(x, 15, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Four AC condenser blocks, 2x2 each.
for (const [ax, az] of [[2, 2], [2, 13], [13, 2]]) {
  if (inFoot(ax, az, ax + 1, az + 1)) {
    for (let x = ax; x <= ax + 1; x++) for (let z = az; z <= az + 1; z++) put(x, 12, z, "iron_block");
  }
}

g.save(`${dir}/${id}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1990s-2000s Xinyi office block: 12 storeys of 5 blocks on a granite base,
// white-clad piers with light-blue glass bays, quartz corner pillars,
// a setback plant room and a lightning-rod mast. Warm lights sit behind
// glass on alternate storeys and the roof has sea-lantern accents.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw769717213";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 71, D = 16;
const ROOF = 60;      // roof deck; top of the main block
const STOREY = 5;

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const pane = (axisX) => (axisX
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// Main block
for (const [x, z, gr] of cells) {
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const zFace = nN || nS;
  const xFace = nW || nE;
  const perim = zFace || xFace;
  const corner = zFace && xFace;

  // foundation below the cell's own ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slab each storey, air gap elsewhere
    for (let y = gr; y < ROOF; y++) {
      if (y % STOREY === 0 || y === gr) g.set(x, y, z, "smooth_quartz");
    }
  } else {
    for (let y = gr; y < ROOF; y++) {
      if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }
      const i = zFace ? x : z;
      const mull = i % 3 === 0;
      const r = y % STOREY;
      if (y === gr && y < STOREY) { g.set(x, y, z, "polished_granite"); continue; } // base course
      if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }            // floor line
      if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }                  // spandrel
      // window band rows 1..3
      if (mull) { g.set(x, y, z, "light_gray_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass_pane", pane(zFace));

      // warm light behind glass on alternate storeys
      const k = Math.floor(y / STOREY);
      if (r === 2 && k % 2 === 0 && i % 4 === 2) {
        const ix = xFace ? (nW ? x + 1 : x - 1) : x;
        const iz = zFace ? (nN ? z + 1 : z - 1) : z;
        if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // roof deck, parapet and cornice
  g.set(x, ROOF, z, "light_gray_concrete");
  if (perim) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "smooth_quartz");
  } else if ((x === 2 || x === 22) && (z === 2 || z === 13)) {
    g.set(x, ROOF + 1, z, "sea_lantern");
  }
}

// Ground-floor entrance on the south face, with hanging lanterns
for (const [x, z, gr] of cells) {
  if (x === 12 && z === 15 && gr === 0 && !has(x, z + 1)) {
    g.set(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 3, z, "light_blue_stained_glass_pane", pane(true));
  }
}
for (const x of [10, 14]) {
  const z = 15;
  if (has(x, z) && ground.get(`${x},${z}`) === 0) {
    g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Setback plant room, storeys 61..65
const PX0 = 6, PX1 = 18, PZ0 = 4, PZ1 = 11;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const perim = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    const corner = (x === PX0 || x === PX1) && (z === PZ0 || z === PZ1);
    const xFace = x === PX0 || x === PX1;
    if (perim) {
      for (let y = 61; y <= 64; y++) {
        if (corner) g.set(x, y, z, "smooth_quartz");
        else if (y === 61) g.set(x, y, z, "light_gray_concrete");
        else if (y === 64) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "light_blue_stained_glass_pane", pane(!xFace));
      }
    } else {
      g.set(x, 61, z, "smooth_quartz"); // interior floor
    }
    g.set(x, 65, z, "smooth_quartz");   // cap
  }
}

// Mast on the plant room
if (has(12, 7)) {
  for (let y = 66; y <= 69; y++) {
    g.set(12, y, 7, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  g.set(12, 70, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

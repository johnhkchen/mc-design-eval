import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280249";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 33, D = 20;
const ROOF = 20;          // roof/parapet top, 21 blocks above lowest ground
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inFp = (x, z) => ground.has(`${x},${z}`);

// which outer faces a footprint cell lies on (W/E/N/S), empty if interior
function faces(x, z) {
  const f = [];
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  return f;
}

const lights = [];   // interior cells that get a warm glowstone behind a window
const DOOR_Z = 9;

// ---- pass 1: foundations, floors, facade, roof ----
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const exterior = f.length > 0;
  const corner = f.length >= 2;
  const face = f[0];
  const u = face === "W" || face === "E" ? z : x;
  const pier = corner || u % 3 === 0;

  if (!exterior) {
    // interior cells: floor slabs only, air gap behind everything else
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y % 5 === 0) g.set(x, y, z, "white_concrete");
    }
    g.set(x, ROOF, z, "smooth_quartz");
    continue;
  }

  for (let y = gr; y <= ROOF; y++) {
    // roof / parapet cap
    if (y === ROOF) { g.set(x, y, z, "smooth_quartz"); continue; }
    // plinth course at the first course above ground
    if (y === gr && y >= 5) { g.set(x, y, z, "stone_bricks"); continue; }

    if (y < 5) {
      // ground-floor shopfront
      if (face === "W" && z === DOOR_Z && (y === gr || y === gr + 1) && gr + 1 < 5) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "east",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }
      if (y === 4) { g.set(x, y, z, "polished_andesite"); continue; }
      if (pier) { g.set(x, y, z, "polished_granite"); continue; }
      g.set(x, y, z, "glass_pane");
      continue;
    }

    // upper storeys: 5-block module
    const r = y % 5;
    if (r === 0) { g.set(x, y, z, "smooth_quartz"); continue; }       // storey line
    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }      // spandrel
    if (pier) { g.set(x, y, z, "light_gray_concrete"); continue; }    // pier
    g.set(x, y, z, "glass_pane");                                     // window

    // warm light behind every sixth window, on the middle row
    if (r === 2 && u % 6 === 2 && !corner) {
      const bx = face === "W" ? x + 1 : face === "E" ? x - 1 : x;
      const bz = face === "N" ? z + 1 : face === "S" ? z - 1 : z;
      if (inFp(bx, bz) && faces(bx, bz).length === 0) lights.push([bx, y, bz]);
    }
  }
}

// warm lights behind the glass
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

// ---- pass 2: rooftop plant and penthouse ----
for (let x = 2; x <= 4; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!inFp(x, z)) continue;
    const edge = x === 2 || x === 4 || z === 6 || z === 13;
    const corner = (x === 2 || x === 4) && (z === 6 || z === 13);
    if (edge) {
      g.set(x, 21, z, "light_gray_concrete");
      g.set(x, 22, z, corner ? "light_gray_concrete" : "glass_pane");
    }
    g.set(x, 23, z, "smooth_stone");
  }
}

// rooftop air-handling units, standing on the roof slab
for (let x = 1; x <= 2; x++) {
  for (let z = 16; z <= 17; z++) {
    if (inFp(x, z)) g.set(x, 21, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);

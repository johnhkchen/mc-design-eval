import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0312-1F-3";
const W = 57, H = 19, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------
const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr);
  if (gr > maxG) maxG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

// Flat roof: 2002 low-rise, about one storey of 5 blocks plus a parapet.
const roofY = Math.min(H - 3, Math.max(7, maxG + 5));

// ---- classify boundary cells and the exposed face -----------------------
const boundaryOf = new Map();
const faceOf = new Map();
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const b = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  boundaryOf.set(k, b);
  let face = null;
  if (!has(x, z - 1)) face = "n";        // z-min: street frontage with shopfronts
  else if (!has(x, z + 1)) face = "s";
  else if (!has(x - 1, z)) face = "w";
  else if (!has(x + 1, z)) face = "e";
  faceOf.set(k, face);
}
const isBoundary = (x, z) => boundaryOf.get(`${x},${z}`) === true;

// ---- materials --------------------------------------------------------
const GLASS = "light_blue_stained_glass";
const PANE = "light_blue_stained_glass_pane";
const FRAME = "white_concrete";
const PILASTER = "smooth_quartz";
const SPANDREL = "light_gray_concrete";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const SLAB = "smooth_stone";
const CAP = "smooth_quartz";
const ROOF = "light_gray_concrete";

function doorProps(half) {
  return { facing: "north", half, hinge: "left", open: "false", powered: "false" };
}

function paneProps(face) {
  // panes connect along the facade direction
  if (face === "n" || face === "s")
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// ---- build each footprint cell ----------------------------------------
for (const [k, base] of ground) {
  const [x, z] = k.split(",").map(Number);
  const boundary = isBoundary(x, z);
  const face = faceOf.get(k);
  const u = (face === "n" || face === "s") ? x : z; // position along the face

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, FOUND);

  for (let y = base; y < roofY; y++) {
    const r = y - base;
    const m = r % 5;

    if (!boundary) {
      // interior: floor slab per storey, air elsewhere
      if (m === 0) g.set(x, y, z, SLAB);
      continue;
    }

    // exterior shell
    if (r === 0) { g.set(x, y, z, BASE); continue; }
    if (m === 0) { g.set(x, y, z, FRAME); continue; }     // string course

    if (m === 4) {
      // spandrel; on the street front, the top spandrel becomes a canopy slab
      if (face === "n") g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, SPANDREL);
      continue;
    }

    // window band rows (m = 1..3)
    const isFrontStore = face === "n" && r <= 3;
    const doorCol = face === "n" && u % 12 === 6;

    if (isFrontStore && doorCol) {
      if (r === 1) g.set(x, y, z, "dark_oak_door", doorProps("lower"));
      else if (r === 2) g.set(x, y, z, "dark_oak_door", doorProps("upper"));
      else if (r === 3) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (face === "n" && (r === 1 || r === 2)) {
      // shopfront glass with pillars every 6 blocks
      g.set(x, y, z, u % 6 === 0 ? FRAME : GLASS);
      continue;
    }
    if (u % 6 === 0) { g.set(x, y, z, PILASTER); continue; } // pilaster bay
    if (u % 3 === 0) { g.set(x, y, z, FRAME); continue; }    // mullion
    g.set(x, y, z, PANE, paneProps(face));
  }

  // roof cap at roofY: cornice on the edge, roof slab inside
  g.set(x, roofY, z, boundary ? CAP : ROOF);
}

// ---- warm lights behind some windows (inside the air gap) -------------
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isBoundary(x, z)) continue;
  const face = faceOf.get(k);
  const u = (face === "n" || face === "s") ? x : z;
  if (u % 9 !== 4) continue;
  let xi = x, zi = z;
  if (face === "n") zi = z + 1;
  else if (face === "s") zi = z - 1;
  else if (face === "w") xi = x + 1;
  else if (face === "e") xi = x - 1;
  if (!has(xi, zi) || isBoundary(xi, zi)) continue;
  const base = gr(x, z);
  g.set(xi, base + 2, zi, "glowstone");
}

// ---- entrance lights beside each door, on the storefront side ---------
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (faceOf.get(k) !== "n" || x % 12 !== 6) continue;
  const base = gr(x, z);
  // lamp posts on the storefront line, one block either side of the door
  for (const dx of [-2, 2]) {
    if (has(x + dx, z) && isBoundary(x + dx, z)) {
      g.set(x + dx, base + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// ---- roof equipment: a few plant boxes on the roof slab ---------------
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isBoundary(x, z)) continue;
  if (x % 12 === 6 && z === 10) {
    g.set(x, roofY + 1, z, "iron_block");
    if (has(x, z + 1) && !isBoundary(x, z + 1)) g.set(x, roofY + 1, z + 1, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

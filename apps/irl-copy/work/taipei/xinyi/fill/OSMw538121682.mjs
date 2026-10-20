import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121682";
const W = 26, H = 23, D = 23;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const gmap = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.round(gr)));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => gmap.has(`${x},${z}`);

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";

// Pass 1: foundations, floor slabs, plinth, cornice, walls, openings
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const fN = !has(x, z - 1), fS = !has(x, z + 1), fW = !has(x - 1, z), fE = !has(x + 1, z);
  const edge = fN || fS || fW || fE;
  const faceCount = [fN, fS, fW, fE].filter(Boolean).length;
  const corner = faceCount > 1;

  // tall cells: solid mass to the second floor slab, cornice on top
  if (ground >= 5) {
    for (let y = ground; y <= 10; y++) g.set(x, y, z, "smooth_quartz");
    if (edge) g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // ground floor slab / base course
  g.set(x, ground, z, edge ? "polished_granite" : "smooth_quartz");
  // storey lines
  g.set(x, 5, z, "smooth_quartz");
  g.set(x, 10, z, "smooth_quartz");

  if (edge) g.set(x, ROOF, z, "light_gray_concrete"); // cornice / parapet
  if (!edge) continue;

  // primary face and its position along it
  let face, u, start, end;
  if (fN)      { face = "N"; u = x; start = minX; end = maxX; }
  else if (fS) { face = "S"; u = x; start = minX; end = maxX; }
  else if (fW) { face = "W"; u = z; start = minZ; end = maxZ; }
  else         { face = "E"; u = z; start = minZ; end = maxZ; }

  const pier = corner || (u - start) % 3 === 0 || u === end;
  const bayIdx = Math.floor((u - start) / 3);

  // inward neighbour for interior lights
  const inX = face === "W" ? x + 1 : face === "E" ? x - 1 : x;
  const inZ = face === "N" ? z + 1 : face === "S" ? z - 1 : z;
  const inside = has(inX, inZ);

  const paneProps = face === "N" || face === "S" ? PANE_NS : PANE_EW;

  // storeys: [airBottom, airTop, isGround]
  const storeys = [[ground + 1, 4, true], [6, 9, false]];

  for (const [lo, hi, isGround] of storeys) {
    if (lo > hi) continue;

    // solid wall as default
    for (let y = lo; y <= hi; y++) g.set(x, y, z, "smooth_quartz");

    if (pier) {
      for (let y = lo; y <= hi; y++) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    const lintel = hi;
    const sill = lo;
    // lintel and sill bands
    g.set(x, lintel, z, "light_gray_concrete");

    const shopfront = isGround && face === "N";
    const glassLo = shopfront ? lo : lo + 1;
    const glassHi = lintel - 1;

    if (!shopfront) g.set(x, sill, z, "light_gray_concrete");

    // entrance on the north face
    if (shopfront && u === 13) {
      g.set(x, glassLo, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, glassLo + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, glassLo + 2, z, "smooth_quartz");
      g.set(x, lintel, z, "light_gray_concrete");
      continue;
    }

    for (let y = glassLo; y <= glassHi; y++) {
      g.set(x, y, z, GLASS, paneProps);
    }

    // warm light behind some glass, in the air gap
    if (inside && bayIdx % 4 === 1) {
      const ly = isGround ? ground + 2 : 7;
      const block = isGround ? "glowstone" : "shroomlight";
      g.set(inX, ly, inZ, block);
    }
  }
}

// Pass 2: roof plant on the flat roof (sits on the 10 slab)
for (let x = 5; x <= 8; x++) {
  for (let z = 14; z <= 17; z++) {
    if (!has(x, z)) continue;
    g.set(x, ROOF, z, "light_gray_concrete");
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

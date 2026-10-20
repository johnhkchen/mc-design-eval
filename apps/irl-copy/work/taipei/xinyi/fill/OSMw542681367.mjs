import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542681367";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 19 x 12, roof ~11 above lowest ground: two storeys of ~5 blocks
// with a stone-brick parapet, a 1960s-80s commercial block in Xinyi's
// pale concrete and tinted-glass idiom, with a shopfront at street level.
const W = 19, H = 23, D = 12;
const ROOF = 10;      // roof slab top course (y = 10)
const FLOOR2 = 5;     // storey-2 floor slab
const PARAPET = 11;   // parapet course on the perimeter

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), gr);
const inside = (x, z) => foot.has(key(x, z));
const perim = (x, z) =>
  !inside(x, z - 1) || !inside(x, z + 1) || !inside(x - 1, z) || !inside(x + 1, z);

// Primary facing for each perimeter cell: prefer south (street side), then north, east, west.
function faceOf(x, z) {
  if (!inside(x, z + 1)) return { f: "south", dx: 0, dz: -1, i: x };
  if (!inside(x, z - 1)) return { f: "north", dx: 0, dz: 1, i: x };
  if (!inside(x + 1, z)) return { f: "east", dx: -1, dz: 0, i: z };
  if (!inside(x - 1, z)) return { f: "west", dx: 1, dz: 0, i: z };
  return null;
}

// Door sits on the middle of the south face.
const southIs = cells.filter(([x, z]) => perim(x, z) && !inside(x, z + 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = southIs.length ? southIs[Math.floor(southIs.length / 2)] : Math.floor(W / 2);
const doorZ = D - 1;

const paneState = (f) =>
  f === "south" || f === "north"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, ground] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(ground, PARAPET - 2));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Ground-floor slab.
  g.set(x, gr, z, "smooth_stone");

  if (!perim(x, z)) {
    // Interior: floor and roof slabs only, air between (no interiors modelled).
    if (gr <= FLOOR2) g.set(x, FLOOR2, z, "smooth_stone");
    g.set(x, ROOF, z, "light_gray_concrete");
    // Roof equipment: small plant boxes on a grid.
    if (x % 5 === 2 && z % 4 === 1) {
      g.set(x, PARAPET, z, "iron_block");
    }
    continue;
  }

  const fc = faceOf(x, z);
  const f = fc ? fc.f : "south";
  const i = fc ? fc.i : x;

  for (let y = gr; y <= ROOF; y++) {
    let b;
    let st;
    if (y < FLOOR2) {
      // Ground storey: shopfront with stone piers.
      if (i % 3 === 0) {
        b = "white_concrete";
      } else {
        b = "glass";
      }
      if (f === "south" && x === doorX && z === doorZ) {
        if (y === gr) { b = "dark_oak_door"; st = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
        else if (y === gr + 1) { b = "dark_oak_door"; st = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
        else if (y === gr + 2) { b = "shroomlight"; }
        else { b = "white_concrete"; }
      }
      if (y === FLOOR2 - 1 && i % 3 !== 0 && !(f === "south" && x === doorX)) {
        b = "glass";
      }
    } else if (y === FLOOR2) {
      b = "light_gray_concrete"; // storey line
    } else if (y < ROOF) {
      // Upper storey: window grid with piers.
      if (i % 3 === 0) {
        b = "white_concrete";
      } else {
        b = "glass_pane";
        st = paneState(f);
      }
    } else {
      // Cornice band at the roof line.
      b = "light_gray_concrete";
    }
    if (st) g.set(x, y, z, b, st);
    else g.set(x, y, z, b);
  }

  // Parapet cap on the perimeter.
  g.set(x, PARAPET, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Warm lights: glowstone just behind some windows (inside the building).
  if (fc) {
    const ix = x + fc.dx, iz = z + fc.dz;
    if (inside(ix, iz) && !perim(ix, iz)) {
      if (i % 6 === 1) g.set(ix, FLOOR2 + 2, iz, "glowstone");
      if (i % 6 === 4 && f !== "south") g.set(ix, FLOOR2 + 2, iz, "glowstone");
    }
    // Street-level lanterns behind the shopfront glass.
    if (y0ok(gr) && i % 6 === 2 && f === "south") {
      if (inside(ix, iz) && !perim(ix, iz)) g.set(ix, gr + 2, iz, "glowstone");
    }
  }
}

function y0ok(gr) { return gr + 2 < FLOOR2; }

g.save(`${DIR}/${ID}.nbt`);

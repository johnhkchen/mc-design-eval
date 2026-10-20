import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466770";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 38, D = 19;
const ROOF = 25;               // roof deck top block; building height about 26 blocks
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground level
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward faces: a footprint cell is on the perimeter if a neighbour is missing
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
function outward(x, z) {
  for (const [n, dx, dz] of DIRS) if (!has(x + dx, z + dz)) return [n, dx, dz];
  return null;
}

// Main entrance: on the south face, the perimeter cell nearest the mean x
let doorKey = null;
{
  const south = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    const o = outward(x, z);
    if (o && o[0] === "south") south.push(x);
  }
  if (south.length) {
    const mean = south.reduce((a, b) => a + b, 0) / south.length;
    const best = south.reduce((a, b) => (Math.abs(b - mean) < Math.abs(a - mean) ? b : a));
    const zMax = Math.max(...[...ground.keys()].map(k => Number(k.split(",")[1])));
    doorKey = `${best},${zMax}`;
  }
}
const isDoor = (x, z) => doorKey === `${x},${z}`;

// 1. Foundations, then building shell per footprint cell
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, ROOF - 2));
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const o = outward(x, z);
  for (let y = gr; y <= ROOF; y++) {
    if (!o) {
      // interior: floor slabs per storey and roof deck only (air between)
      if (y === ROOF) g.set(x, y, z, "gray_concrete");
      else if (y === gr || y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // parapet with coping on the perimeter
    if (y >= 24) { g.set(x, y, z, "white_concrete"); continue; }

    const [dir] = o;
    const i = (dir === "north" || dir === "south") ? x : z; // index along the wall
    const r = y % 5;
    const k = Math.floor(y / 5);

    if (k === 0) {
      if (isDoor(x, z) && (y === gr || y === gr + 1)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: dir,
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }   // base course
      if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }      // storefront lintel
      if (i % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }  // mullion
      g.set(x, y, z, "light_blue_stained_glass");                       // shopfront glass
      continue;
    }

    // upper storeys
    if (r === 0) { g.set(x, y, z, "white_concrete"); continue; }        // spandrel / storey line
    if (r === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }   // sill
    if (i % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }    // mullion
    g.set(x, y, z, "light_blue_stained_glass_pane");                    // window
  }
}

// 2. Warm lights behind some windows (only where the inner cell is open interior)
for (const [x, z, gr0] of cells) {
  const o = outward(x, z);
  if (!o) continue;
  const [dir, dx, dz] = o;
  const i = (dir === "north" || dir === "south") ? x : z;
  if (i % 6 !== 1) continue;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || outward(ix, iz)) continue;          // need an interior cell behind
  const igr = ground.get(`${ix},${iz}`);
  const gr = Math.max(0, Math.min(gr0, ROOF - 2));
  for (let y = gr + 1; y <= 23; y++) {
    if (y % 5 !== 2) continue;
    if (y < igr) continue;
    if (isDoor(x, z)) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 3. Rooftop plant room with louvres, and a lightning rod on top
for (let x = 8; x <= 14; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!has(x, z) || outward(x, z)) continue;
    g.set(x, 26, z, "stone_bricks");
    g.set(x, 27, z, "stone_bricks");
    g.set(x, 28, z, "iron_bars");
  }
}
if (has(11, 9)) {
  for (let y = 26; y <= 29; y++) {
    g.set(11, y, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

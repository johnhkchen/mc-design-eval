import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 太平第一大樓: a 1970s-80s Taipei mid-rise office block. Three storeys of
// 5 blocks (roof slab at y 15), a parapet at y 16, white ceramic-tile facade,
// grey granite base, blue-tinted shopfront glass on the ground storey, bronze-
// framed glass above, and a central mechanical penthouse with a lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw295048485";
const W = 67, H = 28, D = 49;
const ROOF = 16;          // parapet top; roof slab sits at 15

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const has = (x, z) => G.has(x + "," + z);
const gro = (x, z) => G.get(x + "," + z);

let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length);
const cz = Math.round(sz / cells.length);

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Outward faces of a footprint cell (cell has no neighbour on that side).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x - 1, z)) f.push("W");
  return f;
}

// Pane connection props: a pane on a N/S-facing wall runs east-west.
const pane = (nsWall) => nsWall
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const inward = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

// Entrance: on the north face at the lowest ground, nearest the centre line.
let minZ = Infinity, minGround = Infinity;
for (const [x, z, gr] of cells) { minZ = Math.min(minZ, z); minGround = Math.min(minGround, gr); }
let door = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    if (z !== minZ || !faces(x, z).includes("N")) continue;
    const d = Math.abs(x - cx) + (gr - minGround) * 4;
    if (d < best) { best = d; door = { x, z, g: gr }; }
  }
}

const glow = [];

// ---- Main shell, cell by cell -------------------------------------------
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const per = f.length > 0;
  const ns = f.includes("N") || f.includes("S");
  const face = ns ? (f.includes("N") ? "N" : "S") : f[0];
  const bay = ns ? x : z;             // position along the outward face

  for (let y = 0; y <= ROOF; y++) {
    if (y < gr) { set(x, y, z, "stone_bricks"); continue; }
    if (y === gr) { set(x, y, z, per ? "polished_granite" : "light_gray_concrete"); continue; }
    if (y === ROOF) { if (per) set(x, y, z, "smooth_stone"); continue; }
    if (per && y <= gr + 1) { set(x, y, z, "polished_granite"); continue; }
    if (y === 15) { set(x, y, z, per ? "white_concrete" : "light_gray_concrete"); continue; }

    const row = y % 5;
    if (row === 0) { set(x, y, z, per ? "white_concrete" : "light_gray_concrete"); continue; }
    if (!per) continue; // interior air

    if (row === 2 || row === 3) {
      if (bay % 3 === 0) {
        set(x, y, z, "white_concrete");                       // mullion / pier
      } else if (y < 5) {
        set(x, y, z, "light_blue_stained_glass");             // shopfront
      } else {
        set(x, y, z, "light_blue_stained_glass_pane", pane(ns));
      }
      // Warm light just inside some window bays.
      if (y % 5 === 2 && y > gr + 1 && y < 15 && bay % 3 === 1) {
        const [dx, dz] = inward[face];
        const ix = x + dx, iz = z + dz;
        const igr = gro(ix, iz);
        if (igr !== undefined && !faces(ix, iz).length && y > igr) {
          glow.push([ix, y, iz]);
        }
      }
    } else {
      set(x, y, z, "white_terracotta");                       // spandrel
    }
  }
}

for (const [x, y, z] of glow) set(x, y, z, "glowstone");

// ---- Entrance ------------------------------------------------------------
if (door) {
  const { x, z, g: dg } = door;
  set(x, dg, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(x, dg + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  set(x, dg + 2, z, "polished_granite_slab", { type: "top", waterlogged: "false" });
}

// ---- Roof penthouse ------------------------------------------------------
{
  const x0 = cx - 9, x1 = cx + 9, z0 = cz - 6, z1 = cz + 6;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      set(x, 18, z, "smooth_stone");                         // cap
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      if (!edge) continue;
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      for (const y of [16, 17]) {
        if (y === 17 && !corner) {
          if ((z === z0 || z === z1) && (x - x0) % 3 === 1) {
            set(x, y, z, "light_blue_stained_glass_pane", pane(true)); continue;
          }
          if ((x === x0 || x === x1) && (z - z0) % 3 === 1) {
            set(x, y, z, "light_blue_stained_glass_pane", pane(false)); continue;
          }
        }
        set(x, y, z, "white_terracotta");
      }
    }
  }
  if (has(cx, cz)) set(cx, 19, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

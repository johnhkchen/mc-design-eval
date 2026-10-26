import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86631.cells.json`, "utf8"));

const W = 15, H = 29, D = 19;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { g: Math.round(gr), r: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));
const cellOf = (x, z) => map.get(key(x, z));
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const zWall = (x, z) => !has(x, z - 1) || !has(x, z + 1);

const keys = [...map.keys()].map(k => k.split(",").map(Number));
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of keys) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// ---- palette ----------------------------------------------------------------
const PIER = "calcite";
const SPAN = "smooth_stone";
const SLAB = "smooth_stone";
const DECK = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const FOUND = "polished_granite";   // foundation and base course
const BASE = "polished_granite";
const CAP = "smooth_stone_slab";
const SHOP = "tinted_glass";        // ground-floor shopfront glass

// ---- per-cell massing -------------------------------------------------------
for (const [x, z] of keys) {
  const { g: gr, r: rf } = cellOf(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  let top = Math.min(rf, H - 4);
  if (top <= gr + 3) top = gr + 3;

  const per = perim(x, z);
  const wallAlongX = zWall(x, z);
  const a = wallAlongX ? x : z;
  const aMin = wallAlongX ? minX : minZ;
  const aMax = wallAlongX ? maxX : maxZ;
  const pier = a % 3 === 0 || a === aMin || a === aMax;

  for (let y = gr; y <= top - 1; y++) {
    const rel = (y - gr) % 3;
    const k = Math.floor((y - gr) / 3);
    if (y === top - 1) { g.set(x, y, z, DECK); continue; }     // roof slab
    if (rel === 0) {
      // ground storey: granite base course on the facade, slab elsewhere
      g.set(x, y, z, (k === 0 && per) ? BASE : SLAB);
      continue;
    }
    if (!per) continue;                                         // interior air gap
    if (k === 0) {
      // shopfront: taller glass, piers every two cells
      if (pier || a % 2 === 1) { g.set(x, y, z, PIER); continue; }
      g.set(x, y, z, SHOP);
      continue;
    }
    if (pier) { g.set(x, y, z, PIER); continue; }
    g.set(x, y, z, GLASS, wallAlongX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }

  // parapet and cornice cap on the perimeter
  if (per) {
    g.set(x, top, z, pier ? PIER : SPAN);
    g.set(x, top + 1, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}

// ---- warm lights behind glass on upper storeys -----------------------------
for (const [x, z] of keys) {
  if (perim(x, z)) continue;
  const { g: gr, r: rf } = cellOf(x, z);
  const top = Math.max(Math.min(rf, H - 4), gr + 3);
  for (let y = gr + 4; y < top - 1; y += 3) {
    if ((x * 7 + z * 3 + y) % 11 === 0) {
      if (x === minX + 1 || x === maxX - 1 || z === minZ + 1 || z === maxZ - 1) {
        g.set(x, y - 1, z, "glowstone");
      }
    }
  }
}

// ---- entrance on the z-min face -------------------------------------------
const frontCells = keys.filter(([x, z]) => z === minZ).sort((p, q) => p[0] - q[0]);
if (frontCells.length) {
  const mid = Math.floor(W / 2);
  let door = frontCells[0];
  for (const c of frontCells) if (Math.abs(c[0] - mid) < Math.abs(door[0] - mid)) door = c;
  const [dx, dz] = door;
  const dg = cellOf(dx, dz).g;
  const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

  // recessed door in a stone surround with a lit transom
  g.set(dx, dg, dz, "dark_oak_door", doorProps("lower"));
  g.set(dx, dg + 1, dz, "dark_oak_door", doorProps("upper"));
  g.set(dx, dg + 2, dz, "glowstone");

  // canopy: slabs across the door at the first floor line, carried on piers
  for (let ox = -1; ox <= 1; ox++) {
    const x = dx + ox;
    if (!has(x, dz)) continue;
    g.set(x, dg + 3, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  for (const ox of [-1, 1]) {
    const x = dx + ox;
    if (!has(x, dz)) continue;
    g.set(x, dg + 1, dz, PIER);
    g.set(x, dg + 2, dz, PIER);
  }
}

// ---- roof equipment on the interior of the top ----------------------------
let roofRef = null;
for (const [x, z] of keys) {
  if (perim(x, z)) continue;
  const rr = Math.min(cellOf(x, z).r, H - 4);
  if (roofRef === null || rr > roofRef) roofRef = rr;
}
if (roofRef !== null) {
  const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
  for (let x = cx - 2; x <= cx + 1; x++) {
    for (let z = cz - 2; z <= cz + 1; z++) {
      if (!has(x, z) || perim(x, z)) continue;
      const { g: gr, r: rf } = cellOf(x, z);
      const top = Math.max(Math.min(rf, H - 4), gr + 3);
      if (top + 2 > H - 1) continue;
      if (x === cx - 2 || z === cz - 2) {
        g.set(x, top, z, "iron_block");
      } else if ((x + z) % 2 === 0) {
        g.set(x, top, z, DECK);
        g.set(x, top + 1, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/DC86631.nbt`);

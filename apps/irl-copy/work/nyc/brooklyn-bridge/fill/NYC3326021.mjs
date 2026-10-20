import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3326021.cells.json`, "utf8"));

const W = 18, H = 27, D = 11;
const g = new Voxels([W, H, D]);

// ---- footprint lookup and massing -------------------------------------------
const key = (x, z) => `${x},${z}`;
const map = new Map();
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const Tm = Math.round(roofs[Math.floor(roofs.length / 2)]); // smoothed roof tier (median)

let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
for (const [x, z, gr, roof] of cells) {
  const G = Math.max(0, Math.round(gr));
  const rawT = Math.abs(roof - Tm) <= 3 ? Tm : Math.round(roof);
  const T = Math.min(22, Math.max(G + 8, rawT));
  map.set(key(x, z), { x, z, G, T });
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => map.has(key(x, z));
const exposure = (c) => ({
  n: !has(c.x, c.z - 1),
  s: !has(c.x, c.z + 1),
  w: !has(c.x - 1, c.z),
  e: !has(c.x + 1, c.z),
});
const isExterior = (c) => {
  const e = exposure(c);
  return e.n || e.s || e.w || e.e;
};

// ---- entrance: street-facing exterior cell near the middle of the facade ----
let entrance = null;
{
  const ext = [...map.values()].filter(isExterior);
  const midX = (minX + maxX) / 2;
  const pick = (list) => {
    if (!list.length) return null;
    return list.slice().sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX))[0];
  };
  const nFaces = ext.filter((c) => exposure(c).n && !(exposure(c).w || exposure(c).e));
  const sFaces = ext.filter((c) => exposure(c).s && !(exposure(c).w || exposure(c).e));
  const anyF = ext.filter((c) => !(exposure(c).w && exposure(c).n));
  const e0 = pick(nFaces);
  if (e0) entrance = { c: e0, facing: "north" };
  else {
    const e1 = pick(sFaces);
    if (e1) entrance = { c: e1, facing: "south" };
    else {
      const e2 = pick(anyF.length ? anyF : ext);
      if (e2) {
        const e = exposure(e2);
        entrance = { c: e2, facing: e.n ? "north" : e.s ? "south" : e.w ? "west" : "east" };
      }
    }
  }
}

// ---- window test: exposed on exactly one face, bay index not on a pier ------
const isWindowCell = (c) => {
  const e = exposure(c);
  const faces = ["n", "s", "w", "e"].filter((f) => e[f]);
  if (faces.length !== 1) return false; // corners and thin cells are piers
  const f = faces[0];
  const idx = (f === "n" || f === "s") ? c.x - minX : c.z - minZ;
  return idx % 3 !== 0;
};

const isCorner = (c) => {
  const e = exposure(c);
  return (e.n || e.s) && (e.w || e.e);
};

// Inward neighbour for a window cell (used for glowstone behind the glass)
const inward = (c) => {
  const e = exposure(c);
  if (e.n) return [c.x, c.z + 1];
  if (e.s) return [c.x, c.z - 1];
  if (e.w) return [c.x + 1, c.z];
  if (e.e) return [c.x - 1, c.z];
  return null;
};

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// ---- 1. foundation: solid from y 0 up to each cell's ground --------------------
for (const c of map.values()) {
  for (let y = 0; y < c.G; y++) g.set(c.x, y, c.z, "stone");
}

// Entrance-related cells: door cell and its flanking frame cells
const entranceKeys = new Set();
const entranceFrame = new Set();
if (entrance) {
  const { x, z } = entrance.c;
  entranceKeys.add(key(x, z));
  const alongX = entrance.facing === "north" || entrance.facing === "south";
  for (const d of [-1, 1]) {
    const nx = alongX ? x + d : x;
    const nz = alongX ? z : z + d;
    if (has(nx, nz)) entranceFrame.add(key(nx, nz));
  }
}

// ---- 2. body -----------------------------------------------------------------
const roofEquipCell = { c: null };

for (const c of map.values()) {
  const { x, z, G, T } = c;
  const ext = isExterior(c);

  // storey bases: ground floor at G (rows G..G+2), upper storeys 2 blocks each from G+3
  const bases = [];
  for (let b = G + 3; b <= T - 4; b += 2) bases.push(b);
  const floorYs = new Set([G, ...bases]);

  const winCell = ext && isWindowCell(c);
  const corner = ext && isCorner(c);
  const isEntrance = entranceKeys.has(key(x, z));
  const isFrame = entranceFrame.has(key(x, z));

  for (let y = G; y < T; y++) {
    if (!ext) {
      // interior: floor slabs per storey, roof slab on top, air otherwise
      if (y === T - 1) g.set(x, y, z, "smooth_stone");
      else if (floorYs.has(y)) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // exterior shell
    let block = "bricks";
    let props;

    if (y === G) block = "stone_bricks";                    // base course
    else if (y === T - 1) block = "stone_bricks";           // parapet
    else if (y === T - 2) block = "smooth_stone";           // cornice band
    else if (bases.includes(y) || y === G + 3) block = "stone_bricks"; // string course / sill line

    // alternating stone quoins on corner cells (every 4 rows)
    if (corner && y > G && y < T - 2 && ((y - G) % 4 === 0 || (y - G) % 4 === 1)) {
      block = "stone_bricks";
    }

    // window rows: ground floor G+1..G+2, upper rows just above each string course
    const isWinRow = (y === G + 1 || y === G + 2) || bases.some((b) => y === b + 1);
    if (winCell && isWinRow) {
      block = "glass_pane"; props = GLASS;
    }

    // entrance frame: stone jambs flanking the door
    if (isFrame && (y === G + 1 || y === G + 2)) {
      block = "stone_bricks";
      props = undefined;
    }

    // entrance door, two blocks tall at the ground floor
    if (isEntrance && (y === G + 1 || y === G + 2)) {
      block = "oak_door";
      props = {
        facing: entrance.facing,
        half: y === G + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    }

    g.set(x, y, z, block, props);
  }

  if (!roofEquipCell.c && !ext) roofEquipCell.c = c;
}

// Entrance lintel: a stone cap over the door so the opening reads from the street
if (entrance) {
  const { x, z, G, T } = entrance.c;
  if (G + 3 < T - 2) g.set(x, G + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// ---- 3. warm light: glowstone just inside some lit windows --------------------
for (const c of map.values()) {
  if (!isExterior(c) || !isWindowCell(c)) continue;
  const inw = inward(c);
  if (!inw || !has(inw[0], inw[1])) continue;
  const ic = map.get(key(inw[0], inw[1]));
  if (isExterior(ic)) continue;
  const rows = [c.G + 2];
  for (let b = c.G + 3; b <= c.T - 4; b += 2) rows.push(b + 1);
  rows.forEach((y, i) => {
    if (y >= c.T - 2) return;
    if ((c.x + c.z + i) % 5 === 0) g.set(ic.x, y, ic.z, "glowstone");
  });
}

// ---- 4. roof equipment: a small water tank on an interior roof cell ----------
if (roofEquipCell.c) {
  const { x, z, T } = roofEquipCell.c;
  if (T + 2 <= H - 1) {
    g.set(x, T, z, "spruce_planks");
    g.set(x, T + 1, z, "spruce_planks");
    g.set(x, T + 2, z, "spruce_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC3326021.nbt`);

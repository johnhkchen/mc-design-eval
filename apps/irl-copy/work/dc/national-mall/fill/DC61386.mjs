// DC61386: a Beaux-Arts office block of the Federal Triangle type (1920s-30s, limestone), 4 storeys over a
// polished base, a tower setback on the east half, a low north annex, and a recessed entrance on the south face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61386.cells.json", "utf8"));
const W = 13, D = 16, H = 25;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFP = (x, z) => cell.has(key(x, z));

// roof tiers: lidar noise smoothed. Annex (roof <= 3) is a one-storey hall; tower (roof >= 12) is the setback core;
// everything else is the 4-storey block, flattened to one cornice height.
const BODY_TOP = 10;
const isAnnex = (c) => c.roof <= 3;
const isTower = (c) => c.roof >= 12 && !isAnnex(c);
const topOf = (x, z) => {
  const c = cell.get(key(x, z));
  if (isAnnex(c)) return c.roof - 1;
  if (isTower(c)) return c.roof - 1;
  return BODY_TOP;
};

// exposure: a footprint cell with a side that opens to nothing is shell (wall); the rest is interior
const exposed = (x, z) => ({
  N: !inFP(x, z - 1), S: !inFP(x, z + 1), W: !inFP(x - 1, z), E: !inFP(x + 1, z),
});
const isRing = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.W || e.E; };

// shell faces: pier (chiseled stone) at corners and every third bay, glazing in the rest
const isPier = (x, z) => {
  const e = exposed(x, z);
  if ((e.N || e.S) && (e.W || e.E)) return true;
  const u = e.N || e.S ? x : z;
  return u % 3 === 0;
};

const GLASS_UPPER = { block: "gray_stained_glass" };
const GLASS_SHOP = { block: "glass" };
const PIER = "chiseled_quartz_block";
const BAND = "smooth_quartz";
const BASE = "polished_andesite";
const FLOOR = "stone_bricks";
const DECK = "stone";
const CORE = "calcite";
const CROWN = "smooth_quartz";

// the entrance: a two-leaf door in the back of the south recess (the notch at z 15, x 4..7), piers either side
const DOOR = new Map([["5,14", "left"], ["6,14", "right"]]);
const RECESS_PIER = new Set(["4,14", "7,14"]);

// warm lights: some windows get a glowstone on the room side (interior cell beside the glass, on the floor slab)
const lit = [];
const glowPlaces = [];

// 1. tower core and crown: solid calcite to its setback top, glazed upper row, smooth crown
for (const [x, z, , roof] of cells) {
  const c = cell.get(key(x, z));
  if (!isTower(c)) continue;
  const T = roof - 1;
  for (let y = 0; y <= T; y++) {
    if (y === 0) g.set(x, y, z, FLOOR);
    else if (y === T) g.set(x, y, z, CROWN);
    else if (y >= 11) g.set(x, y, z, GLASS_UPPER.block);
    else g.set(x, y, z, CORE);
  }
}

// 2. the rest of the footprint: base, floors, shell, roof deck
for (const [x, z] of cells) {
  const c = cell.get(key(x, z));
  if (isTower(c)) continue;
  const T = topOf(x, z);
  const ring = isRing(x, z);
  const annex = isAnnex(c);
  const pier = isPier(x, z);
  const exposure = exposed(x, z);
  for (let y = 0; y <= T; y++) {
    if (y === 0) { g.set(x, y, z, ring ? BASE : FLOOR); continue; }
    if (y === T) { g.set(x, y, z, ring ? CROWN : DECK); continue; }
    // interior floor slabs at each storey line (body only); annex has no storey line
    if (!annex && (y === 3 || y === 6 || y === 9)) { g.set(x, y, z, BAND); continue; }
    if (!ring) continue; // room air behind the glass
    // shell rows: windows (or piers) on the storeys
    const ground = y <= 2;
    if (DOOR.has(key(x, z)) && y <= 2) {
      const side = DOOR.get(key(x, z));
      g.set(x, y, z, "dark_oak_door", {
        facing: "south", half: y === 1 ? "lower" : "upper", hinge: side, open: "false", powered: "false",
      });
      continue;
    }
    if (RECESS_PIER.has(key(x, z)) || pier) { g.set(x, y, z, PIER); continue; }
    const glass = ground ? GLASS_SHOP.block : GLASS_UPPER.block;
    g.set(x, y, z, glass);
    // a glowstone in the room behind some windows
    const u = exposure.N || exposure.S ? x : z;
    if (u % 6 === 2 && (annex ? y === 1 : y === 4)) glowPlaces.push([x, y, z]);
  }
}

// 3. the room-side glow: the neighbouring interior cell (in plan) for each chosen window
for (const [x, y, z] of glowPlaces) {
  const e = exposed(x, z);
  const [nx, nz] = e.N ? [x, z + 1] : e.S ? [x, z - 1] : e.W ? [x + 1, z] : [x - 1, z];
  if (!inFP(nx, nz) || isRing(nx, nz) || isTower(cell.get(key(nx, nz)))) continue;
  g.set(nx, y, nz, "glowstone");
  lit.push([nx, y, nz]);
}

// 4. the lobby behind the doors, lit; roof plant on the deck
for (const [x, z] of [[5, 13], [6, 13]]) g.set(x, 1, z, "glowstone");
for (const [x, z] of [[2, 10], [3, 10]]) g.set(x, 11, z, "copper_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC61386.nbt";
const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, palette ${res.palette}, glow ${lit.length}`);

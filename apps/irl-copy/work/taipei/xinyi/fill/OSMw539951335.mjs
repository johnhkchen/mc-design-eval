import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951335";
const W = 22, H = 23, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(key(x, z), gr);

// Lowest ground sets the datum; roof sits 11 blocks above it.
const L = Math.min(...cells.map(c => c[2]));
const ROOF = L + 11;   // roof deck
const PAR = ROOF + 1;  // parapet course

// Palette: 1980s-90s Taipei commercial block, white tiled wall, blue-glass bands.
const WALL = "white_concrete";
const BASE = "stone_bricks";
const FOUND = "stone";
const BAND = "light_gray_concrete";
const ROOFM = "smooth_stone";
const WIN = "light_blue_stained_glass";
const SHOP = "glass";
const PILLAR = "light_gray_concrete";
const AWN = "dark_oak_slab";
const EQUIP = "light_gray_concrete";
const LIGHT = "shroomlight";

const DIRS = [
  { f: "north", dx: 0, dz: -1 },
  { f: "south", dx: 0, dz: 1 },
  { f: "west", dx: -1, dz: 0 },
  { f: "east", dx: 1, dz: 0 },
];

// Outward-facing sides of a perimeter cell.
function outs(x, z) {
  return DIRS.filter(d => !occ.has(key(x + d.dx, z + d.dz))).map(d => ({
    ...d,
    idx: d.dx !== 0 ? z : x,           // position along the face
    ix: x - d.dx, iz: z - d.dz,        // inward neighbour cell
  }));
}

// Door on the south face, centred on that face's span.
let doorX = null, doorZ = null;
{
  const south = cells.filter(([x, z]) => outs(x, z).some(d => d.f === "south"));
  if (south.length) {
    const xs = south.map(c => c[0]);
    doorX = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
    doorZ = Math.max(...south.map(c => c[1]));
    // ensure the chosen door cell really is on the south face
    if (!south.some(c => c[0] === doorX && c[1] === doorZ)) {
      const cand = south.find(c => c[0] === doorX) ?? south[0];
      doorX = cand[0]; doorZ = cand[1];
    }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const ring = outs(x, z);
  const isRing = ring.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, isRing ? BASE : FOUND);

  // Body above ground.
  for (let y = gr + 1; y <= ROOF; y++) {
    // Floor slabs and roof deck, every cell (interior too).
    if (y === ROOF) { put(x, y, z, ROOFM); continue; }
    if (y === L + 5) { put(x, y, z, BAND); continue; }

    if (!isRing) continue; // interior stays air behind the glass

    // Ring (facade) cells.
    if (y === L + 1) { put(x, y, z, BASE); continue; }

    // Ground storey: shopfront, pillars, awning band, entrance.
    if (y >= L + 2 && y <= L + 4) {
      if (y === L + 4) { put(x, y, z, AWN, { type: "bottom", waterlogged: "false" }); continue; }

      // Entrance door on the south face (two blocks tall).
      if (x === doorX && z === doorZ && (y === L + 2 || y === L + 3)) {
        put(x, y, z, "oak_door", {
          facing: "south",
          half: y === L + 2 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      const onPillar = ring.every(d => d.idx % 4 === 0);
      put(x, y, z, onPillar ? PILLAR : SHOP);
      continue;
    }

    // Upper storey: window grid with frame bands.
    if (y >= L + 6 && y <= L + 10) {
      if (y === L + 6 || y === L + 10) { put(x, y, z, WALL); continue; }

      const windowed = ring.some(d => d.idx % 3 !== 0);
      put(x, y, z, windowed ? WIN : WALL);

      // Warm light behind some windows (inside cell next to the glass).
      if (windowed && y === L + 8) {
        const d = ring.find(dd => dd.idx % 3 !== 0 && dd.idx % 6 === 1);
        if (d && occ.has(key(d.ix, d.iz))) put(d.ix, y, d.iz, LIGHT);
      }
      continue;
    }

    // Top of the storey stack below the roof: plain wall.
    put(x, y, z, WALL);
  }

  // Parapet with cornice cap on the perimeter.
  if (isRing) put(x, PAR, z, WALL);

  // Roof equipment: small plant boxes on a grid of interior cells.
  if (!isRing && x % 7 === 3 && z % 7 === 3) {
    put(x, ROOF + 1, z, EQUIP);
    put(x, ROOF + 2, z, EQUIP);
  }
}

g.save(`${DIR}/${ID}.nbt`);

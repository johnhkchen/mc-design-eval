import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988097.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988097.nbt";

const W = 14, H = 23, D = 17;

// Two-storey mid-century (1970s-80s) reinforced-concrete commercial block:
// stone-faced plinth, pale quartz walls with glazed bays and concrete piers,
// stone cornice and parapet, a single shopfront entrance on the street side.

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, g] of cells) fp.set(key(x, z), g);
const inFp = (x, z) => fp.has(key(x, z));

const DIRV = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const ORDER = ["north", "south", "east", "west"];

const outwardDirs = (x, z) =>
  ORDER.filter((d) => !inFp(x + DIRV[d][0], z + DIRV[d][1]));
const perim = (x, z) => inFp(x, z) && outwardDirs(x, z).length > 0;

const maxG = Math.max(...cells.map((c) => c[2]));
const base = maxG + 1;            // first body layer (ground-storey floor)
const ROOF_DECK = base + 8;       // interior roof deck
const PARAPET = base + 9;         // top of the building (about 11 blocks above lowest ground)

// Entrance: perimeter cell nearest the minimum-z edge, closest to footprint centre x.
const cxMean = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let door = null;
for (const [x, z] of cells) {
  if (!perim(x, z)) continue;
  const outs = outwardDirs(x, z);
  const score = z * 100 + Math.abs(x - cxMean) + (outs.includes("north") ? 0 : 0.5);
  if (!door || score < door.score) door = { x, z, score, facing: outs.includes("north") ? "north" : outs[0] };
}

const g = new Voxels([W, H, D]);

// Foundations, base course and ground floor slab.
for (const [x, z] of cells) {
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, base, z, "polished_andesite");
}

// Body: perimeter walls, glazing, piers, cornice, parapet; interior slabs and roof deck.
const pierOrGlass = (x, z) => ((x + z) % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass");

for (const [x, z] of cells) {
  if (perim(x, z)) {
    const isDoor = door && door.x === x && door.z === z;
    for (let y = base + 1; y <= PARAPET; y++) {
      const r = y - base;
      let id;
      if (r === 9) id = "stone_brick_wall";
      else if (r === 4) id = "stone_brick_slab";                       // ground storey cornice
      else if (r === 5) id = "smooth_quartz";                          // upper floor spandrel
      else if (isDoor && (r === 1 || r === 2)) continue;               // door set below
      else if (isDoor && r === 3) id = "smooth_quartz";                // door lintel
      else if (r >= 1 && r <= 3) id = pierOrGlass(x, z);               // shopfront bays
      else if (r >= 6 && r <= 8) id = pierOrGlass(x, z);               // upper windows
      else id = "smooth_quartz";
      g.set(x, y, z, id);
    }
    if (isDoor) {
      const props = { facing: door.facing, hinge: "left", open: "false", powered: "false" };
      g.set(x, base + 1, z, "oak_door", { ...props, half: "lower" });
      g.set(x, base + 2, z, "oak_door", { ...props, half: "upper" });
    }
  } else {
    // Interior: storey slab and roof deck, air between.
    g.set(x, base + 5, z, "light_gray_concrete");
    g.set(x, ROOF_DECK, z, "gray_concrete");
  }
}

// Warm light: glowstone just behind some glazed bays (only where the interior cell is open).
for (const [x, z] of cells) {
  if (!perim(x, z)) continue;
  const outs = outwardDirs(x, z);
  const inward = OPP[outs[0]];
  const ix = x + DIRV[inward][0], iz = z + DIRV[inward][1];
  if (!inFp(ix, iz) || perim(ix, iz)) continue;
  if ((x + z) % 3 === 0) continue;
  if (((x * 5 + z * 7) % 9) === 0) g.set(ix, base + 7, iz, "glowstone");
  else if (((x * 3 + z) % 7) === 0) g.set(ix, base + 2, iz, "glowstone");
}

// Roof equipment on the interior deck: AC plant and a small tank housing.
for (const [x, z] of cells) {
  if (perim(x, z)) continue;
  if (((x * 3 + z * 5) % 7) === 0) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    if ((x + z) % 4 === 0) g.set(x, PARAPET + 1, z, "white_concrete");
  }
}

g.save(OUT);

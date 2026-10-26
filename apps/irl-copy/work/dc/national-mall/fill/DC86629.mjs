import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86629: 1025 Vermont Ave NW. Commercial-Office-Large, 14 x 15 footprint.
// Read as a mid-century (c. 1960s-70s) office block: stone-clad ground storey,
// white precast piers with quartz spandrels, tinted gray glazing, a stone
// parapet, and rooftop mechanical boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86629";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 30, D = 15;
const g = new Voxels([W, H, D]);

const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const PIER = "white_concrete";
const SPAND = "smooth_quartz";
const GLASS = "gray_stained_glass";
const WARM = "glowstone";
const PARAPET = "stone_brick_wall";
const ROOF = "smooth_stone";
const MECH = "light_gray_concrete";
const LINTEL = "smooth_quartz";

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { gr, roof });

const gmin = Math.min(...cells.map(c => c[2]));

// Smooth lidar roof heights with a 3x3 median, then snap to 4-block storey tiers
// measured from the lowest ground, so the roofline reads as flat tiers.
const top = new Map();
for (const [x, z, gr] of cells) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = map.get(key(x + dx, z + dz));
    if (c) vals.push(c.roof);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const tier = gmin + Math.round((med - gmin) / 4) * 4;
  top.set(key(x, z), Math.min(H - 3, Math.max(gr + 4, tier)));
}

const has = (x, z) => map.has(key(x, z));
const faceW = (x, z) => !has(x - 1, z);
const faceE = (x, z) => !has(x + 1, z);
const faceN = (x, z) => !has(x, z - 1);
const faceS = (x, z) => !has(x, z + 1);
const isPerim = (x, z) => faceW(x, z) || faceE(x, z) || faceN(x, z) || faceS(x, z);

// Entrance: on the minimum-z edge, the cell nearest the middle of the width.
const minZ = Math.min(...cells.map(c => c[1]));
const entranceRow = cells.filter(c => c[1] === minZ).map(c => c[0]);
const midX = (Math.min(...entranceRow) + Math.max(...entranceRow)) / 2;
const entranceX = entranceRow.reduce((a, b) => Math.abs(b - midX) < Math.abs(a - midX) ? b : a);
const entrance = key(entranceX, minZ);
const portico = new Set([
  key(entranceX - 1, minZ), key(entranceX, minZ), key(entranceX + 1, minZ),
]);

for (const [x, z, gr] of cells) {
  const k = key(x, z);
  const t = top.get(k);
  const perim = isPerim(x, z);
  const cornerCell = (faceW(x, z) || faceE(x, z)) && (faceN(x, z) || faceS(x, z));
  const along = (faceW(x, z) || faceE(x, z)) ? z : x;
  const isPier = cornerCell || (along % 2 === 0);

  // Foundation, solid up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, FOUND);

  if (perim) {
    for (let y = gr + 1; y <= t; y++) {
      const rel = y - gr;
      let id;
      if (y === t) {
        id = PARAPET;
      } else if (rel === 1) {
        id = BASE;
      } else if (rel % 4 === 0) {
        id = SPAND;
      } else if (rel === 2 || rel === 3) {
        // Ground-storey shopfront with a lintel course above.
        if (isPier) id = PIER;
        else if (rel === 3) id = LINTEL;
        else id = GLASS;
      } else {
        if (isPier) id = PIER;
        else if (rel >= 5 && (x + z + rel) % 9 === 0) id = WARM;
        else id = GLASS;
      }
      // Portico: solid white concrete flanking the door, so the entrance reads.
      if (portico.has(k) && (rel === 2 || rel === 3)) id = PIER;
      g.set(x, y, z, id);
    }

    if (k === entrance) {
      g.set(x, gr + 1, z, "dark_oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 2, z, "dark_oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 3, z, WARM);
      g.set(x, gr + 4, z, SPAND);
    }
  } else {
    // Interior cell: air gap with a floor slab per storey.
    for (let y = gr + 4; y < t; y += 4) g.set(x, y, z, SPAND);
  }

  // Roof surface on every cell.
  g.set(x, t, z, perim ? PARAPET : ROOF);
}

// Rooftop mechanical: one low box on a few interior cells of the top tier.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (isPerim(x, z)) continue;
  if (!((x % 6 === 3) && (z % 6 === 3))) continue;
  const t = top.get(key(x, z));
  if (t + 1 > H - 1) continue;
  g.set(x, t + 1, z, MECH);
}

g.save(`${DIR}/${ID}.nbt`);

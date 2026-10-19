// 650 Fifth Avenue, Pahlavi Foundation Building, 1977 commercial and office building: a 137-block (about 152 m) glass
// office tower on a granite base, with a 24-block office wing at the east end, a 33-block terrace and a 64-block
// annex on the south side, and a mechanical penthouse on the roof. Footprint 40 x 27: x 0 is the Fifth Avenue front
// (the west face), with the entrance in the middle of it (z 9-11) under a granite lintel; z 0 is the cross-street face.
// Storey lines every 3 blocks from y 7: a light-grey spandrel row, then two rows of blue-green tinted glass in an iron
// mullion grid. Glass sits on the outer skin with an air gap behind it and a solid core; a sparse set of panes has
// glowstone behind. Lidar roofs are read as flat tiers (134 tower, 137 penthouse, 64, 33, 24), not followed cell by
// cell. The ground floor has a granite base with shopfront glass. Foundation from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034517.cells.json`, "utf8"));
const X = 40, Y = 149, Z = 27;

const key = (x, y, z) => `${x},${y},${z}`;
const col = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [col(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(col(x, z));
const ground = (x, z) => cell.get(col(x, z)).ground;
const lidar = (x, z) => cell.get(col(x, z)).roof || 24;   // a single lidar gap at (38, 6) sits in the 24 wing

// Flat tiers (block tops above y 0) read from the lidar: a mechanical penthouse at 137 on the tower's middle, the
// 134 tower, a 64 annex, a 33 terrace and the 24 wing. Thresholds sit in the gaps of the lidar histogram.
const rawTop = (x, z) => {
  const l = lidar(x, z);
  if (x >= 4 && x <= 15 && z >= 11 && z <= 16 && l >= 130) return 137;
  if (l >= 100) return 134;
  if (l >= 60) return 64;
  if (l >= 30) return 33;
  return 24;
};
// A low cell boxed in by tower on three sides is lidar noise, not a terrace: it joins the tower.
const TOP = new Map();
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];
for (const [x, z] of cells) {
  const t = rawTop(x, z);
  const tall = NB.filter(([dx, dz]) => inFoot(x + dx, z + dz) && rawTop(x + dx, z + dz) === 134).length;
  TOP.set(col(x, z), t < 134 && tall >= 3 ? 134 : t);
}
const topAt = (x, z) => (inFoot(x, z) ? TOP.get(col(x, z)) : 0);

// The entrance: a recess 2 deep and 4 high in the middle of the Fifth Avenue face, with the granite above it as a lintel.
const vest = (x, y, z) => x <= 1 && z >= 9 && z <= 11 && y <= 3;
const entrance = (x, y, z) => x === 2 && z >= 9 && z <= 11 && y >= 1 && y <= 3;

// Outside the building: above its roof, past the footprint, or in the entrance recess. Foundation and the
// rest of the mass are solid.
const outside = (x, y, z) => !inFoot(x, z) || y >= topAt(x, z) || vest(x, y, z);
const exposed = (x, y, z) => NB.filter(([dx, dz]) => outside(x + dx, y, z + dz));   // [dx, dz] pointing out

const STONE = "polished_granite", TRIM = "calcite", GLASS = "cyan_stained_glass", FRAME = "iron_block";
const SPANDREL = "light_gray_concrete", ROOF = "light_gray_concrete", TERRACE = "moss_block";
const PENT = "gray_concrete", CORE = "gray_concrete", FOUND = "stone_bricks", CANOPY = "smooth_stone";

// The block on one solid cell that has outside on some side, or its cap. A glass pane also names the air cell
// behind it (inward, one block) and whether a warm light sits there.
function skin(x, y, z, top, ex) {
  const corner = ex.length > 1;
  if (y === top - 1) {
    const edge = NB.some(([dx, dz]) => topAt(x + dx, z + dz) < top);
    return { block: edge ? TRIM : top === 33 ? TERRACE : ROOF };
  }
  if (x <= 1 && y === 4 && z >= 8 && z <= 12) return { block: CANOPY };
  if (!ex.length) return { block: CORE };
  if (top === 137) return { block: PENT };
  if (y < 7) {
    if (y === 6) return { block: TRIM };
    if (y >= 1 && y <= 3 && !corner) {
      if (entrance(x, y, z)) return { block: GLASS, air: [x + 1, y, z] };
      const [dx, dz] = ex[0];
      const u = dz !== 0 ? x : z;
      if (u % 3 === 0) return { block: FRAME };
      return { block: GLASS, air: [x - dx, y, z - dz] };
    }
    return { block: STONE };
  }
  if (corner) return { block: FRAME };
  if ((y - 7) % 3 === 0) return { block: SPANDREL };
  const [dx, dz] = ex[0];
  const u = dz !== 0 ? x : z;
  if (u % 3 === 0) return { block: FRAME };
  return { block: GLASS, air: [x - dx, y, z - dz], lamp: (x * 5 + y * 7 + z * 3) % 13 === 0 };
}

const g = new Voxels([X, Y, Z]);
const solid = [];   // every solid cell: x, y, z, top, ground
for (const [x, z] of cells) {
  const top = topAt(x, z), gr = ground(x, z);
  for (let y = 0; y < top; y++) if (!vest(x, y, z)) solid.push([x, y, z, top, gr]);
}

// Pass 1: the air gap behind each glass pane, and which of those carry a warm light.
const air = new Map();
for (const [x, y, z, top, gr] of solid) {
  if (y < gr) continue;
  const ex = exposed(x, y, z);
  if (!ex.length && y !== top - 1) continue;
  const s = skin(x, y, z, top, ex);
  // The air behind a pane is one block in; it never takes a cap row or a cell outside the mass.
  const [ax, ay, az] = s.air ?? [];
  if (s.air && ay < topAt(ax, az) - 1 && !outside(ax, ay, az)) air.set(key(ax, ay, az), s.lamp ?? false);
}

// Pass 2: the skin, a solid core behind it, and the foundation under the ground.
for (const [x, y, z, top, gr] of solid) {
  if (air.has(key(x, y, z))) continue;
  if (y < gr) { g.set(x, y, z, FOUND); continue; }
  g.set(x, y, z, skin(x, y, z, top, exposed(x, y, z)).block);
}
for (const [k, lamp] of air) {
  const [x, y, z] = k.split(",").map(Number);
  if (lamp) g.set(x, y, z, "glowstone");
}

// Lanterns hang from the entrance lintel, and warm light sits in the recess.
g.set(0, 3, 9, "lantern", { hanging: "true", waterlogged: "false" });
g.set(0, 3, 11, "lantern", { hanging: "true", waterlogged: "false" });

const out = `${DIR}/NYC1034517.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries`);

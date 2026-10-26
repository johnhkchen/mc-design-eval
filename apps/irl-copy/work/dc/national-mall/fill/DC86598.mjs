import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86598";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 26, D = 22;
const g = new Voxels([W, H, D]);

// Palette: 1920s Beaux-Arts hotel in pale stone, stone plinth, lighter roof
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const FLOOR = "smooth_quartz";
const BAND = "smooth_quartz";
const SPANDREL = "quartz_block";
const PILLAR = "quartz_pillar";
const GLASS = "cyan_stained_glass_pane";
const CORNICE = "chiseled_quartz_block";
const PARAPET = "smooth_quartz";
const ROOF = "smooth_stone";
const PLANT = "light_gray_concrete";
const WARM = "glowstone";

const key = (x, z) => `${x},${z}`;
const map = new Map(cells.map(c => [key(c[0], c[1]), c]));
const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const info = cells.map(([x, z, gr0, rf0]) => {
  const gr = Math.round(gr0);
  const T = clamp(Math.round(rf0), gr + 6, 22); // roof slab top at T-1, parapet at T, plant above
  return { x, z, gr, T, edge: isEdge(x, z) };
});

// Entrance: middle of the southernmost exterior row
const edgeCells = info.filter(c => c.edge);
const minZ = Math.min(...edgeCells.map(c => c.z));
const row = edgeCells.filter(c => c.z === minZ).sort((a, b) => a.x - b.x);
const door = row[Math.floor(row.length / 2)];

for (const c of info) {
  const { x, z, gr, T, edge } = c;

  // foundation below the lowest ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y <= T - 2; y++) {
    const rel = (y - gr) % 3;
    const isGround = y < gr + 3;

    if (rel === 0) {
      // storey floor line: base course at grade, band line above
      if (edge) g.set(x, y, z, y === gr ? BASE : BAND);
      else g.set(x, y, z, FLOOR);
      continue;
    }

    if (!edge) continue; // interior: air behind the glass

    if (isGround) {
      // shopfront: glass bays between pillars, solid at the sill
      const isPillar = (x + z) % 3 === 0;
      if (rel === 1) g.set(x, y, z, isPillar ? PILLAR : SPANDREL);
      else g.set(x, y, z, isPillar ? PILLAR : GLASS);
    } else {
      // upper storeys: solid spandrel below, one row of window glass, pillars between bays
      const isPillar = (x + z) % 3 === 0;
      if (rel === 1) g.set(x, y, z, SPANDREL);
      else g.set(x, y, z, isPillar ? PILLAR : GLASS);
    }
  }

  // roof slab, cornice, and raised parapet on the perimeter
  if (edge) {
    g.set(x, T - 1, z, CORNICE);
    g.set(x, T, z, PARAPET);
  } else {
    g.set(x, T - 1, z, ROOF);
  }
}

// Warm lights just inside selected upper-storey windows, sitting on interior floor slabs
for (const c of info) {
  if (!c.edge) continue;
  const { x, z, gr, T } = c;
  for (let y = gr + 4; y <= T - 3; y += 3) {
    if ((x + z) % 6 !== 1) continue;
    const sx = x < W / 2 ? 1 : -1;
    const sz = z < D / 2 ? 1 : -1;
    const ix = has(x + sx, z) ? x + sx : x;
    const iz = has(x, z + sz) && ix === x ? z + sz : z;
    if (has(ix, iz) && !isEdge(ix, iz)) g.set(ix, y, iz, WARM);
  }
}

// Entrance: door recessed in the base, flanked by pillars with a lintel band over
{
  const { x, z, gr } = door;
  g.set(x, gr, z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 1, z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  for (const dx of [-1, 1]) {
    if (has(x + dx, z) && isEdge(x + dx, z)) {
      g.set(x + dx, gr + 1, z, PILLAR);
      g.set(x + dx, gr + 2, z, PILLAR);
    }
  }
  for (const dx of [-1, 0, 1]) {
    if (has(x + dx, z) && isEdge(x + dx, z)) g.set(x + dx, gr + 3, z, BAND);
  }
}

// Rooftop plant: screened boxes on interior roof cells
for (const c of info) {
  if (c.edge) continue;
  const { x, z, T } = c;
  if (x % 5 === 2 && z % 5 === 2 && T + 1 <= H - 1) {
    g.set(x, T, z, PLANT);
    g.set(x, T + 1, z, PLANT);
  }
}

g.save(`${DIR}/${ID}.nbt`);

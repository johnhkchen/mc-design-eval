// Way 162814962: a 1960s reinforced-concrete office block with blue-glass curtain bays, one storey of
// shopfront at the base, and stepped tiers from the lidar roof. Storeys are 4 blocks: a floor slab, two rows of
// window, a spandrel. Interiors are air (a gap behind the glass) on a slab per floor; warm lights sit behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814962.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814962.nbt";
const cells = JSON.parse(readFileSync(SRC, "utf8"));   // [x, z, ground, roof] per footprint cell

const g = new Voxels([55, 43, 50]);
const FRAME = "white_concrete", BASE = "stone_bricks", GLASS = "light_blue_stained_glass_pane", ROOF = "light_gray_concrete";
const CAP = "stone_brick_slab", LIGHT = "glowstone", PLANT = "iron_block";

// footprint lookup and the four neighbours
const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const outward = (x, z) => Object.keys(DIR).filter((d) => !inF(x + DIR[d][0], z + DIR[d][1]));

// storey tiers: whole 4-block storeys (min 1), with the rest of the lidar height as parapet (up to 3)
const tierTop = (roof) => Math.max(4, Math.floor(roof / 4) * 4);

// Each edge cell with one outward face takes glass on its window rows. Where an interior cell lies behind it, that
// cell is carved to air (the gap behind the glass, a warm light in some). The footprint is mostly 1-3 cell strips
// with no interior, so there the pane stands on the concrete behind it.
const paneDir = new Map();   // "x,z" -> outward direction, for cells that take glass
const carve = new Set();     // "x,z" -> the interior cell behind a pane (air gap)
for (const [key] of F) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  if (out.length !== 1) continue;
  paneDir.set(key, out[0]);
  const inward = OPP[out[0]];
  const ix = x + DIR[inward][0], iz = z + DIR[inward][1];
  if (!outward(ix, iz).length) carve.add(`${ix},${iz}`);
}

// the entrance: a ground-storey edge cell with one outward face, nearest the middle of the lowest tier
const doorCands = [...paneDir.keys()].filter((k) => F.get(k).roof <= 8);
const door = doorCands.sort((a, b) => {
  const [ax, az] = a.split(",").map(Number), [bx, bz] = b.split(",").map(Number);
  return Math.hypot(ax - 27, az - 25) - Math.hypot(bx - 27, bz - 25);
})[0];
const [dx, dz] = door.split(",").map(Number);
const doorFacing = paneDir.get(door);

for (const [key, { ground, roof }] of F) {
  const [x, z] = key.split(",").map(Number);
  const T = tierTop(roof), p = Math.min(3, roof - T);
  const out = outward(x, z), edge = out.length > 0;
  const pane = paneDir.get(key);
  const alongX = pane === "north" || pane === "south";   // the wall runs east-west

  for (let y = 0; y < T + p; y++) {
    const s = Math.floor(y / 4), yy = y % 4;
    // foundation from y 0 up to this cell's ground
    if (y < ground) { g.set(x, y, z, BASE); continue; }

    // parapet above the roof slab: the outer ring only, capped with a slab
    if (y >= T) {
      if (!edge) continue;
      if (y === T + p - 1) g.set(x, y, z, CAP, { type: "bottom" });
      else g.set(x, y, z, FRAME);
      continue;
    }

    // roof slab: a roof covering inside, the cap on the outer ring when there's no parapet
    if (y === T - 1) {
      if (edge && p === 0) g.set(x, y, z, CAP, { type: "top" });
      else g.set(x, y, z, ROOF);
      continue;
    }

    // floor slab at each storey line; the ground floor's base course on the outer ring
    if (yy === 0) {
      g.set(x, y, z, edge && s === 0 ? BASE : FRAME);
      continue;
    }

    // the door at the entrance, lower and upper halves
    if (key === door && s === 0 && (yy === 1 || yy === 2)) {
      g.set(x, y, z, "iron_door", {
        facing: doorFacing, half: yy === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (!edge) {
      // interior: air, except a warm light just behind a pane
      if (carve.has(key) && yy === 1 && (x + z + s) % 3 === 0) g.set(x, y, z, LIGHT);
      continue;
    }

    if (yy === 3) { g.set(x, y, z, FRAME); continue; }   // spandrel under the next floor line

    // window rows: glass in bays with a mullion every third block (shopfront glass on the ground floor)
    const coord = alongX ? x : z;
    const glazed = pane && (s === 0 || coord % 3 !== 0);
    if (glazed) {
      g.set(x, y, z, GLASS, alongX ? { east: "true", west: "true", north: "false", south: "false" }
                                  : { north: "true", south: "true", east: "false", west: "false" });
    } else {
      g.set(x, y, z, FRAME);
    }
  }

  // rooftop plant on the taller tiers, standing on the roof covering
  if (!edge && T >= 12 && (x * 5 + z * 7) % 17 === 0) g.set(x, T, z, PLANT);
}

const r = g.save(OUT);
console.log(`saved ${OUT}: ${r.blocks} blocks, palette ${r.palette}`);

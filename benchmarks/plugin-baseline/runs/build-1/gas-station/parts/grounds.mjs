// Part "Site and grounds" (parts/grounds.mjs): the street, sidewalk, curb cuts, asphalt, paint, apron, parking,
// verges with birch trees, the back hedge and the two light poles (plan.md SITE, RESERVED, FACADES). Everything here
// stands on the y=0 ground layer or above it; the ground under the lot is grass_block from build.mjs, so the
// surface writes use replace (the earlier ground is ours to repave). Nothing here touches an earlier part's cells.
import {
  asphalt_strip, centre_dashes, curb_cut, parking_stall, birch_tree, hedge_run, light_pole,
  SMOOTH_STONE, COARSE_DIRT, SHORT_GRASS, DANDELION, SITE_SIZE, rng,
} from "../vocab.mjs";

// The sidewalk and apron are smooth stone: a flat set of cells on y=0.
function stone(g, x0, z0, x1, z1, block) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 0, z, block);
}

// A birch like birch_tree, but the crown is clipped to the lot: the east tree at x=40 has its crown past x=41.
function birch(g, x, z) {
  const leaf = { persistent: "true" };
  const put = (px, py, pz, block, state) => {
    if (g.inBounds(px, py, pz)) g.set(px, py, pz, block, state);
  };
  for (let y = 1; y <= 5; y++) put(x, y, z, "birch_log", { axis: "y" });
  for (let y = 4; y <= 6; y++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (!(Math.abs(dx) === 2 && Math.abs(dz) === 2)) put(x + dx, y, z + dz, "birch_leaves", leaf);
  }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(x + dx, 7, z + dz, "birch_leaves", leaf);
}

export function build(g) {
  // Street: asphalt on z0..4, the yellow centre line at z=2 (3 on, 3 off) laid on the asphalt.
  asphalt_strip(g, 0, 0, 41, 4, { replace: true });
  centre_dashes(g, 0, 41, 2);

  // Sidewalk: smooth stone on z5..6 across the whole frontage, then the two curb cuts paved in asphalt.
  stone(g, 0, 5, SITE_SIZE[0] - 1, 6, SMOOTH_STONE);
  curb_cut(g, 7, 14, { over: true });
  curb_cut(g, 27, 34, { over: true });
  // Flush sea lanterns in the cuts' paving (y0, walked over): the IN cut was dark at x12..14 z5 and x13 z6, the OUT cut
  // at x26..28 z5 and x27 z6.
  g.set(12, 0, 6, "sea_lantern");
  g.set(30, 0, 6, "sea_lantern");

  // Forecourt drive (x6..35, z7..23) and the front lane (x1..34, z21..23) are one asphalt field.
  asphalt_strip(g, 6, 7, 35, 23, { replace: true });
  asphalt_strip(g, 1, 21, 34, 23, { replace: true });

  // Store apron: smooth stone paving in front of the storefront (plan APRON 9..32, z21..23).
  stone(g, 9, 21, 32, 23, SMOOTH_STONE);

  // West parking: asphalt on x1..7, z24..33, three stalls whose stripes sit on z23, 26, 29, 32 (nose west).
  asphalt_strip(g, 1, 24, 7, 33, { replace: true });
  parking_stall(g, 1, 23, 26);
  parking_stall(g, 1, 29, 32);

  // Verges: grass stays the base. Coarse dirt patches sit near the trunks (never under one), with short grass and
  // dandelions on the grass cells. Only the west verge x0..5 and the east verge x36..41, z7..20.
  const dirt = [[1, 14], [0, 15], [3, 15], [4, 8], [1, 7], [38, 12], [39, 10], [37, 19]];
  for (const [x, z] of dirt) g.set(x, 0, z, COARSE_DIRT);
  const pick = rng(7);
  for (const [x0, x1] of [[0, 5], [36, 41]]) {
    for (let x = x0; x <= x1; x++) for (let z = 7; z <= 20; z++) {
      if (g.blockAt(x, 0, z) !== "grass_block") continue;
      const r = pick();
      if (r < 0.12) g.set(x, 1, z, SHORT_GRASS);
      else if (r < 0.14) g.set(x, 1, z, DANDELION);
    }
  }

  // Birch trees on the verges (trunks on grass), the east one clipped by the lot edge.
  birch(g, 2, 10);
  birch(g, 2, 17);
  birch(g, 40, 16);

  // Back strip: the hedge along z=36 across the lot (y1..2, persistent leaves).
  hedge_run(g, 0, 41, 36);

  // Light poles at the street-side corners of the lot, on the drive edge.
  light_pole(g, 5, 21);
  light_pole(g, 36, 21);
  // Extra poles where the paths ran dark (block light 0 at feet level): the west end of the sidewalk, and the
  // south-west corner of the parking stalls, out of reach of the two poles above.
  light_pole(g, 3, 7);
  light_pole(g, 0, 30);
}

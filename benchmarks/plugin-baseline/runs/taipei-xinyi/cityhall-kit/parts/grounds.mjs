// Part 5: courtyards and grounds. CN and CS lawns with cross paths, fountain basins and a 10-grid of trees; the small
// courts CNE, CSE, CNW, CSW (tree row, planters, paving); the west apron paving and lamp posts (plan.md ROOFS/RESERVED,
// elements.md P5). Every surface is the grass block layGround laid at groundAt(x, z); paths and paving replace only
// that grass (never air-filled cells or anything an earlier part placed). Courts sit on the GROUND map's height (the
// north block is 1, the south block 2), so the court surface y is that height, not the plan's flat "y 2".
import { groundAt, onFootprint, COURTS, FOUNTAINS, APRON_Z } from "../vocab/base.mjs";
import { tree, fountain, planter, lampPost } from "../vocab.mjs";

const GRASS = "minecraft:grass_block";

/** Lay a surface block on the grass cell of column (x, z); skips air, other blocks and cells off the ground. */
function surface(g, x, z, block, state) {
  const gy = groundAt(x, z);
  if (gy < 0 || !onFootprint(x, z) || !g.inBounds(x, gy, z)) return 0;
  if (g.blockAt(x, gy, z) !== GRASS) return 0;
  g.set(x, gy, z, block, state);
  return 1;
}

/** Paving over a box of columns [x0, x1] x [z0, z1]; `joint` marks cells that get the light-gray joint. */
function paving(g, [x0, x1, z0, z1], joint = () => false) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    n += surface(g, x, z, joint(x, z) ? "light_gray_concrete" : "polished_andesite");
  }
  return n;
}

/** The cell's court surface height, or -1 when the column is not ground. */
const gy = (x, z) => groundAt(x, z);

/** Trees on the 10-grid of a court: the path rows and columns and the fountain basin are skipped. */
function courtTrees(g, xs, zs, skip) {
  let n = 0;
  for (const x of xs) for (const z of zs) {
    if (skip(x, z)) continue;
    const y = gy(x, z);
    if (y < 0 || !onFootprint(x, z)) continue;
    const wood = (x + z) % 3 === 0 ? "jungle" : "oak";
    tree(g, x, y, z, { h: 5 + ((x * z) % 2), wood });
    n++;
  }
  return n;
}

/** Lamp posts at the four corners of a fountain basin, standing on the court lawn outside the rim. */
function fountainLamps(g, [x0, x1, z0, z1]) {
  let n = 0;
  for (const x of [x0 - 2, x1 + 2]) for (const z of [z0 - 2, z1 + 2]) {
    const y = gy(x, z);
    if (y < 0) continue;
    lampPost(g, x, y + 1, z);
    n++;
  }
  return n;
}

/** A court with a cross of 4-wide paths, a fountain at the crossing and a 10-grid of trees (CN and CS). */
function cross(g, court, { pathX, pathZ, zs, xs }) {
  const [x0, x1, z0, z1] = COURTS[court];
  const [fx0, fx1, fz0, fz1] = FOUNTAINS[court];
  // basin sunk 1 below the court surface (plan.md: CS y 1..2 on a surface at 2)
  fountain(g, [fx0, gy(fx0 + 4, fz0 + 4) - 1, fz0, fx1, gy(fx0 + 4, fz0 + 4), fz1], { replace: true });
  let p = 0;
  // cross paths run the full court and stop at the basin rim
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const onX = x >= pathX[0] && x <= pathX[1];
    const onZ = z >= pathZ[0] && z <= pathZ[1];
    if (!(onX || onZ)) continue;
    if (x >= fx0 && x <= fx1 && z >= fz0 && z <= fz1) continue;
    p += surface(g, x, z, "polished_andesite");
  }
  const trees = courtTrees(g, xs, zs, (x, z) =>
    (x >= pathX[0] && x <= pathX[1]) || (z >= pathZ[0] && z <= pathZ[1]) ||
    (x >= fx0 && x <= fx1 && z >= fz0 && z <= fz1));
  const lamps = fountainLamps(g, [fx0, fx1, fz0, fz1]);
  return { paths: p, trees, lamps };
}

export function build(g) {
  const report = {};

  // CN, north courtyard: cross paths x 79..82 and z 84..87; fountain 76..85 x 81..90
  report.CN = cross(g, "CN", {
    pathX: [79, 82], pathZ: [84, 87],
    xs: [61, 71, 81, 91, 101], zs: [60, 70, 80, 90, 100, 110],
  });

  // CS, south courtyard: cross paths x 79..82 and z 281..284; fountain 76..85 x 278..287
  report.CS = cross(g, "CS", {
    pathX: [79, 82], pathZ: [281, 284],
    xs: [61, 71, 81, 91, 101], zs: [257, 267, 277, 287, 297, 307],
  });

  // CNE, NE court: a tree row along z 144 (open to the east slot at z 153..161; nothing else here)
  report.CNE = courtTrees(g, [141, 149, 157, 165, 173], [144], () => false);

  // CNW, NW light court: paving and two trees
  report.CNW = paving(g, [45, 62, 135, 152]);
  report.CNW_trees = courtTrees(g, [50, 58], [140, 148], () => false);

  // CSE, SE court: lawn strip with two planters (lawn keeps the rest)
  report.CSE = 0;
  for (const [x0, x1] of [[141, 146], [166, 171]]) {
    const y = gy(x0, 227);
    if (y >= 0) report.CSE += planter(g, [x0, y + 1, 227, x1, y + 2, 228]).placed;
  }

  // CSW, SW light court: paving with two planters
  report.CSW = paving(g, [45, 62, 225, 232]);
  for (const [x0, x1] of [[48, 53], [56, 61]]) {
    const y = gy(x0, 228);
    if (y >= 0) report.CSW_planters = (report.CSW_planters ?? 0) + planter(g, [x0, y + 1, 228, x1, y + 2, 229]).placed;
  }

  // West apron (x 0..17, outside the portico z 170..207): paving with light-gray joints every 4, lamp posts every 8
  const joint = (x) => x % 4 === 3;
  const [north, south] = APRON_Z;
  report.apron = paving(g, [0, 17, north[0], north[1]], joint) + paving(g, [0, 17, south[0], south[1]], joint);
  for (const z of [163, 210]) for (const x of [2, 10, 16]) {
    const y = gy(x, z);
    if (y >= 0) lampPost(g, x, y + 1, z);
  }

  return report;
}

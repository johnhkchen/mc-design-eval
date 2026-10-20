// NMAI grounds (plan.md PLOT 1: east plaza, pond, grandfather rocks, wetland planting, north walk, birches, base floodlights,
// garden lamps). Ground cells (the course at g) stay writable through runParts, so paths, podzol and paving may replace
// grass there. Everything the building parts own (tiers, lobes, porch) is kept out of every footprint below.
import {
  NMAI_BOX, NMAI_FOOTPRINT, NMAI_GROUND, NMAI_BOULDERS, NMAI_BIRCHES, NMAI_PLAZA, NMAI_POND,
  inEllipse, rng, pond, boulder, birch, meadow, floodlight, lamp_post,
  DIRT_PATH, PODZOL, COARSE_DIRT, SMOOTH_SANDSTONE, CUT_SANDSTONE, SUGAR_CANE, LILY_PAD,
  SHORT_GRASS, TALL_GRASS, LARGE_FERN, AZURE_BLUET, BLUE_ORCHID,
} from "../vocab.mjs";

// the building's own ellipses (T1..T4, the two east lobes) and the porch rectangle under the lobes
const TIERS = [[111, 10, 15, 8], [111, 10, 16, 9], [112, 10, 13, 7], [110, 10, 10, 6], [126, 10, 5, 4], [124, 10, 5, 3]];
const PORCH = { x0: 127, x1: 131, z0: 6, z1: 14 };
const P = NMAI_POND;
const PL = NMAI_PLAZA;

const { x0, z0 } = NMAI_BOX;
const gAt = (x, z) => Number(NMAI_GROUND[z - z0][x - x0]);
const foot = (x, z) => NMAI_FOOTPRINT[z - z0]?.[x - x0] === "#";
const inBuilding = (x, z) =>
  TIERS.some(([cx, cz, rx, rz]) => inEllipse(x, z, cx, cz, rx, rz)) ||
  (x >= PORCH.x0 && x <= PORCH.x1 && z >= PORCH.z0 && z <= PORCH.z1);
const inPlaza = (x, z) => inEllipse(x, z, PL.cx, PL.cz, PL.rx, PL.rz);
const inPond = (x, z) => inEllipse(x, z, P.cx, P.cz, P.rx, P.rz);
const isWalk = (x, z) => z <= 1 || (x >= 134 && x <= 135 && z >= 2 && z <= 4);

export function build(g) {
  const taken = new Set();
  const key = (x, z) => `${x},${z}`;
  const surf = (x, z, block) => { g.set(x, gAt(x, z), z, block); taken.add(key(x, z)); };

  // E18 east plaza: paving at y 1 over the ellipse, cut_sandstone on the edge and mid rings; porch cells left to the shell
  for (let x = PL.cx - PL.rx; x <= PL.cx + PL.rx; x++)
    for (let z = PL.cz - PL.rz; z <= PL.cz + PL.rz; z++) {
      if (!inPlaza(x, z) || (x >= PORCH.x0 && x <= PORCH.x1 && z >= PORCH.z0 && z <= PORCH.z1)) continue;
      const edge = !inEllipse(x, z, PL.cx, PL.cz, PL.rx - 1, PL.rz - 1);
      const mid = inEllipse(x, z, PL.cx, PL.cz, PL.rx / 2, PL.rz / 2) && !inEllipse(x, z, PL.cx, PL.cz, PL.rx / 2 - 1, PL.rz / 2 - 1);
      g.set(x, 1, z, edge || mid ? CUT_SANDSTONE : SMOOTH_SANDSTONE);
      taken.add(key(x, z));
    }

  // E19 pond: water at y 0 on the ground-0 cells, lily pads on the surface, sugar cane on the rim
  const water = [];
  for (let x = P.cx - P.rx; x <= P.cx + P.rx; x++)
    for (let z = P.cz - P.rz; z <= P.cz + P.rz; z++)
      if (inPond(x, z) && gAt(x, z) === 0) water.push([x, z]);
  const lilies = water.filter((_, i) => i % 4 === 1);
  const reeds = [];
  for (let x = P.cx - P.rx - 1; x <= P.cx + P.rx + 1; x++)
    for (let z = P.cz - P.rz - 1; z <= P.cz + P.rz + 1; z++) {
      const rim = inEllipse(x, z, P.cx, P.cz, P.rx + 1, P.rz + 1) && !inEllipse(x, z, P.cx, P.cz, P.rx, P.rz);
      if (rim && gAt(x, z) === 0 && foot(x, z) && !inPlaza(x, z) && (x + z) % 2 === 0) reeds.push([x, 1, z]);
    }
  pond(g, { cx: P.cx, cz: P.cz, rx: P.rx, rz: P.rz, y: 0, where: (x, z) => gAt(x, z) === 0,
    lilies, reeds, replace: true });
  for (const [x, z] of water) taken.add(key(x, z));
  for (const [x, , z] of reeds) taken.add(key(x, z));
  for (const [x, z] of lilies) taken.add(key(x, z));

  // E20 grandfather rocks, on the ground course of their low corner (B2 moved off the porch: see plan Notes)
  // B2 is one row south of the plan's (14 -> 15): its plan cells sit on the porch floor, z 6..14
  const rocks = NMAI_BOULDERS.map((b) => (b.x === 128 && b.z === 14 ? { x: 128, z: 15 } : b));
  for (const { x, z } of rocks) {
    boulder(g, x, z, gAt(x, z));
    for (const dx of [0, 1]) for (const dz of [0, 1]) taken.add(key(x + dx, z + dz));
  }

  // E21 birches (the one at (121, 18) moved to (122, 21), clear of the T2 ring); crowns of radius 2 kept clear of planting
  const trees = NMAI_BIRCHES.map((b) => (b.x === 121 && b.z === 18 ? { x: 122, z: 21 } : b));
  for (const { x, z } of trees) {
    birch(g, x, z, gAt(x, z));
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) taken.add(key(x + dx, z + dz));
  }

  // north walk along the north edge, joining the plaza on its north-west side
  for (let z = 0; z <= 1; z++)
    for (let x = x0; x < x0 + NMAI_GROUND[0].length; x++) if (foot(x, z)) surf(x, z, DIRT_PATH);
  for (let x = 134; x <= 135; x++) for (let z = 2; z <= 4; z++) if (foot(x, z)) surf(x, z, DIRT_PATH);

  // garden lamps on the walk, every 8 cells (nearest walk cell to each target)
  for (const tx of [96, 104, 112, 120, 128]) {
    const x = [0, -1, 1, -2, 2].map((d) => tx + d).find((c) => foot(c, 0) && !taken.has(key(c, 0)));
    if (x === undefined) continue;
    lamp_post(g, x, gAt(x, 0) + 1, 0);
    taken.add(key(x, 0));
  }
  // plaza lamps on the paving
  for (const [x, z] of [[137, 7], [137, 13]]) { lamp_post(g, x, 2, z); taken.add(key(x, z)); }

  // base floodlights: ochre froglight flush in the ground, every 6 cells round the ring one cell out from T1
  const ring = [];
  for (let x = x0; x < x0 + NMAI_GROUND[0].length; x++)
    for (let z = z0; z < z0 + NMAI_GROUND.length; z++) {
      const outer = inEllipse(x, z, 111, 10, 16, 9) && !inEllipse(x, z, 111, 10, 15, 8);
      if (outer && foot(x, z) && !isWalk(x, z) && !inPlaza(x, z) && !(x >= PORCH.x0 && x <= PORCH.x1 && z >= PORCH.z0 && z <= PORCH.z1) && !inPond(x, z))
        ring.push([Math.atan2(z - 10, x - 111), x, z]);
    }
  ring.sort((a, b) => a[0] - b[0]);
  ring.filter((_, i) => i % 6 === 0).forEach(([, x, z]) => {
    if (taken.has(key(x, z))) return;
    floodlight(g, x, gAt(x, z), z, { replace: true });
    taken.add(key(x, z));
  });

  // wetland lamps: a lattice of lamp posts, 8 cells apart, on free ground, so the meadow has no ground-0 spawn cells
  for (let z = 3; z < z0 + NMAI_GROUND.length; z += 8)
    for (let x = 93 + (Math.floor(z / 8) % 2) * 4; x < x0 + NMAI_GROUND[0].length; x += 8) {
      if (!foot(x, z) || inBuilding(x, z) || inPlaza(x, z) || inPond(x, z) || isWalk(x, z) || taken.has(key(x, z))) continue;
      lamp_post(g, x, gAt(x, z) + 1, z);
      taken.add(key(x, z));
    }

  // extra posts for the south-west tail, where the lattice leaves the pond's banks dark
  for (const [x, z] of [[93, 25], [103, 26], [111, 24]]) {
    if (!foot(x, z) || inBuilding(x, z) || inPond(x, z) || taken.has(key(x, z))) continue;
    lamp_post(g, x, gAt(x, z) + 1, z);
    taken.add(key(x, z));
  }

  // E21 wetland planting: podzol and coarse dirt patches on the ground, then meadow plants on the free cells
  const rand = rng(1952);
  const meadowCells = [];
  for (let x = x0; x < x0 + NMAI_GROUND[0].length; x++)
    for (let z = z0; z < z0 + NMAI_GROUND.length; z++) {
      if (!foot(x, z) || inBuilding(x, z) || inPlaza(x, z) || inPond(x, z) || isWalk(x, z) || taken.has(key(x, z))) continue;
      const r = rand();
      if (r < 0.10) { surf(x, z, PODZOL); continue; }
      if (r < 0.16) { surf(x, z, COARSE_DIRT); continue; }
      if (rand() < 0.35) {
        const k = rand();
        const near = inEllipse(x, z, P.cx, P.cz, P.rx + 3, P.rz + 3);
        const block = k < 0.5 ? SHORT_GRASS : k < 0.7 ? TALL_GRASS : k < 0.8 ? LARGE_FERN : k < 0.92 || !near ? AZURE_BLUET : BLUE_ORCHID;
        meadowCells.push([x, gAt(x, z) + 1, z, block]);
        taken.add(key(x, z));
      }
    }
  meadow(g, meadowCells);
}

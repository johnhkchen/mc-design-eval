// P2 great yellow concave hip roof (plan.md ROOFS): the shell from the d-table with the corner upsweep (roof_shell), the
// gray hip ridges and corner flicks with gold tips, the top deck at y 41 with its smooth_stone rim (y 42) and gold corners.
// The south cut-out x 52..99 z 120..141 is left to the portal part (P3). Built with direct generator calls, no roof tool.
import { roof_shell, hip_ridge, corner_flick, ROOF, SMOOTH_STONE, GOLD_BLOCK } from "../vocab.mjs";

const CUT = { x0: 52, x1: 99, z0: 120, z1: 141 };
const DECK = { x0: 40, x1: 111, z0: 40, z1: 111 };

// The concave hip surface by d (plan.md ROOFS table), for the flick wedges that sit on the diagonal.
const surfaceY = (d) => (d <= 2 ? 24 : d <= 5 ? 25 : d <= 8 ? 26 : d <= 11 ? 27 : d <= 13 ? 28 : d <= 15 ? 29 : d <= 17 ? 30 : d <= 19 ? 31 : d <= 21 ? 32 : d <= 29 ? d + 11 : 41);

// Corner diagonals: the corner cell and the unit step inward, as in vocab's CORNERS.
const CORNER = { nw: [10, 10, 1, 1], ne: [141, 10, -1, 1], sw: [10, 141, 1, -1], se: [141, 141, -1, -1] };

function put(g, out, x, y, z, block) {
  if (!g.inBounds(x, y, z)) return;
  if (!g.isAir(x, y, z)) { out.refused.push([x, y, z, block]); return; }
  g.set(x, y, z, block);
  out.placed++;
}

export function build(g) {
  const out = { placed: 0, refused: [] };
  const log = [];

  // 1. the closed shell: concave hip, eave fascia and soffit, tiles every third ring, corner lift, deck to y 41
  const shell = roof_shell(g, { x0: ROOF.x0, x1: ROOF.x1, y0: 23, y1: 41, z0: ROOF.z0, z1: ROOF.z1 }, { skip: CUT });
  log.push(["roof_shell", shell.placed, shell.blocked.length]);

  // 2. top deck rim at d = 30 (y 42), gold at the four corners. Placed before the ridges so the corner gold wins.
  for (let x = DECK.x0; x <= DECK.x1; x++) for (let z = DECK.z0; z <= DECK.z1; z++) {
    const edge = x === DECK.x0 || x === DECK.x1 || z === DECK.z0 || z === DECK.z1;
    if (!edge) continue;
    const corner = (x === DECK.x0 || x === DECK.x1) && (z === DECK.z0 || z === DECK.z1);
    put(g, out, x, 42, z, corner ? GOLD_BLOCK : SMOOTH_STONE);
  }

  // 3. hip ridges on the four diagonals, one block above the surface, corner to deck rim
  for (const c of Object.keys(CORNER)) {
    const r = hip_ridge(g, c);
    log.push([`hip_ridge ${c}`, r.placed?.length ?? r.placed ?? 0, (r.refused ?? []).length]);
  }

  // 4. corner flicks: stairs curl up from y 28 to the gold tip at y 31, each step on a solid wedge so it is supported
  for (const c of Object.keys(CORNER)) {
    const [cx, cz, dx, dz] = CORNER[c];
    for (let k = 0; k < 4; k++) {
      const x = cx + k * dx, z = cz + k * dz;
      const tip = 31 - k;
      const top = k === 0 ? 28 : surfaceY(k); // the corner cell sits on the lifted eave (y 28)
      for (let y = top + 1; y < tip; y++) put(g, out, x, y, z, SMOOTH_STONE);
    }
    const f = corner_flick(g, c);
    log.push([`corner_flick ${c}`, f.placed?.length ?? f.placed ?? 0, (f.refused ?? []).length]);
  }

  for (const [name, placed, refused] of log) console.log(`  roof ${name}: placed ${placed}, refused ${refused}`);
  if (out.refused.length) console.log(`  roof wedges refused ${out.refused.length}: ${JSON.stringify(out.refused.slice(0, 8))}`);
  console.log(`  roof wedges placed ${out.placed}`);
}

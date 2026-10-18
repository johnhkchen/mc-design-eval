// P10 lighting: standing lanterns on the terrace loggias, the decks and the drum ledge; hanging lanterns (on chain
// round the deck hole) under every interior floor and deck. Writes only into air, and only where the lantern has a
// full block to stand on or a solid block above it; anything the plan puts somewhere the shell did not build is
// counted in the skipped list and printed, never forced.
import { standingLantern, hangingLantern } from "../vocab.mjs";

const CX = 31.5, CZ = 31.5;
let skipped = [];
let placed = 0;

function stand(g, x, y, z, tag) {
  const res = standingLantern(g, x, y, z);
  if (res.refused.length) skipped.push(`${tag} stand ${x},${y},${z}: ${res.reason ?? "refused"}`);
  else placed++;
}

// A lantern hung from the block above it (chain cells between, if any); skipped when the cells are not air or
// there is no solid block to hang from.
function hang(g, x, y, z, chain, tag) {
  for (let i = 0; i <= chain; i++) {
    if (!g.isAir(x, y + i, z)) { skipped.push(`${tag} hang ${x},${y},${z}: cell ${y + i} not air`); return; }
  }
  if (g.isAir(x, y + chain + 1, z)) { skipped.push(`${tag} hang ${x},${y},${z}: nothing solid above`); return; }
  hangingLantern(g, x, y, z, chain);
  placed++;
}

// Values lo+3, lo+3+step, ... up to hi-2: a 6-grid kept off the walls.
function grid(lo, hi, step = 6) {
  const out = [];
  for (let v = lo + 3; v <= hi - 2; v += step) out.push(v);
  return out;
}

// Cells with rIn < r <= rOut about the dome axis, in angular order, thinned so consecutive picks are at least
// `gap` cells apart (Euclidean) and the ring closes without a near-pair at the seam.
function ringPick(gap, rIn, rOut) {
  const cells = [];
  for (let x = 0; x < 64; x++) for (let z = 0; z < 64; z++) {
    const r = Math.hypot(x - CX, z - CZ);
    if (r > rIn && r <= rOut) cells.push([x, z, Math.atan2(z - CZ, x - CX)]);
  }
  cells.sort((a, b) => a[2] - b[2]);
  const picked = [];
  for (const c of cells) {
    const last = picked[picked.length - 1];
    if (!last || Math.hypot(c[0] - last[0], c[1] - last[1]) >= gap) picked.push(c);
  }
  if (picked.length > 1) {
    const f = picked[0], l = picked[picked.length - 1];
    if (Math.hypot(l[0] - f[0], l[1] - f[1]) < gap) picked.pop();
  }
  return picked;
}

export function build(g) {
  skipped = [];
  placed = 0;

  // 1. Terrace loggias, y 10: one lantern at each giant column, on the terrace, just behind the column.
  for (const x of [67, 70, 75, 83, 91, 99, 107, 115, 120, 123]) stand(g, x, 10, 3, "portico loggia");   // forward plane
  for (const x of [131, 139]) stand(g, x, 10, 4, "wing loggia");                                        // wing plane
  for (const x of [156, 164]) stand(g, x, 10, 3, "pavilion loggia N");                                  // forward plane
  for (const z of [10, 20]) stand(g, 172, 10, z, "pavilion loggia E");
  const dome = [11, 19, 27, 35, 43, 51];
  for (const x of dome) { stand(g, x, 10, 4, "dome loggia N"); stand(g, x, 10, 59, "dome loggia S"); }
  for (const z of dome) { stand(g, 4, 10, z, "dome loggia W"); stand(g, 59, 10, z, "dome loggia E"); }

  // 2. Decks, lantern 2 cells behind the balustrade.
  for (const x of [131, 137, 143]) stand(g, x, 40, 5, "wing deck");                                     // balustrade z 3
  for (const [x, z] of [[65, 5], [71, 4], [121, 4], [127, 5]]) stand(g, x, 40, z, "portico flank deck"); // flank
  for (let x = 75; x <= 117; x += 6) stand(g, x, 44, 14, "portico central deck");                       // balustrade z 12
  for (const x of [150, 156, 162, 168]) stand(g, x, 43, 4, "pavilion deck N");                          // balustrade z 2
  for (const z of [6, 12, 18, 24]) stand(g, 171, 43, z, "pavilion deck E");                             // balustrade x 173
  for (let x = 7; x <= 55; x += 6) {                                                                    // square deck, y 37
    stand(g, x, 37, 4, "dome deck N"); stand(g, x, 37, 59, "dome deck S");
  }
  for (let z = 7; z <= 55; z += 6) { stand(g, 4, 37, z, "dome deck W"); stand(g, 59, 37, z, "dome deck E"); }

  // 3. Drum ledge, y 41, every ~4 cells round the inner ring 17.5 < r <= 18.5 (the ledge is the solid ring at y 40).
  for (const [x, z] of ringPick(4, 17.5, 18.5)) stand(g, x, 41, z, "drum ledge");

  // 4. Hanging lanterns under each interior floor and deck, on a 6-grid. Each hangs on a chain from the ceiling down to
  // about 3 blocks above the walking floor (a lantern 10 blocks up gives its floor 0 light, so the chain brings it into
  // reach of the feet). Ceiling y = the floor block above the room; walk y = ceiling - 8 for the storeys.
  const hangBelow = (x, ceilY, walkY, z, tag) => hang(g, x, walkY + 3, z, ceilY - walkY - 4, tag);
  // Portico vestibule and ground floors: ceiling = floor at y 9, walk y 2.
  for (const x of grid(65, 126)) for (const z of grid(4, 22)) hangBelow(x, 9, 2, z, "vestibule");
  for (const x of grid(128, 143)) for (const z of grid(5, 22)) hangBelow(x, 9, 2, z, "wing ground");
  for (const x of grid(145, 168)) for (const z of grid(7, 29)) hangBelow(x, 9, 2, z, "pavilion ground");
  // Piano nobile: ceiling = floor at y 21, walk y 10.
  for (const x of grid(65, 126)) for (const z of grid(7, 22)) hangBelow(x, 21, 10, z, "portico piano");
  for (const x of grid(128, 143)) for (const z of grid(8, 22)) hangBelow(x, 21, 10, z, "wing piano");
  for (const x of grid(145, 168)) for (const z of grid(7, 29)) hangBelow(x, 21, 10, z, "pavilion piano");
  // Upper floor: ceiling = floor at y 33, walk y 22.
  for (const x of grid(65, 126)) for (const z of grid(7, 22)) hangBelow(x, 33, 22, z, "portico upper");
  for (const x of grid(128, 143)) for (const z of grid(8, 22)) hangBelow(x, 33, 22, z, "wing upper");
  for (const x of grid(145, 168)) for (const z of grid(7, 29)) hangBelow(x, 33, 22, z, "pavilion upper");
  // Attics (walk y 34): flanks and wing under the deck at y 39; central portico attic under its deck at y 43; pavilion y 42.
  for (const x of grid(65, 72).concat(grid(119, 126))) for (const z of grid(5, 22)) hangBelow(x, 39, 34, z, "portico flank attic");
  for (const x of grid(128, 143)) for (const z of grid(5, 22)) hangBelow(x, 39, 34, z, "wing attic");
  for (const x of grid(73, 118, 6)) for (const z of grid(12, 23)) hangBelow(x, 43, 34, z, "portico central attic");
  for (const x of grid(145, 168)) for (const z of grid(7, 29)) hangBelow(x, 42, 34, z, "pavilion attic");

  // 5. Round the rotunda's deck hole: lanterns on chain under the deck (y 36) at 19 < r <= 20, every 6 cells.
  for (const [x, z] of ringPick(6, 19, 20)) hang(g, x, 34, z, 1, "rotunda deck hole");

  console.log(`lighting: ${placed} lanterns placed, ${skipped.length} skipped`);
  const byTag = {};
  for (const s of skipped) { const tag = s.replace(/ (stand|hang) .*/, ""); byTag[tag] = (byTag[tag] ?? 0) + 1; }
  for (const [tag, n] of Object.entries(byTag)) console.log(`  skipped ${n} x ${tag}`);
}

// Dusk light pass (plan PARTS 6, lamplighter): runs last, so it sees every earlier part's blocks in g.
// It measures light coverage by a Manhattan estimate (a lantern gives 15, one less per block of distance) and adds lamp
// posts only where a walkable cell is left out of reach: deck cells within 6 of a lantern (elements.md), trail cells
// within 7 of one (light 8+, about one lamp every 8 to 10 cells). Writes go only into air, never over an earlier part.
import { DECK, PLOT, onTrail, lampPost } from "../vocab.mjs";

const AIR = "minecraft:air";
const DECK_REACH = 6;
const TRAIL_REACH = 7;

// y of the top solid block in column (x, z), -1 if none (as the vocabulary finds it)
function groundY(g, x, z) {
  for (let y = PLOT[1] - 1; y >= 0; y--) if (!air(g, x, y, z)) return y;
  return -1;
}

function air(g, x, y, z) {
  return g.inBounds(x, y, z) && g.blockAt(x, y, z) === AIR;
}

// Lanterns already in the build: [x, y, z] of every lantern block
function lanterns(g) {
  const out = [];
  for (const c of g.cells.values()) if (c.block === "minecraft:lantern") out.push(c.pos);
  return out;
}

// Light reach from the lanterns: true if some lantern is within `reach` of (x, y, z) by Manhattan distance
function reached(lamps, x, y, z, reach) {
  return lamps.some(([lx, ly, lz]) => Math.abs(lx - x) + Math.abs(ly - y) + Math.abs(lz - z) <= reach);
}

// ---- Deck -----------------------------------------------------------------------------------------------------------
// Walking cells of the deck: air at the walking level over solid deck top. Lanterns under the deck (y < 37) do not light
// it, since the deck top blocks their light, so they are left out of the deck count.
function deckLamps(g) {
  const { x0, x1, z0, z1, topY, walkY } = DECK;
  let added = 0;
  const walk = [];
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (air(g, x, walkY, z) && !air(g, x, topY, z)) walk.push([x, z]);
  // Candidate lamp sites: air at walking level and the cell above it, inset one from the rail, so the lane stays clear
  const sites = [];
  for (let x = x0 + 1; x <= x1 - 1; x++)
    for (let z = z0 + 1; z <= z1 - 1; z++)
      if (air(g, x, walkY, z) && air(g, x, walkY + 1, z) && !air(g, x, topY, z)) sites.push([x, z]);
  const edge = (x, z) => Math.min(x - x0, x1 - x, z - z0, z1 - z);
  for (;;) {
    const lamps = lanterns(g).filter(([, y]) => y >= walkY);
    const dark = walk.filter(([x, z]) => !reached(lamps, x, walkY, z, DECK_REACH));
    if (!dark.length) break;
    let best = null;
    for (const [sx, sz] of sites) {
      if (!air(g, sx, walkY, sz) || !air(g, sx, walkY + 1, sz)) continue;
      const score = dark.filter(([x, z]) => Math.abs(x - sx) + 1 + Math.abs(z - sz) <= DECK_REACH).length;
      if (score === 0) continue;
      // Prefer the rail side (edge cells), so the middle of the deck stays clear
      const key = [score, edge(sx, sz) <= 1 ? 1 : 0];
      if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && key[1] > best.key[1])) best = { sx, sz, key };
    }
    if (!best) break; // nothing can cover the rest; reported below
    g.set(best.sx, walkY, best.sz, "dark_oak_fence", {});
    g.set(best.sx, walkY + 1, best.sz, "lantern", { hanging: "false", waterlogged: "false" });
    added++;
  }
  const left = walk.filter(([x, z]) => !reached(lanterns(g), x, walkY, z, DECK_REACH)).length;
  return { added, left };
}

// ---- Trail ----------------------------------------------------------------------------------------------------------
// Trail columns: the reserved trail, walked at ground + 1. Lamp posts go beside it, never on it (lampPost refuses trail).
function trailLamps(g) {
  let added = 0; // blocks placed
  const cols = [];
  // The walkable floor of the trail and its one-cell border, where a visitor stands. A column counts only if a built
  // trail cell (stone brick on top) lies within one cell of it: an unbuilt reserved column has no stone brick
  const built = (x, z) => {
    if (!onTrail(x, z)) return false;
    const gy = groundY(g, x, z);
    return gy >= 0 && /stone_brick|mossy/.test(g.blockAt(x, gy, z));
  };
  for (let x = 0; x < PLOT[0]; x++)
    for (let z = 0; z < PLOT[2]; z++) {
      let near = false;
      for (let dx = -1; dx <= 1 && !near; dx++) for (let dz = -1; dz <= 1 && !near; dz++) near = built(x + dx, z + dz);
      if (!near) continue;
      const gy = groundY(g, x, z);
      if (gy < 0) continue;
      cols.push([x, gy + 1, z]);
    }
  // Sites: beside the trail 2 to 3 cells off its centre, on the ground, with room for a 4-high post
  const sites = [];
  for (let x = 0; x < PLOT[0]; x++)
    for (let z = 0; z < PLOT[2]; z++) {
      if (onTrail(x, z)) continue;
      const near = cols.some(([tx, , tz]) => Math.abs(tx - x) <= 3 && Math.abs(tz - z) <= 3);
      if (!near) continue;
      const gy = groundY(g, x, z);
      if (gy < 0) continue;
      sites.push([x, gy, z]);
    }
  const tried = new Set();
  for (;;) {
    const lamps = lanterns(g);
    const dark = cols.filter(([x, y, z]) => !reached(lamps, x, y, z, TRAIL_REACH));
    if (!dark.length) break;
    let best = null;
    for (const [sx, gy, sz] of sites) {
      const k = `${sx},${gy},${sz}`;
      if (tried.has(k)) continue;
      // the lamp post is 4 high: its lantern sits 3 above the walking level, so that height counts against the reach
      const score = dark.filter(([x, y, z]) => Math.abs(x - sx) + Math.abs(y - (gy + 4)) + Math.abs(z - sz) <= TRAIL_REACH).length;
      if (score && (!best || score > best.score)) best = { sx, gy, sz, score, k };
    }
    if (!best) break;
    tried.add(best.k);
    // lampPost refuses cells that are not all air, so a failed site is simply tried no more
    added += lampPost(g, best.sx, best.sz, { ground: best.gy });
  }
  const lamps = lanterns(g);
  const left = cols.filter(([x, y, z]) => !reached(lamps, x, y, z, TRAIL_REACH)).length;
  return { added, left };
}

export function build(g) {
  const deck = deckLamps(g);
  const trail = trailLamps(g);
  // Height cap and plot bounds: nothing from any part may stand above y 74 or outside the plot
  let high = 0;
  for (const c of g.cells.values()) if (c.pos[1] > 74 || c.pos[0] >= PLOT[0] || c.pos[2] >= PLOT[2]) high++;
  console.log(`dusk: deck +${deck.added} lamp posts (${deck.left} deck cells still dark); trail +${trail.added} blocks (${trail.left} trail cells still dark); cells over y74 or outside plot: ${high}`);
}

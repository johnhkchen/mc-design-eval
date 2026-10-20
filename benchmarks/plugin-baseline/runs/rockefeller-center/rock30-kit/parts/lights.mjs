// Part 8: Lamplighting and checks. Runs last, so the grid already holds every other part. It finds each column's sky-
// exposed top (the air cell standing on a support, with nothing solid above it up to the cap), and where that open walkable
// cell is more than 6 blocks (3D Manhattan) from any light, it stands a lantern there. A lantern at level 15 lifts every
// cell within 6 to 9 or more, so every deck, terrace and roof reaches light 8 (mobs spawn at 0). Only air is written.
import { LANTERN, inLot, groundLevel, CAP_Y } from "../vocab.mjs";

// Blocks that emit light 15 in 1.21.1 (a lit campfire counts too).
const SOURCES = new Set(["lantern", "shroomlight", "glowstone", "sea_lantern", "jack_o_lantern", "campfire"]);
const REACH = 6; // a lantern at 15 gives 15 - 6 = 9 at this distance; 8 is the floor

// Only a support a player can stand on counts: a full or slab block, not glass, iron bars, panes or lanterns.
const NOT_SUPPORT = /glass|pane|bars|lantern|campfire|torch|banner|rod|azalea|oak_leaves|flower/;
const isAirName = (b) => b === "minecraft:air" || b === "air" || b === "minecraft:cave_air";

export function build(g) {
  const [W, , D] = g.size;
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

  // Light already there: a source with an air face (so it shines out of the building, not into its core).
  const lights = [];
  for (const c of g.cells.values()) {
    const name = c.block.replace(/^minecraft:/, "");
    if (!SOURCES.has(name)) continue;
    if (name === "campfire" && c.state?.lit !== "true") continue;
    const [x, y, z] = c.pos;
    const open = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(([dx,dy,dz]) => isAirName(g.blockAt(x+dx, y+dy, z+dz)));
    if (open) lights.push(c.pos);
  }

  // Walkable cells: air standing on a support, inside the lot, up to the cap. Open-to-sky cells (decks, roofs, the
  // street) come first, so the outdoor terraces are lit before the sealed lobbies and shops behind the glass.
  const open = [], shut = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (!inLot(x, z)) continue;
    for (let y = 1; y <= CAP_Y; y++) {
      if (!isAirName(g.blockAt(x, y, z))) continue;
      const sup = g.get(x, y - 1, z);
      if (!sup || isAirName(sup.block) || NOT_SUPPORT.test(sup.block)) continue;
      let sky = true;
      for (let yy = y + 1; yy <= CAP_Y && sky; yy++) if (!isAirName(g.blockAt(x, yy, z))) sky = false;
      (sky ? open : shut).push([x, y, z]);
    }
  }
  const byLevel = (a, b) => a[1] - b[1] || a[0] - b[0] || a[2] - b[2];
  open.sort(byLevel); shut.sort(byLevel);
  const spots = [...open, ...shut];

  // Greedy cover: a spot already within REACH of a light is lit; any other gets a lantern on it.
  let placed = 0, dark = 0;
  for (const p of spots) {
    if (lights.some((l) => dist(l, p) <= REACH)) continue;
    if (!isAirName(g.blockAt(p[0], p[1], p[2]))) { dark++; continue; }
    g.set(p[0], p[1], p[2], LANTERN, { hanging: "false", waterlogged: "false" });
    lights.push(p);
    placed++;
  }
  console.log(`lights: ${spots.length} open walk cells, ${placed} lanterns placed, ${dark} spots not air`);
}

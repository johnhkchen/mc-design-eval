// Overlooks, terraces and promenade (P4, elements 20-24): the Cliff Walk railing, two timber overlook decks, the seating
// terraces on both banks, freestanding seat walls on the lawn's south edge, the promenade with its planters and benches.
// The ground under these is P1's (heights from heights-data.mjs); terraces cut into it or fill under it so each tier's
// surface sits at its planned y. Only ground (grass, dirt) is cut; P1's paths and walks are left alone.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { overlookDeck, tier, seatWall, bench, planter } from "../vocab.mjs";
import { computeHeights } from "./heights-data.mjs";

const GROUND = new Set(["minecraft:grass_block", "minecraft:dirt"]);
const H = computeHeights();

// Cut the ground above a surface at y over the box (grass and dirt only), and fill under it up to y-1 when the ground
// lies lower, so a tier stands on solid earth. clear = how many air levels above y to keep free (seats, rails).
function grade(g, x0, z0, x1, z1, y, { clear = 3, fill = true } = {}) {
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const top = H[z][x];
    if (fill) for (let yy = top + 1; yy < y; yy++) g.set(x, yy, z, "dirt");
    for (let yy = y; yy <= Math.max(top, y + clear); yy++) {
      if (!g.isAir(x, yy, z) && GROUND.has(g.blockAt(x, yy, z))) g.set(x, yy, z, "air");
    }
  }
}

// A pale path cell step: where a tier's aisle steps up by one, the lower cell gets a bottom slab on its own block.
function aisleStep(g, x0, x1, z, y) {
  for (let x = x0; x <= x1; x++) g.set(x, y, z, ...B.slab("smooth_sandstone", "bottom"));
}

// The Cliff Walk railing on z57: posts every 4 and at the ends, spruce fence between, each piece standing on the
// bluff's own ground (y = ground + 1), with the two overlook gaps left open.
function cliffRail(g, x0, x1, z, gaps) {
  const open = (x) => gaps.some(([a, b]) => x >= a && x <= b);
  const rail = (x) => x >= x0 && x <= x1 && !open(x);
  for (let x = x0; x <= x1; x++) {
    if (open(x)) continue;
    const y = H[z][x] + 1;
    if (!g.isAir(x, y, z)) continue;
    // Two courses (comment v2: a clear timber railing): posts 2 high, a fence rail at each course between them.
    for (const yy of [y, y + 1]) {
      if (!g.isAir(x, yy, z)) continue;
      if ((x - x0) % 4 === 0 || x === x1) g.set(x, yy, z, ...B.log("stripped_spruce", "y"));
      else g.set(x, yy, z, "spruce_fence", { east: String(rail(x + 1)), west: String(rail(x - 1)), north: "false", south: "false", waterlogged: "false" });
    }
  }
}

// One bank of seating terraces: three tiers stepping up toward the promenade, the north edges of tiers 1 and 2 as seat
// walls, a 2-wide aisle (x a..a+1) with half steps where the tiers meet.
function terraceBank(g, x0, x1, aisle) {
  // Curved in plan (comment v2): each tier's front bows north toward the ends (up to 3 blocks), so the bank reads as an
  // amphitheatre looking out to the Bay. The front row of tiers 1 and 2 is a timber bench top: a spruce slab on a
  // calcite riser, half a block over the tier below (the aisle gets smooth sandstone half steps instead). Planters of
  // grasses (calcite boxes) stand at both ends of every tier.
  const cx = (x0 + x1) / 2, hx = (x1 - x0) / 2;
  for (let x = x0; x <= x1; x++) {
    const u = (x - cx) / hx, c = Math.round(3 * u * u), b1 = 99 - c, b2 = 94 - c;
    const runs = [[89, b2 - 1, 7], [b2, b1 - 1, 8], [b1, 102, 9]];
    const inAisle = x === aisle || x === aisle + 1;
    for (const [z0, z1, y] of runs) {
      grade(g, x, z0, x, z1, y);
      for (let z = z0; z <= z1; z++) {
        if (z === z0 && y > 7) {
          g.set(x, y - 1, z, "calcite");
          g.set(x, y, z, ...B.slab(inAisle ? "smooth_sandstone" : "spruce", "bottom"));
        } else g.set(x, y, z, x === x0 || x === x1 || z === z0 ? "calcite" : "light_gray_concrete");
      }
    }
  }
  const bounds = (x) => { const u = (x - cx) / hx, c = Math.round(3 * u * u); return [[89, 93 - c, 7], [94 - c, 98 - c, 8], [99 - c, 102, 9]]; };
  for (let k = 0; k < 3; k++) for (const px of [x0 + 1, x1 - 3]) {
    const cols = [px, px + 1, px + 2].map((x) => bounds(x)[k]);
    const z = Math.max(...cols.map(([z0]) => z0)) + 1;
    if (cols.every(([, z1]) => z + 2 <= z1)) planter(g, px, cols[0][2], z, { size: 3 });
  }
}

export function build(g) {
  // 20. Cliff Walk railing on z57 (gaps at the two overlooks).
  cliffRail(g, 62, 119, 57, [[76, 79], [102, 105]]);

  // 21. Overlook decks, floor y7, benches facing north.
  for (const x0 of [74, 100]) {
    grade(g, x0, 50, x0 + 7, 56, 7, { clear: 2, fill: false });
    overlookDeck(g, x0, 50, { floor: 7, over: false });
  }

  // 22. Seating terraces on the west and east banks.
  terraceBank(g, 57, 77, 64);
  terraceBank(g, 100, 115, 107);

  // 24. Freestanding seat walls on the lawn's south path edge, calcite on the lawn at y8.
  for (const [x0, x1] of [[70, 79], [92, 101], [104, 113]]) seatWall(g, x0, x1, 8, 85, { over: true });

  // 23. Promenade (light paving, calcite edges) at y8; cells already paved by a P1 path are left as they are.
  for (let x = 50; x <= 119; x++) for (let z = 104; z <= 107; z++) {
    const cur = g.blockAt(x, 8, z);
    if (!g.isAir(x, 8, z) && cur !== "minecraft:grass_block") continue;
    g.set(x, 8, z, z === 104 || z === 107 ? "calcite" : "light_gray_concrete");
  }
  // Six benches along the promenade, seats facing the Bay (north).
  for (const x of [62, 74, 84, 98, 108, 116]) bench(g, x, 9, 105, "north");
  // Planter troughs on z103 every 10: calcite ends, a soil cell and grass between.
  for (const x of [62, 72, 82, 92, 102, 112]) {
    if (!g.isAir(x, 9, 103) || !g.isAir(x + 2, 9, 103)) continue;
    g.set(x, 9, 103, "calcite");
    g.set(x + 2, 9, 103, "calcite");
    g.set(x + 1, 9, 103, "dirt");
    g.set(x + 1, 10, 103, "tall_grass", { half: "lower" });
    g.set(x + 1, 11, 103, "tall_grass", { half: "upper" });
  }
}

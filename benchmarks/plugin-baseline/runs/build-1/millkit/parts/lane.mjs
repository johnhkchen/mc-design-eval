// P6 Lane and lights: the lane strip (y 0, x 0..95, z 0..4), the lamp posts on its south edge (z 4), every plot's side
// fences (x 12i and 12i+11) and back fence (z 18), the picket line on z 5 with its gates (the well yard's opening is
// open), the well yard's open side paths, and the porch lanterns hung under each porch roof (y 6, z 8).
// Every write is into air, or onto a ground cell at y 0 for the lane and the open paths, so earlier parts keep their blocks.
import { lane_strip, gate_pair, lamp_post } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|:)(cave_|void_)?air$/;
const GROUND = new Set(["grass_block", "coarse_dirt", "podzol", "rooted_dirt", "dirt", "gravel", "stone"]);
const FENCE = /_fence$/;
const GATE = /_fence_gate$/;
const LAMP_XS = [0, 12, 24, 36, 48, 60, 72, 84, 95];
const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// One entry per plot: wood of the side columns (null: open), picket line wood, gate wood (null: no gate), gap x (open
// yard), back-line wood (null: open). Plots 0-3 are houses (birch pickets, spruce sides), 4 garden, 5 coop run,
// 6 well yard (open sides and back, open picket gap), 7 company store.
const PLOTS = [
  { side: "spruce_fence", picket: "birch_fence", gate: "birch_fence_gate", back: "spruce_fence" },
  { side: "spruce_fence", picket: "birch_fence", gate: "birch_fence_gate", back: "spruce_fence" },
  { side: "spruce_fence", picket: "birch_fence", gate: "birch_fence_gate", back: "spruce_fence" },
  { side: "spruce_fence", picket: "birch_fence", gate: "birch_fence_gate", back: "spruce_fence" },
  { side: "oak_fence", picket: "oak_fence", gate: "oak_fence_gate", back: "oak_fence" },
  { side: "oak_fence", picket: "oak_fence", gate: "oak_fence_gate", back: "oak_fence" },
  { side: null, picket: "oak_fence", gate: null, gap: [77, 78], back: null },
  { side: "oak_fence", picket: "oak_fence", gate: "oak_fence_gate", back: "oak_fence" },
];

// Porch lanterns (hanging, y 6, z 8) under each porch roof: one each side of the door(s).
const PORCH_LANTERNS = [[4, 7], [14, 21], [28, 31], [40, 43], [86, 93]];

export function build(g) {
  const name = (x, y, z) => (g.inBounds(x, y, z) ? g.blockAt(x, y, z).replace(/^minecraft:/, "") : "air");
  const isAir = (x, y, z) => g.inBounds(x, y, z) && AIR.test(g.blockAt(x, y, z));
  const fenceCells = []; // cells of fence this part wrote; their connections are set in one pass at the end

  const fenceAt = (x, y, z, wood) => {
    if (!isAir(x, y, z)) return;
    g.set(x, y, z, wood, { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });
    fenceCells.push([x, y, z]);
  };

  // 1. The lane surface, y 0 (coarse edges, dirt_path ruts, gravel centre), then the lamp posts on its south edge.
  lane_strip(g, 0, 95);
  for (const x of LAMP_XS) {
    lamp_post(g, x, 4);
    for (let y = 1; y <= 3; y++) fenceCells.push([x, y, 4]);
  }

  // 2. Each plot: side columns, picket line with its gate or gap, back line.
  PLOTS.forEach((p, i) => {
    const x0 = 12 * i, x1 = x0 + 11;
    if (p.side) for (let z = 5; z <= 18; z++) for (const x of [x0, x1]) fenceAt(x, 1, z, p.side);
    if (p.back) for (let x = x0 + 1; x <= x0 + 10; x++) fenceAt(x, 1, 18, p.back);
    const gap = p.gap ?? (p.gate ? [x0 + 5, x0 + 6] : []);
    for (let x = x0 + 1; x <= x0 + 10; x++) if (!gap.includes(x)) fenceAt(x, 1, 5, p.picket);
    if (p.gate) gate_pair(g, x0 + 5, 5, p.gate.replace(/_fence_gate$/, ""));
    // Well yard: its open side columns are dirt_path on the ground (y 0), so the path runs through the plot.
    if (!p.side) for (let z = 5; z <= 18; z++) for (const x of [x0, x1]) {
      if (GROUND.has(name(x, 0, z))) g.set(x, 0, z, "dirt_path");
    }
  });

  // 3. Porch lanterns under the porch roofs: hanging from the roof block above, at y 6 over the deck.
  for (const xs of PORCH_LANTERNS) for (const x of xs) {
    if (isAir(x, 6, 8) && !isAir(x, 7, 8)) g.set(x, 6, 8, ...B.lantern(true));
  }

  // 4. Connections: every fence this part wrote joins the fence (or gate, on its east/west side) beside it.
  const link = (x, y, z) => {
    const c = { waterlogged: "false" };
    for (const [s, [dx, dz]] of Object.entries(DIR)) {
      const n = name(x + dx, y, z + dz);
      c[s] = String(FENCE.test(n) || (GATE.test(n) && (s === "east" || s === "west")));
    }
    return c;
  };
  const states = fenceCells
    .filter(([x, y, z]) => FENCE.test(name(x, y, z)))
    .map(([x, y, z]) => [x, y, z, name(x, y, z), link(x, y, z)]);
  for (const [x, y, z, block, state] of states) g.set(x, y, z, block, state);
}

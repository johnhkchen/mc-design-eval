// Outpost play area (P3, elements 11-19): the Fort lookout, the rope net, the climbing log pile, the balance logs, the sand
// pit and play ground patches, the rim boulders, the water runnel, the low timber fence with its gates, and the three
// picnic tables in the meadow. The surface H comes from heights.json (the terrain part's final ground); every helper
// here writes into air above it, so the ground under each structure is the earlier part's, unchanged except where this
// part paints a play-ground or sand surface (the ground laid before runParts stays writable).
import { readFileSync } from "node:fs";
import { carve, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { rng, SAND, COARSE_DIRT, GRAVEL, GRASS_BLOCK, SPRUCE_PLANKS, fortTower, fenceNet, logPile, balanceLog, boulder, runnel, lowFence, picnicTable } from "../vocab.mjs";

const HEIGHTS = JSON.parse(readFileSync(new URL("../heights.json", import.meta.url), "utf8"));
const top = (x, z) => HEIGHTS[z][x];

// Fence runs: a line of posts whose height follows the ground, so each run of equal H gets its own lowFence at H+1.
function fenceLine(g, axis, fixed, a0, a1, gates) {
  const at = (a) => (axis === "x" ? [a, fixed] : [fixed, a]);
  let start = a0;
  for (let a = a0 + 1; a <= a1 + 1; a++) {
    if (a <= a1 && top(...at(a)) === top(...at(start))) continue;
    const [x0, z0] = at(start), [x1, z1] = at(a - 1);
    const runGates = gates.filter(([gx, gz]) => (axis === "x" ? gz === fixed && gx >= x0 && gx <= x1 : gx === fixed && gz >= z0 && gz <= z1));
    lowFence(g, x0, z0, x1, z1, top(x0, z0) + 1, { gates: runGates });
    start = a;
  }
}

export function build(g) {
  // Fort lookout on the mound at 4: the footprint is raised one block where the ground is 3, so the posts stand on
  // ground (the plan's posts run 4..15). The ladder backs onto planks at the entry's west cell, and the entry is the east cell.
  for (let z = 28; z <= 33; z++) for (let x = 80; x <= 85; x++) if (top(x, z) < 4) g.set(x, 4, z, GRASS_BLOCK);
  fortTower(g, 80, 28, 4);
  for (let y = 4; y <= 6; y++) g.set(82, y, 28, SPRUCE_PLANKS);
  for (let y = 13; y <= 15; y++) for (let z = 30; z <= 31; z++) for (let x = 82; x <= 83; x++) g.set(x, y, z, SPRUCE_PLANKS);
  fenceNet(g, 80, 34, 85, 35, { yLow: 5, yNorth: 11, ySouth: 8 });

  // Climbing log pile on the h4 mound: the bottom layer sits on the surface, so it starts at surface + 1.
  logPile(g, 100, top(100, 28) + 1, 28, { size: 8, layers: 5 });

  // Balance logs: five stripped oak beams crisscrossed at ground + 1 (each beam takes the highest ground under it).
  const beams = [
    [70, 35, 6, "x"], [77, 34, 5, "z"], [71, 38, 6, "x"], [73, 40, 6, "x"], [79, 36, 4, "z"],
  ];
  for (const [x, z, len, axis] of beams) {
    let h = 0;
    for (let i = 0; i < len; i++) h = Math.max(h, axis === "x" ? top(x + i, z) : top(x, z + i));
    balanceLog(g, x, z, len, axis, { y: h + 1 });
  }

  // Sand pit: sand surface (x92..99 z21..27).
  for (let z = 21; z <= 27; z++) for (let x = 92; x <= 99; x++) g.set(x, top(x, z), z, SAND);

  // Play ground: coarse dirt, gravel and sand patches over the outpost, kept off the edges (edge lock).
  const pg = { x0: 68, x1: 117, z0: 20, z1: 42 };
  const rand = rng(31);
  for (let z = pg.z0; z <= pg.z1; z++) for (let x = pg.x0; x <= pg.x1; x++) {
    if (x >= 92 && x <= 99 && z >= 21 && z <= 27) continue;
    // Patches of about 4 x 4 cells, each with a ragged edge.
    const patch = Math.floor((x - pg.x0) / 4) * 31 + Math.floor((z - pg.z0) / 4) * 17;
    const r = rng(patch + 7)();
    const edge = rand();
    if (r < 0.45 && edge < 0.85) g.set(x, top(x, z), z, COARSE_DIRT);
    else if (r < 0.65 && edge < 0.85) g.set(x, top(x, z), z, GRAVEL);
    else if (r < 0.75 && edge < 0.7) g.set(x, top(x, z), z, SAND);
  }

  // Boulders: clusters on the play ground, rim of the sand pit, and clear of the structures.
  const rocks = [
    [72, 24, 1], [84, 22, 1], [104, 22, 2], [116, 26, 1], [112, 33, 1],
    [94, 32, 1], [88, 40, 1], [116, 41, 1],
  ];
  rocks.forEach(([x, z, r], i) => boulder(g, x, z, top(x, z), r, { seed: i + 1 }));

  // Water runnel: stone bed and channel, water at y 3, runs across x 119 into the sister module. Where the mound rises to 4
  // (x 94..99) the ground above the channel is cleared first, so the channel reads open rather than buried under grass.
  for (let z = 36; z <= 40; z++) for (let x = 94; x <= 99; x++) if (top(x, z) > 3) carve(g, [x, 4, z], [x, 4, z]);
  runnel(g, 90, 119, 38, { y: 3, over: true });

  // Low timber fence: z 19 and z 43 (gates at (75,19) (110,19) and (90..92,43)), and x 68 from z 19 to z 43.
  // The lines stop at x 117 (no posts on the sister module's edge), with the toe path left open at x 68 z 44..46.
  fenceLine(g, "x", 19, 68, 117, [[75, 19], [110, 19]]);
  fenceLine(g, "x", 43, 68, 117, [[90, 43], [91, 43], [92, 43]]);
  fenceLine(g, "z", 68, 19, 43, []);


  // More climbing round the Fort (comment v2): a lower second lookout deck east of it joined by a log bridge, with a
  // fence-lattice net up its east side; a hollow log crib tower; and a log scramble of crisscrossed beams.
  const put = (x, y, z, ...b) => { if (g.isAir(x, y, z)) g.set(x, y, z, ...b); };
  const fenceS = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  // Lower lookout: deck y 8 over x 88..91 z 29..33 on four stripped spruce posts, rail at y 9 (open on the bridge side).
  const ld = { x0: 88, x1: 91, z0: 29, z1: 33, y: 8 };
  for (const [x, z] of [[ld.x0, ld.z0], [ld.x1, ld.z0], [ld.x0, ld.z1], [ld.x1, ld.z1]]) for (let y = top(x, z) + 1; y <= ld.y + 1; y++) put(x, y, z, ...B.log("stripped_spruce", "y"));
  for (let z = ld.z0; z <= ld.z1; z++) for (let x = ld.x0; x <= ld.x1; x++) put(x, ld.y, z, "spruce_planks");
  for (let z = ld.z0; z <= ld.z1; z++) for (let x = ld.x0; x <= ld.x1; x++) {
    const edge = x === ld.x0 || x === ld.x1 || z === ld.z0 || z === ld.z1;
    if (edge && !(x === ld.x0 && z >= 31 && z <= 33)) put(x, ld.y + 1, z, "spruce_fence", { ...fenceS, east: String(z === ld.z0 || z === ld.z1), west: String(z === ld.z0 || z === ld.z1), north: String(x === ld.x0 || x === ld.x1), south: String(x === ld.x0 || x === ld.x1) });
  }
  // Log bridge from the Fort's mid platform (y 8, x 85) across x 86..87 at z 32..33: stripped logs along x, fence rails.
  for (let x = 86; x <= 87; x++) { for (const z of [32, 33]) put(x, 8, z, ...B.log("stripped_oak", "x")); put(x, 9, 31, "spruce_fence", { ...fenceS, east: "true", west: "true" }); put(x, 9, 34, "spruce_fence", { ...fenceS, east: "true", west: "true" }); }
  // Net up the deck's east side (x 92), a lattice rising from the ground to the deck.
  for (let z = ld.z0; z <= ld.z1; z++) for (let y = top(92, z) + 1; y <= ld.y; y++) if ((z + y) % 2 === 0) put(92, y, z, "spruce_fence", { ...fenceS, north: "true", south: "true" });
  // Ladder up the deck's south face at x 90 (backed by the deck edge) from the ground to y 8.
  for (let y = top(90, 34) + 1; y <= ld.y - 1; y++) { put(90, y, 33, "spruce_planks"); put(90, y, 34, "ladder", { facing: "south", waterlogged: "false" }); }
  // Log crib tower x 110..115 z 27..32: a hollow square of logs laid log-cabin fashion, 5 courses, axis alternating.
  const cb = { x0: 110, x1: 115, z0: 27, z1: 32 };
  const cy = Math.max(top(cb.x0, cb.z0), top(cb.x1, cb.z1)) + 1;
  for (let k = 0; k < 5; k++) {
    const y = cy + k, alongX = k % 2 === 0;
    for (let x = cb.x0; x <= cb.x1; x++) for (let z = cb.z0; z <= cb.z1; z++) {
      const onX = z === cb.z0 || z === cb.z1, onZ = x === cb.x0 || x === cb.x1;
      if (alongX ? onX : onZ) put(x, y, z, ...B.log(k % 2 ? "spruce" : "stripped_oak", alongX ? "x" : "z"));
    }
  }
  for (let x = cb.x0; x <= cb.x1; x++) for (let z = cb.z0; z <= cb.z1; z++) for (let y = top(x, z) + 1; y < cy; y++) put(x, y, z, "coarse_dirt");
  for (let x = cb.x0 + 1; x < cb.x1; x++) for (let z = cb.z0 + 1; z < cb.z1; z++) put(x, cy + 4, z, "spruce_planks");
  put(cb.x0, cy + 5, cb.z0, "mangrove_roots", { waterlogged: "false" }); put(cb.x1, cy + 5, cb.z1, "mangrove_roots", { waterlogged: "false" });
  // Log scramble x 74..80 z 21..28: beams crisscrossed in two courses, the upper ones resting on the lower.
  const sy = Math.max(...[[74, 21], [80, 28], [77, 24]].map(([x, z]) => top(x, z))) + 1;
  for (let x = 74; x <= 80; x++) { put(x, sy, 22, ...B.log("stripped_oak", "x")); put(x, sy, 26, ...B.log("stripped_oak", "x")); }
  for (let z = 22; z <= 26; z++) { put(75, sy + 1, z, ...B.log("spruce", "z")); put(79, sy + 1, z, ...B.log("spruce", "z")); }
  for (let x = 75; x <= 79; x++) put(x, sy + 2, 24, ...B.log("stripped_oak", "x"));
  for (const [x, z] of [[75, 24], [79, 24]]) put(x, sy, z, ...B.log("stripped_spruce", "y")), put(x, sy + 1, z, ...B.log("stripped_spruce", "y"));
  // Extra tuff and stone boulders in the play ground.
  [[87, 25, 1], [101, 38, 1], [70, 30, 1], [108, 40, 1], [96, 34, 1]].forEach(([x, z, r], i) => boulder(g, x, z, top(x, z), r, { seed: 20 + i }));

  // Picnic tables in the meadow (the first air level above the ground).
  for (const [x, z] of [[54, 24], [62, 30], [56, 40]]) picnicTable(g, x, top(x, z) + 1, z, { axis: "x" });
}

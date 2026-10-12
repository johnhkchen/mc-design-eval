// Part 1, Massing and shell: ground, street, main ground storey, floors, stairs, partitions, jettied upper storey,
// gable frames, bakehouse wing walls. Every opening and RESERVED cell of plan.md is left unset.
import {
  masonryWall, fachwerkWall, postRun, beamRun, gableFrame, stairHousing, scatterBlend,
} from "../vocab.mjs";

const put = (g, x, y, z, block, state = {}) => { if (g.isAir(x, y, z)) g.set(x, y, z, block, state); };
const fillAir = (g, x0, y0, z0, x1, y1, z1, block, state, skip = () => false) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) if (!skip(x, y, z)) put(g, x, y, z, block, state);
};
// a cobbled_deepslate wall run with openings [a0,a1,ya,yb] left unset
function stoneWall(g, axis, fixed, a0, a1, y0, y1, openings) {
  for (let a = a0; a <= a1; a++) for (let y = y0; y <= y1; y++) {
    if (openings.some(([p, q, ya, yb]) => a >= p && a <= q && y >= ya && y <= yb)) continue;
    const [x, z] = axis === "x" ? [a, fixed] : [fixed, a];
    put(g, x, y, z, "cobbled_deepslate");
  }
}
// a daub-and-post partition along x at z, x0..x1, y0..y1, posts at `posts`, opening [xa,xb,ya,yb] left unset
function partition(g, z, x0, x1, y0, y1, posts, [oa, ob, oya, oyb]) {
  for (const p of posts) postRun(g, p, y0, y1, z);
  fillAir(g, x0, y0, z, x1, y1, z, "white_wool", {}, (x, y) => x >= oa && x <= ob && y >= oya && y <= oyb);
}

export function build(g) {
  // ---- street, kerb, sidewalk (ground row y=0)
  g.fill([0, 0, 0], [23, 0, 2], "gravel");
  g.fill([0, 0, 3], [23, 0, 3], "cobbled_deepslate");
  scatterBlend(g, 0, 23, 0, 4, 7, "cobblestone", "mossy_cobblestone", 0.15);

  // ---- floors (stairs and walls come after, so the planks sit under them)
  fillAir(g, 7, 1, 10, 15, 1, 21, "spruce_planks");
  fillAir(g, 18, 1, 14, 20, 1, 21, "cobbled_deepslate");
  fillAir(g, 7, 6, 9, 15, 6, 21, "spruce_planks", {}, (x, y, z) => x <= 8 && z >= 14 && z <= 17);
  fillAir(g, 7, 11, 9, 15, 11, 21, "spruce_planks", {}, (x, y, z) => x === 10 && z >= 16 && z <= 18);

  // ---- stair housing: 5 steps rising north from (7..8, 2, 18) to y=6 at z=14, rails at y=7
  stairHousing(g, 7, 2, 18, 5);

  // ---- attic stair: a flight rising south along x=10 from (10,7,15) to (10,10,18); the loft floor is open over its
  // last three steps, (10,11,16..18), for headroom, so the top step is the floor of that shaft. Planks fill under each
  // step. Walk-checkable, and the stairwell rail at x=9 stays clear.
  for (let i = 0; i < 4; i++) {
    const z = 15 + i, top = 7 + i;
    put(g, 10, top, z, "spruce_stairs", { facing: "south", half: "bottom" });
    for (let y = 7; y < top; y++) put(g, 10, y, z, "spruce_planks");
  }

  // ---- main ground storey (y=1 plinth, 2..4 bricks, lintel y=5)
  masonryWall(g, "x", 9, 6, 16, 1, 4, { piers: [6, 16], openings: [[10, 12, 2, 4], [7, 9, 3, 4], [13, 15, 3, 4]] });
  postRun(g, 10, 2, 4, 9); postRun(g, 12, 2, 4, 9);
  masonryWall(g, "x", 22, 6, 16, 1, 4, { piers: [6, 16], openings: [[8, 8, 2, 3], [13, 14, 3, 4]] });
  masonryWall(g, "z", 6, 9, 22, 1, 4, { piers: [9, 22], openings: [[11, 12, 3, 4], [17, 18, 3, 4]] });
  masonryWall(g, "z", 16, 9, 22, 1, 4, { piers: [9, 22], openings: [[10, 11, 3, 4], [15, 15, 2, 3]] });
  beamRun(g, "x", 6, 16, 9, 5); beamRun(g, "x", 6, 16, 22, 5);
  beamRun(g, "z", 9, 22, 6, 5); beamRun(g, "z", 9, 22, 16, 5);

  // ---- partitions
  partition(g, 16, 9, 15, 2, 5, [9, 13, 15], [11, 12, 2, 3]);
  partition(g, 14, 9, 15, 7, 10, [9, 13, 15], [11, 12, 7, 8]);
  beamRun(g, "x", 9, 15, 14, 10);

  // ---- jettied half-timber upper storey
  fachwerkWall(g, "x", 8, 6, 16, 6, 10, [6, 8, 11, 14, 16], [[9, 10, 8, 9], [12, 13, 8, 9]], [0, 3]);
  const side = [[11, 12, 8, 9], [16, 17, 8, 9]];
  const sidePosts = [8, 10, 13, 15, 18, 20, 22];
  fachwerkWall(g, "z", 6, 8, 22, 6, 10, sidePosts, side, [0, 2, 4, 5]);
  fachwerkWall(g, "z", 16, 8, 22, 6, 10, sidePosts, side, [0, 2, 4, 5]);
  fachwerkWall(g, "x", 22, 6, 16, 6, 10, [6, 8, 11, 14, 16], [[9, 10, 8, 9], [12, 13, 8, 9]], []);

  // ---- gable frames (loft door and hoist cells stay unset)
  gableFrame(g, 8, { skip: ["11,15,8", "11,16,8"] });
  gableFrame(g, 22, { skip: ["11,15,22", "11,16,22"] });

  // ---- bakehouse wing
  stoneWall(g, "x", 13, 17, 21, 1, 5, [[19, 19, 3, 4]]);
  stoneWall(g, "x", 22, 17, 21, 1, 5, [[19, 19, 2, 3]]);
  stoneWall(g, "z", 21, 14, 21, 1, 5, [[17, 17, 2, 3], [15, 15, 3, 4], [20, 20, 3, 4]]);
  stoneWall(g, "z", 17, 14, 21, 1, 5, [[15, 15, 2, 3]]);
  postRun(g, 21, 1, 5, 13); postRun(g, 21, 1, 5, 22);
  beamRun(g, "x", 17, 21, 13, 5); beamRun(g, "x", 17, 21, 22, 5); beamRun(g, "z", 14, 21, 21, 5);
  // gable end y=6..7: daub with a king post and the vent cell left unset
  fillAir(g, 17, 6, 13, 21, 6, 13, "white_wool", {}, (x) => x === 19);
  fillAir(g, 18, 7, 13, 20, 7, 13, "white_wool", {}, (x) => x === 19);
  put(g, 19, 6, 13, "stripped_spruce_log", { axis: "y" });
}

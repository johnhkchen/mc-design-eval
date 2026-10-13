// Part: mansion shell. Brick base, white walls with quartz courses, floors, partitions, doorways, openings (air), pilasters, vault cove.
import { B, carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { vaultCove, CHIMNEYS } from "../vocab.mjs";

const WALL = "white_concrete", Q = "smooth_quartz";
const STACKS = CHIMNEYS.map(([x, z]) => [x, z, x + 1, z + 1]);

export function build(g) {
  const fill = (a, b, blk) => g.fill(a, b, blk);
  const open = (x0, y0, z0, x1, y1, z1) => carve(g, [x0, y0, z0], [x1, y1, z1]);
  const pa = (x0, z0, x1, z1) => ({ x0, z0, x1, z1 });
  // a chimney stack stands solid through the rooms (brick), its cells taken from the floor slabs
  const hole = (y) => { for (const [x0, z0, x1, z1] of STACKS) fill([x0, y, z0], [x1, y, z1], "bricks"); };

  // ---- brick base y0..2 (plinth under gallery + main block; wing; rear porch base)
  fill([25, 0, 35], [70, 2, 61], "bricks");
  fill([37, 0, 62], [58, 2, 75], "bricks");
  fill([37, 0, 76], [58, 2, 79], "bricks");
  // arched vents on the north face, one per window bay
  for (const x of [28, 34, 40, 54, 60, 66]) {
    g.set(x, 1, 35, "iron_bars");
    for (const dx of [-1, 0, 1]) g.set(x + dx, 2, 35, ...B.stairs("brick", "south", "top"));
  }

  // ---- outer walls y3..17: a ring of wall only. The rooms' air is left unwritten, so the room parts can furnish it (an air
  // write here would be claimed by the shell and refused to every later part).
  const box = (x0, z0, x1, z1) => {
    fill([x0, 3, z0], [x1, 17, z0], WALL); fill([x0, 3, z1], [x1, 17, z1], WALL);
    fill([x0, 3, z0], [x0, 17, z1], WALL); fill([x1, 3, z0], [x1, 17, z1], WALL);
  };
  box(26, 42, 69, 61);
  box(37, 61, 58, 75);
  // main interior was just carved at z61 wing overlap: restore the shared wall z61
  fill([37, 3, 61], [58, 17, 61], WALL);
  // courses on all outer faces: y3, y10 string, y17 plate
  for (const y of [3, 10, 17]) {
    const ring = (x0, z0, x1, z1, skipZ61 = false) => {
      fill([x0, y, z0], [x1, y, z0], Q); fill([x0, y, z1], [x1, y, z1], Q);
      fill([x0, y, z0], [x0, y, z1], Q); fill([x1, y, z0], [x1, y, z1], Q);
    };
    ring(26, 42, 69, 61);
    ring(37, 62, 58, 75);
  }
  fill([38, 10, 61], [57, 10, 61], WALL); // inside the wing the shared wall keeps no outer course

  // ---- floors and ceilings (chimney stacks stay open)
  const slab = (y, x0, z0, x1, z1, blk) => { fill([x0, y, z0], [x1, y, z1], blk); };
  slab(3, 27, 43, 68, 60, "spruce_planks");
  slab(3, 45, 43, 50, 60, Q);
  slab(3, 38, 62, 57, 74, "spruce_planks");
  slab(10, 27, 43, 68, 60, "oak_planks");
  slab(10, 45, 43, 50, 49, Q);
  slab(10, 51, 51, 51, 52, "oak_planks");
  slab(10, 48, 62, 57, 74, "oak_planks");
  slab(17, 27, 43, 68, 60, WALL);
  slab(17, 38, 62, 57, 74, WALL);
  // P-stair: upper floor open over the stair well (x45..50 z50..59)
  open(45, 10, 50, 50, 10, 59);
  for (const y of [3, 10, 17]) hole(y);

  // ---- partitions
  const px = (x, z0, z1, y0, y1) => fill([x, y0, z0], [x, y1, z1], WALL);
  const pz = (z, x0, x1, y0, y1) => fill([x0, y0, z], [x1, y1, z], WALL);
  for (const [y0, y1] of [[4, 9], [11, 16]]) {
    px(44, 43, 60, y0, y1); px(51, 43, 60, y0, y1); // hall walls
    pz(50, 27, 43, y0, y1); pz(50, 52, 68, y0, y1);
    pz(53, 27, 43, y0, y1); pz(53, 52, 68, y0, y1);
  }
  // ground rear: stack walls x33..34 and x61..62, x38, pantry/powder
  for (const x of [33, 34, 61, 62]) { px(x, 54, 60, 4, 9); }
  px(38, 54, 60, 4, 9);
  // upper
  px(36, 43, 49, 11, 16); px(64, 43, 49, 11, 16); // bedroom 2|3, master|bath
  px(39, 54, 60, 11, 16); // bedroom 4 | west bath
  px(54, 54, 60, 11, 16); // passage | bedroom 5
  for (const x of [61, 62]) px(x, 54, 60, 11, 16);
  // wing upper
  px(50, 63, 74, 11, 16); pz(63, 51, 57, 11, 16); pz(69, 51, 57, 11, 16);
  // stacks stay solid brick (partitions may have crossed them)
  for (const [x0, z0, x1, z1] of STACKS) fill([x0, 4, z0], [x1, 16, z1], "bricks");

  // ---- interior doorways (air)
  open(44, 4, 46, 44, 6, 47); open(44, 4, 51, 44, 6, 52); open(51, 4, 46, 51, 6, 47); open(51, 4, 51, 51, 6, 52);
  open(44, 11, 46, 44, 13, 47); open(44, 11, 51, 44, 13, 52); open(51, 11, 46, 51, 13, 47); open(51, 11, 51, 51, 13, 52);
  // corridor -> front rooms (z50), ground and upper
  for (const [y0, y1] of [[4, 6], [11, 13]]) {
    for (const x of [29, 40, 54, 66]) open(x, y0, 50, x + 1, y1, 50);
    for (const x of [29]) open(x, y0, 53, x + 1, y1, 53); // guest bedroom / bedroom 4
    open(36, y0, 53, 36, y1, 53);
    open(41, y0, 53, 42, y1, 53);
    open(56, y0, 53, 56, y1, 53);
    open(65, y0, 53, 66, y1, 53);
  }
  open(36, 11, 53, 36, 13, 53); open(41, 11, 53, 42, 13, 53); // west bath (x40..43) door
  open(52, 11, 53, 54, 13, 53); // upper passage to the wing
  open(64, 11, 46, 64, 13, 47); // master | bath
  open(50, 11, 66, 50, 13, 66); open(50, 11, 72, 50, 13, 72); // wing bedrooms
  // wing and shared wall z61
  open(45, 4, 61, 50, 9, 61); open(39, 4, 61, 43, 9, 61); open(52, 4, 61, 55, 6, 61); open(52, 11, 61, 53, 13, 61);

  // ---- exterior openings (air)
  for (const x of [28, 34, 40, 54, 60, 66]) { open(x, 4, 42, x + 1, 8, 42); open(x, 11, 42, x + 1, 15, 42); }
  open(45, 4, 42, 50, 9, 42); open(45, 11, 42, 50, 15, 42);
  for (const x of [26, 69]) {
    for (const z of [45, 58]) { open(x, 5, z, x, 8, z + 1); open(x, 12, z, x, 15, z + 1); }
    open(x, 4, 51, x, 8, 52); open(x, 12, 51, x, 15, 52);
  }
  for (const x of [29, 33, 61, 65]) { open(x, 5, 61, x + 1, 8, 61); open(x, 12, 61, x + 1, 15, 61); }
  for (const z of [65, 70]) {
    open(37, 5, z, 37, 12, z + 1);
    open(58, 5, z, 58, 8, z + 1); open(58, 12, z, 58, 15, z + 1);
  }
  open(40, 5, 75, 45, 12, 75); open(42, 13, 75, 43, 15, 75);
  for (const x of [50, 54]) { open(x, 5, 75, x + 1, 8, 75); open(x, 12, 75, x + 1, 15, 75); }
  open(47, 4, 75, 48, 8, 75);

  // ---- corner pilasters in the wall plane
  for (const [x, z] of [[26, 42], [69, 42], [26, 61], [69, 61], [37, 75], [58, 75]])
    for (let y = 3; y <= 17; y++) g.set(x, y, z, ...B.pillar("quartz_pillar", "y"));

  // ---- living room cove (full ceiling y17 already laid, so the cove only adds the stepped stairs)
  vaultCove(g, 38, 47, 62, 74, 15);
}

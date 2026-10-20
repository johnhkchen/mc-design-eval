// Part 1, West shell (plan.md PARTS 1): podium, hollow marble walls round the union of spine, pavilions and central
// block, rotunda partitions, door recesses and niche panels. Pilasters, cornice, coping, roofs and lights are other parts'.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { recessDoor, nichePanel } from "../vocab.mjs";
import { WEST } from "../vocab/base.mjs";

const boxes = [WEST.spine, WEST.pavilionW, WEST.pavilionE];
// terrace and portico podium blocks, solid to y 3 (plan masses)
const podia = [[28, 72, 7, 8], [28, 72, 31, 32], [42, 58, 3, 8], [42, 58, 31, 36]];
// niche panels on the pavilion end faces: [x0, x1, face, wall z]
const niches = [[16, 20, "north", 1], [16, 20, "south", 38], [80, 84, "north", 1], [80, 84, "south", 38]];

const inFoot = (x, z) => boxes.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1);
const inNiche = (x, y, z) => y >= 4 && y <= 10 && niches.some(([a, b, , w]) => z === w && x >= a - 1 && x <= b + 1);

export function build(g) {
  const col = (x, z, y0, y1, block, state) => { for (let y = y0; y <= y1; y++) g.set(x, y, z, block, state); };
  const floor = (x, z) => { col(x, z, 0, 2, "polished_granite"); g.set(x, 3, z, "smooth_quartz"); };

  for (let x = 0; x <= 100; x++) for (let z = 0; z <= 39; z++) {
    if (!inFoot(x, z)) continue;
    floor(x, z);
    const edge = !inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1);
    if (!edge) continue;
    const c = WEST.central;
    const tall = x >= c.x0 && x <= c.x1 && (z === c.z0 || z === c.z1);
    for (let y = 4; y <= (tall ? 16 : 14); y++) {
      if (inNiche(x, y, z)) continue;
      g.set(x, y, z, y <= 10 ? "white_terracotta" : y === 12 ? "smooth_quartz" : "calcite");
    }
  }
  for (const [a, b, z0, z1] of podia) for (let x = a; x <= b; x++) for (let z = z0; z <= z1; z++) floor(x, z);

  // rotunda partitions x 40 and 60, z 10..29, to the central attic top
  for (const x of [WEST.central.x0, WEST.central.x1]) for (let z = 10; z <= 29; z++)
    for (let y = 4; y <= 16; y++) g.set(x, y, z, y <= 10 ? "white_terracotta" : "calcite");

  recessDoor(g, 50, 9, "north");
  recessDoor(g, 50, 30, "south");
  // end doors, 2 wide at z 19..20 (recessDoor is odd-width): recess 1, tinted back, surround z 18 and 21, lintel y 9, hood y 10
  for (const [x, back, hood] of [[99, 98, 100], [1, 2, 0]]) {
    for (let z = 19; z <= 20; z++) for (let y = 4; y <= 8; y++) { g.set(x, y, z, "minecraft:air"); g.set(back, y, z, "tinted_glass"); }
    for (const z of [18, 21]) col(x, z, 4, 9, "smooth_quartz");
    for (const z of [19, 20]) g.set(x, 9, z, "smooth_quartz");
    for (let z = 17; z <= 22; z++) g.set(hood, 10, z, ...B.slab("smooth_quartz", "bottom"));
  }
  for (const [a, b, face, w] of niches) nichePanel(g, a, b, face, w);
}

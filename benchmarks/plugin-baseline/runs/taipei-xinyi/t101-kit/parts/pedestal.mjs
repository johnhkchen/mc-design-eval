// P1 Tower pedestal (plot 0): 7 tapering glass bands, step courses with slab sills, halls N and E, lit band, solid roof.
import { bandRing, stepCourse, litBand, hallGlazing, ledgeSlab, LIGHT_GRAY_CONCRETE } from "../vocab.mjs";
import { carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BOX = { x0: 96, z0: 108, x1: 171, z1: 183 };
const BOXA = [96, 108, 171, 183];
const insetAt = (y) => (y <= 25 ? 0 : Math.min(6, Math.floor((y - 2) / 24)));

export function build(g) {
  // step courses first (they are the floor lines where the wall tapers in), then the bands around them
  for (let k = 1; k <= 6; k++) stepCourse(g, { box: BOXA, insetNew: k, y: 2 + 24 * k, taper: true });
  // the step sill at y 146 under each coin medallion is a full raw gold block, not a slab: the disc's back fill (grounds)
  // starts at y 146, and a bottom slab there would leave the fill above it hanging half a block over air
  const RAW_GOLD = "minecraft:raw_gold_block";
  for (let x = 123; x <= 144; x++) { g.set(x, 146, 178, RAW_GOLD); g.set(x, 146, 113, RAW_GOLD); }
  for (let z = 135; z <= 156; z++) { g.set(166, 146, z, RAW_GOLD); g.set(101, 146, z, RAW_GOLD); }
  for (let k = 0; k <= 6; k++) {
    const y0 = k === 0 ? 3 : 2 + 24 * k;   // y 1..2 of the first band is the ground itself
    const y1 = k === 6 ? 154 : 25 + 24 * k;
    bandRing(g, { box: BOX, inset: k, y0, y1, ctx: { kind: "pedestal", floorRes: 2 } });
  }
  // lit band y155..156 at inset 6
  litBand(g, { y: 155, ring: [102, 114, 165, 177] });
  litBand(g, { y: 156, ring: [102, 114, 165, 177] });
  // solid flat roof y157, 62 sq
  ledgeSlab(g, { box: { x0: 103, z0: 115, x1: 164, z1: 176 }, y: 157, notch: false, top: "light_gray_concrete" });
  // halls: clear glass on the tapering wall, door gaps 12 wide
  hallGlazing(g, "north", [120, 147], 3, 40, { box: BOXA, insetAt, gap: [128, 139], gapTop: 8, over: true });
  hallGlazing(g, "east", [120, 147], 3, 40, { box: BOXA, insetAt, gap: [130, 141], gapTop: 8, over: true });
  // dusk: only the segments carry corner light strips, so the pedestal's (2,2) noses are light gray like the other noses;
  // the halls are lit at street level only (y <= 12), their upper glass dark
  const LIT = "minecraft:ochre_froglight";
  for (let y = 3; y <= 156; y++) {
    const k = insetAt(y), lo = { x: BOX.x0 + k + 2, z: BOX.z0 + k + 2 }, hi = { x: BOX.x1 - k - 2, z: BOX.z1 - k - 2 };
    for (const x of [lo.x, hi.x]) for (const z of [lo.z, hi.z]) if (g.blockAt(x, y, z) === LIT) g.set(x, y, z, LIGHT_GRAY_CONCRETE);
    if (y <= 12 || y > 40) continue;
    for (let c = 120; c <= 147; c++) {
      for (const [x, z] of [[c, BOX.z0 + k + 1], [BOX.x1 - k - 1, c]]) if (g.blockAt(x, y, z) === LIT) carve(g, [x, y, z], [x, y, z]);
    }
  }
}

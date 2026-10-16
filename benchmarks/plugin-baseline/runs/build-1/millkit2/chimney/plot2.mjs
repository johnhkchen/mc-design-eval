// Plot 2 (I-house): two brick end chimneys, hearth at the bottom, 1x1 flue, constant-width exterior stack.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = await load(`${D}/v1.nbt`);
const TOP = 18;
// old chimney: crown, hay, campfire, shaft above the roof
for (const fx of [25, 34]) {
  for (let y = 17; y <= 21; y++) for (let x = fx - 1; x <= fx + 1; x++) for (let z = 11; z <= 13; z++) g.set(x, y, z, "air");
  for (const y of [15, 16]) g.set(fx, y, 12, "air");
}
const ends = [
  { fx: 25, out: 24, room: 26, open: "east" },
  { fx: 34, out: 35, room: 33, open: "west" },
];
for (const e of ends) {
  g.set(e.room, 3, 12, "air");                       // the old stove gives way to the hearth mouth
  // exterior stack: x = out and fx (2 wide), z 11..13, constant from the plinth to the mouth
  for (let y = 1; y <= TOP; y++) for (const x of [e.out, e.fx]) for (const z of [11, 12, 13]) {
    if (x === e.fx && z === 12) continue;            // flue/column handled by chimney()
    const cur = g.get(x, y, z)?.block;
    if (x === e.fx && y >= 3 && y <= 14) continue;   // keep the white wall plane where it is a wall...
    g.set(x, y, z, "bricks");
  }
  // wall plane flanking the flue turns brick on the outside face only via the exterior stack; make the flue's N/S walls brick too
  for (let y = 3; y <= 14; y++) for (const z of [11, 13]) g.set(e.fx, y, z, "bricks");
  // from the roof up the stack is 3 x 3 (the third column sits on the roof ridge)
  for (let y = 15; y <= TOP; y++) for (const z of [11, 12, 13]) { const cur = g.get(e.room, y, z)?.block ?? ""; if (!/deepslate_tile_(stairs|slab)$/.test(cur) || y >= 16) g.set(e.room, y, z, "bricks"); }
  chimney(g, { at: [e.fx, 3, 12], open: e.open, top: TOP, material: "bricks" });
}
await g.save(`${D}/chimney/plot2.nbt`);

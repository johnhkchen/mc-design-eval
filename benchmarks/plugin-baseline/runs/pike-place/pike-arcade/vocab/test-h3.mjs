// Calls every h3 helper once on a small grid and checks what it placed: inside its footprint, nothing refused,
// and nothing already built overwritten. Run: node vocab/test-h3.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hang_lamp, flower_bucket, pier_bay, shop_door, terrace_edge, craft_table, neon_sign, ice_bed } from "./h3.mjs";

const DATA_VERSION = 3955; // 1.21.1
const grid = (size) => new Grid(size, { dataVersion: DATA_VERSION });
const blocks = (g) => new Set([...g.cells.values()].map((c) => c.pos.join(",")));

// Calls fn(g) and asserts it wrote only inside box [x0,y0,z0,x1,y1,z1] and refused nothing.
function run(name, size, fn, box, setup = () => {}) {
  const g = grid(size);
  setup(g);
  const before = blocks(g);
  const r = fn(g);
  const added = [...g.cells.values()].filter((c) => !before.has(c.pos.join(",")));
  const [x0, y0, z0, x1, y1, z1] = box;
  const outside = added.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  assert.equal(outside.length, 0, `${name} wrote outside its footprint: ${outside.map((c) => c.pos.join(",")).join(" ")}`);
  assert.equal(r.refused.length, 0, `${name} refused ${JSON.stringify(r.refused)}`);
  assert.ok(added.length > 0, `${name} placed nothing`);
  console.log(`ok ${name}: ${added.length} blocks`);
  return g;
}

// hang_lamp: the beam at y+2 is the block it hangs from
{
  const g = run("hang_lamp", [8, 8, 8], (g) => hang_lamp(g, { x: 2, y: 3, z: 2 }), [2, 3, 2, 2, 4, 2],
    (g) => g.set(2, 5, 2, "dark_oak_planks"));
  assert.equal(g.blockAt(2, 3, 2), "minecraft:lantern");
  assert.equal(g.blockAt(2, 4, 2), "minecraft:chain");
  assert.equal(g.get(2, 3, 2).state.hanging, "true");
  const none = hang_lamp(grid([8, 8, 8]), { x: 2, y: 3, z: 2 });
  assert.equal(none.placed, 0, "hang_lamp with no beam must write nothing");
}

// flower_bucket: cauldron, persistent azalea bunch on top
{
  const g = run("flower_bucket", [6, 6, 6], (g) => flower_bucket(g, { x: 2, y: 2, z: 2 }), [2, 2, 2, 2, 3, 2]);
  assert.equal(g.get(2, 3, 2).state.persistent, "true");
}

// pier_bay: a 2x5 pier with a pilaster 1 proud on the east face
run("pier_bay", [10, 10, 10], (g) => pier_bay(g, { face: "east", x: 4, z0: 3, y0: 2, y1: 6, pilaster: true }), [4, 2, 3, 5, 6, 4]);

// shop_door: double door, sidelights, transom, lintel projecting out
{
  const g = run("shop_door", [10, 10, 10], (g) => shop_door(g, { x: 4, y: 2, z: 3, face: "east" }), [4, 2, 2, 5, 5, 5]);
  assert.equal(g.get(4, 2, 3).state.half, "lower");
  assert.equal(g.get(4, 3, 3).state.half, "upper");
  assert.equal(g.get(4, 2, 4).state.hinge, "right");
}

// terrace_edge: deck, parapet on the west edge, planters inside it
run("terrace_edge", [10, 10, 12], (g) => terrace_edge(g, { x0: 1, x1: 5, z0: 1, z1: 9, y: 2, edge: "west" }), [1, 2, 1, 5, 4, 9]);

// craft_table: legs, top slab, wares; the z+2 lane stays clear
{
  const g = run("craft_table", [8, 8, 8], (g) => craft_table(g, { x0: 2, z: 3, y: 2 }), [2, 2, 3, 4, 4, 4]);
  assert.equal(g.blockAt(2, 4, 5), "minecraft:air", "craft_table must leave the lane clear");
}

// neon_sign: frame, board, letters in red glass
{
  const g = run("neon_sign", [6, 32, 36], (g) => neon_sign(g, { x: 2, y: 2, z0: 2, z1: 33 }), [2, 2, 2, 4, 30, 33]);
  const letters = [...g.cells.values()].filter((c) => c.pos[0] === 4 && c.block === "minecraft:red_stained_glass");
  assert.ok(letters.length > 20, `neon_sign letters: ${letters.length}`);
}

// ice_bed: planks trough, ice, fish on the ice, corner lanterns
run("ice_bed", [10, 8, 12], (g) => ice_bed(g, { x0: 2, x1: 7, z0: 2, z1: 9, y: 2 }), [2, 2, 2, 7, 4, 9]);

// air rule: a built cell in the footprint is kept and the object is refused whole
{
  const g = grid([8, 8, 8]);
  g.set(3, 3, 3, "stone");
  const r = craft_table(g, { x0: 2, z: 3, y: 2 });
  assert.equal(g.blockAt(3, 3, 3), "minecraft:stone", "built cell was overwritten");
  assert.equal(r.placed, 0, "craft_table must not part-build over a built cell");
  assert.ok(r.refused.length > 0);
  console.log("ok air rule: built cell kept, object refused whole");
}

console.log("all h3 helpers passed");

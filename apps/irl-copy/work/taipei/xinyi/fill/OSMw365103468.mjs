import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw365103468";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 21, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inFp.has(key(x, z));

const sides = (x, z) => ({
  xm: has(x - 1, z), xp: has(x + 1, z), zm: has(x, z - 1), zp: has(x, z + 1),
});
const isFacade = (x, z) => {
  const s = sides(x, z);
  return !(s.xm && s.xp && s.zm && s.zp);
};
const isCorner = (x, z) => {
  const s = sides(x, z);
  return (!s.xm || !s.xp) && (!s.zm || !s.zp);
};

// Street-side (open north face, low z) cells, sorted by x; entrance at the middle.
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1) && isFacade(x, z))
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;

// Roof plant: one consolidated AC plant room on the rear (high z) side, interior cells only.
const plantCells = cells.filter(([x, z]) => !isFacade(x, z) && z >= 6 && x >= 6 && x <= 13);

for (const [x, z, gr] of cells) {
  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const b = gr;
  const facade = isFacade(x, z);
  const corner = isCorner(x, z);

  // Floor slabs at ground and at the storey line; roof deck at the top.
  g.set(x, b, z, "smooth_stone");
  g.set(x, b + 5, z, "smooth_stone");
  g.set(x, b + 10, z, facade ? "stone_bricks" : "gray_concrete");

  if (!facade) continue;

  // Plinth.
  g.set(x, b, z, "stone_bricks");

  // Two storeys: glass bays between smooth quartz piers (corners always piers).
  const bay = !corner && (x + z) % 3 !== 0;
  const lit = (x * 5 + z * 11) % 7 === 0;

  for (const [y0, y1] of [[b + 1, b + 3], [b + 6, b + 8]]) {
    for (let y = y0; y <= y1; y++) {
      if (!bay) {
        g.set(x, y, z, "smooth_quartz");
      } else if (lit && y === y0 + 1) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  g.set(x, b + 4, z, "light_gray_concrete");   // storey band
  g.set(x, b + 9, z, "smooth_quartz");         // upper lintel
  g.set(x, b + 10, z, "stone_bricks");         // cornice course
  g.set(x, b + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet coping
}

// Single rooftop plant room: a low concrete box with a lit vent, sitting on the deck.
for (const [x, z, gr] of plantCells) {
  const b = gr;
  g.set(x, b + 11, z, "light_gray_concrete");
  if (x % 3 === 1 && z % 2 === 0) g.set(x, b + 12, z, "light_gray_concrete");
}

// Street entrance: double door under a lantern on the north face.
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  const b = dg;
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(dx, b + 1, dz, "dark_oak_door", doorProps("lower"));
  g.set(dx, b + 2, dz, "dark_oak_door", doorProps("upper"));
  g.set(dx, b + 3, dz, "light_blue_stained_glass");
  g.set(dx, b + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${dir}/${id}.nbt`);

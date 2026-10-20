import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300018";
const W = 18, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const OFF = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) =>
  Object.entries(OFF).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const cx = Math.floor(W / 2), cz = Math.floor(D / 2);

// Entrance: north-face perimeter cell nearest the centre line
const northCells = cells.filter(([x, z]) => outward(x, z).includes("north"));
let ent = null;
for (const c of northCells) {
  if (!ent || Math.abs(c[0] - cx) < Math.abs(ent[0] - cx)) ent = c;
}
const ex = ent ? ent[0] : -100;
const ez = ent ? ent[1] : -100;
const canopy = new Set(northCells.filter(([x]) => Math.abs(x - ex) <= 1).map(([x, z]) => `${x},${z}`));

const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr] of cells) {
  const outs = outward(x, z);
  const perim = outs.length > 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs per storey, air otherwise (no interiors)
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    // Rooftop mechanical unit, 2x2 near the centre
    if (x >= cx - 1 && x <= cx && z >= cz - 1 && z <= cz) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "stone_brick_slab", { type: "bottom" });
    }
    // Warm lamps standing on the storey floors, just inside the glass
    continue;
  }

  // Perimeter shell
  put(x, gr, z, "stone_bricks"); // base course
  put(x, gr + 10, z, "smooth_stone"); // cornice band
  put(x, gr + 11, z, "stone_brick_slab", { type: "bottom" }); // parapet

  const isEntrance = x === ex && z === ez;
  const isCanopy = canopy.has(`${x},${z}`);

  const primary = outs[0];
  const a = primary === "north" || primary === "south" ? x : z;
  const pillar = outs.length >= 2 || a % 3 === 0;

  if (isEntrance) {
    put(x, gr + 1, z, "dark_oak_door", doorProps("lower"));
    put(x, gr + 2, z, "dark_oak_door", doorProps("upper"));
    put(x, gr + 3, z, "light_blue_stained_glass");
    put(x, gr + 4, z, "red_terracotta");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 6, z, "white_concrete");
    put(x, gr + 7, z, "light_blue_stained_glass");
    put(x, gr + 8, z, "light_blue_stained_glass");
    put(x, gr + 9, z, "white_concrete");
    continue;
  }

  if (pillar) {
    for (let y = gr + 1; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    continue;
  }

  // Window bay
  put(x, gr + 1, z, "smooth_stone");                  // shopfront plinth
  put(x, gr + 2, z, "light_blue_stained_glass");      // shopfront glass
  put(x, gr + 3, z, "light_blue_stained_glass");
  put(x, gr + 4, z, isCanopy ? "red_terracotta" : "stone_bricks"); // awning / lintel
  put(x, gr + 5, z, "smooth_stone");                  // storey line
  put(x, gr + 6, z, "white_concrete");                // sill
  put(x, gr + 7, z, "light_blue_stained_glass");
  put(x, gr + 8, z, "light_blue_stained_glass");
  put(x, gr + 9, z, "white_concrete");                // head

  // Warm lamps inside some bays, standing on the storey floors
  const [dx, dz] = OFF[primary];
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && outward(ix, iz).length === 0) {
    const innerGr = ground.get(`${ix},${iz}`);
    if (a % 6 === 1) put(ix, innerGr + 1, iz, "glowstone");
    if (a % 6 === 4) put(ix, innerGr + 6, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

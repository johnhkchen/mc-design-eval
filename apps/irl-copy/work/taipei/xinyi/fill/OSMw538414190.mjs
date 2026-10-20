import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial/office block, c. 1990s-2000s Xinyi: two storeys of shopfront and
// glazed upper floor, cream quartz-clad piers, stone plinth, flat roof with parapet.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538414190";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 22, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Per-cell ground, clamped so the storey lines stay above the foundation.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(10, Math.max(0, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gg = ground.get(`${x},${z}`);

  // Facing of the outline: which faces of this cell are exposed.
  const nsOpen = !has(x, z - 1) || !has(x, z + 1); // wall runs east-west
  const ewOpen = !has(x - 1, z) || !has(x + 1, z); // wall runs north-south
  const edge = nsOpen || ewOpen;
  const corner = nsOpen && ewOpen;
  const u = nsOpen ? x : z;               // position along the wall
  const pillar = corner || (edge && u % 3 === 0);
  const paneProps = nsOpen
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  // Base course / ground floor slab.
  put(x, gg, z, edge ? "stone_bricks" : "smooth_stone");

  // Ground floor shopfront: glass bays between quartz piers, warm light in some bays.
  for (let y = gg + 1; y <= 3; y++) {
    if (!edge) continue;
    if (pillar) put(x, y, z, "quartz_pillar", { axis: "y" });
    else if (y === 2 && u % 6 === 2) put(x, y, z, "glowstone");
    else put(x, y, z, "glass_pane", paneProps);
  }

  // Ground floor lintel / canopy band.
  if (edge && gg <= 4) put(x, 4, z, "smooth_quartz");

  // Floor slab between storeys (full footprint).
  if (5 >= gg) put(x, 5, z, "smooth_stone");

  // Upper storey: sill, glazed bays with piers, head band.
  if (edge) {
    if (6 >= gg) put(x, 6, z, pillar ? "quartz_pillar" : "smooth_quartz", pillar ? { axis: "y" } : undefined);
    for (let y = Math.max(7, gg); y <= 8; y++) {
      if (pillar) put(x, y, z, "quartz_pillar", { axis: "y" });
      else if (u % 6 === 4) put(x, y, z, y === 7 ? "shroomlight" : "glowstone");
      else put(x, y, z, "glass_pane", paneProps);
    }
    if (9 >= gg) put(x, 9, z, pillar ? "quartz_pillar" : "smooth_quartz", pillar ? { axis: "y" } : undefined);
  }

  // Roof deck and cornice.
  put(x, 10, z, edge ? "smooth_quartz" : "smooth_stone");

  // Parapet.
  if (edge) put(x, 11, z, "smooth_quartz");
}

// Front entrance on the z = 17 face: single door at x = 10, glass beside it.
for (const x of [10]) {
  if (has(x, 17) && ground.get(`${x},17`) + 2 <= 3) {
    const gg = ground.get(`${x},17`);
    put(x, gg + 1, 17, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gg + 2, 17, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  // Entrance canopy over the door.
  if (has(x, 17)) put(x, 4, 17, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: two parapet-height units on the deck.
for (const [x0, x1, z0, z1, block] of [
  [5, 7, 5, 6, "light_gray_concrete"],
  [14, 16, 10, 12, "white_concrete"],
]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z)) continue;
    put(x, 11, z, block);
    put(x, 12, z, block);
  }
}

g.save(`${dir}/${id}.nbt`);

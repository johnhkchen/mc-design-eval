// Way 1095572186: a 1920s-30s two-storey brick-and-plaster shop block (Auckland's interwar main-street type): a
// stone plinth, a shopfront with a centre door and lantern on the street (north) face, sash-window bays on the sides,
// a stone cornice and parapet, and a flat roof deck with two plant units. Built only on the footprint cells: the
// perimeter is the wall, the rest is air behind it, with a solid floor slab at each storey line (y 0, 4, 8).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572186.cells.json", "utf8"));   // [x, z, ground, roof]

const top = Math.max(...cells.map(([, , , roof]) => roof));       // 9: the lidar roof height above y 0
const Y = top + 1;                                                 // the parapet cap sits at y = top
const X = 7, Z = 9;
const g = new Voxels([X, Y, Z]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inside.has(key(x, z));
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

// faces of a footprint cell that border the outside: north is the street side (z decreasing)
const faces = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const perimeter = (x, z) => { const f = faces(x, z); return f.N || f.S || f.W || f.E; };

const DOOR = [2, 0];                                               // the street-face cell at the centre bay
const DOOR_STATE = { facing: "north", hinge: "left", open: "false", powered: "false" };

// Fill the foundation from y 0 up to each cell's ground: every cell here is at ground 0, so only the storey slabs.
for (const [x, z, gr] of cells) for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

// floor slabs at y 0 (ground), 4 (first floor), 8 (roof deck): full footprint, so every storey stands on one
for (const [x, z] of cells) {
  g.set(x, 0, z, "smooth_stone");
  g.set(x, 4, z, "smooth_stone");
  g.set(x, 8, z, "smooth_stone");
}

// the walls: perimeter cells only
const FACE_WINDOW = (x, z) => { const f = faces(x, z); return (f.E || f.W) ? z % 2 === 0 : x % 2 === 0; };
for (const [x, z] of cells) {
  if (!perimeter(x, z)) continue;
  const f = faces(x, z);
  const shop = f.N;                                                // street front: the shopfront
  const isDoor = x === DOOR[0] && z === DOOR[1];

  // plinth at y 0: stone brick base course
  g.set(x, 0, z, "stone_bricks");

  // ground storey, y 1..3
  if (shop) {
    if (isDoor) {
      g.set(x, 1, z, "dark_oak_door", { ...DOOR_STATE, half: "lower" });
      g.set(x, 2, z, "dark_oak_door", { ...DOOR_STATE, half: "upper" });
      g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      g.set(x, 1, z, "glass_pane");
      g.set(x, 2, z, "glass_pane");
      g.set(x, 3, z, "white_terracotta");                          // shop fascia
    }
  } else {
    if (FACE_WINDOW(x, z)) {
      g.set(x, 1, z, "glass_pane");
      g.set(x, 2, z, "glass_pane");
      g.set(x, 3, z, "white_terracotta");                          // lintel
    } else {
      for (let y = 1; y <= 3; y++) g.set(x, y, z, "bricks");
    }
  }

  // upper storey, y 5..7: sash bays on the sides, brick between
  if (FACE_WINDOW(x, z) || shop) {
    g.set(x, 5, z, "white_terracotta");                            // sill
    const lit = !shop && (x + z) % 3 === 0;                        // a few lit rooms behind the glass
    g.set(x, 6, z, lit ? "glowstone" : "glass_pane");
    g.set(x, 7, z, "white_terracotta");                            // head
  } else {
    for (let y = 5; y <= 7; y++) g.set(x, y, z, "bricks");
  }

  // cornice lip at y 8, parapet cap at y = top
  g.set(x, 8, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, top, z, "stone_bricks");
}

// roof equipment on the deck (interior cells only, so they stand on the roof slab and sit inside the parapet)
const interior = cells.filter(([x, z]) => !perimeter(x, z));
for (const [x, z] of interior.slice(0, 2)) g.set(x, 9, z, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572186.nbt";
const info = g.save(out);
console.log(`way_1095572186: ${info.blocks} blocks, palette ${info.palette}, size ${X}x${Y}x${Z}`);

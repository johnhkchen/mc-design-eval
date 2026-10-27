// Miro Apartments (way 662008503), Auckland: a 1970s-80s reinforced-concrete apartment block, stepped in tiers.
// Lidar roof heights snap to 4-block storey decks (8 wings, 16 mid, 20 shoulders, 24 core + parapet to 25), so every
// tier stands on whole storeys. Walls are one cell thick on the footprint's edge (and where a taller tier meets a lower
// one); the interior is air with a floor slab per storey. Plinth below each cell's ground, a grey base course, white
// concrete bodies with light-grey storey lines, glazed bays with grey mullions, balconies recessed on every sixth bay,
// a shopfront ground storey with an entrance, a parapet cap, and roof plant on the deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_662008503.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell
const X = 123, Y = 39, Z = 71;
const g = new Voxels([X, Y, Z]);

const key = (x, z) => x + "," + z;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, roof });

// the deck (roof surface) of a cell: the lidar height snapped to its tier, never under one storey above its ground
for (const c of cell.values()) {
  const tier = c.roof >= 24 ? 24 : c.roof >= 19 ? 20 : c.roof >= 13 ? 16 : 8;
  c.deck = Math.max(tier, 4 * Math.ceil((c.ground + 4) / 4));
}

// the faces of a cell that show: outside the footprint, or against a neighbour whose deck is lower (its terrace)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (c) => Object.keys(DIRS).filter((f) => {
  const n = cell.get(key(c.x + DIRS[f][0], c.z + DIRS[f][1]));
  return !n || n.deck < c.deck;
});
for (const c of cell.values()) { c.faces = faces(c); c.env = c.faces.length > 0; }

// the entrance: the north face's lowest-z envelope cell, at the middle of that edge
const north = [...cell.values()].filter((c) => c.env && c.faces.includes("N"));
const minZ = Math.min(...north.map((c) => c.z));
const xs = north.filter((c) => c.z === minZ).map((c) => c.x).sort((a, b) => a - b);
const doorX = xs[Math.floor(xs.length / 2)];
const door = cell.get(key(doorX, minZ));

const set = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (const c of cell.values()) {
  const { x, z, ground: gr, deck } = c;
  if (!c.env) {
    // interior: plinth, ground floor, slabs per storey, a membrane roof
    for (let y = 0; y <= deck; y++) {
      if (y < gr) set(x, y, z, "stone_bricks");
      else if (y === gr) set(x, y, z, "light_gray_concrete");
      else if (y === deck) set(x, y, z, "gray_concrete");
      else if (y % 4 === 0) set(x, y, z, "light_gray_concrete");
    }
    continue;
  }
  // envelope: a solid one-cell wall with glazed bays, storey lines and a cap
  const along = c.faces.includes("N") || c.faces.includes("S") ? x : z;
  const face = c.faces[0];
  const inward = [-DIRS[face][0], -DIRS[face][1]];
  const mullion = along % 3 === 0;
  for (let y = 0; y <= deck + 1; y++) {
    const k = Math.floor(y / 4), r = y % 4;
    if (y < gr) set(x, y, z, "stone_bricks");
    else if (y === deck + 1 || y === deck) set(x, y, z, "light_gray_concrete");          // coping and deck line
    else if (y === gr) set(x, y, z, "gray_concrete");                                    // base course
    else if (r === 0) set(x, y, z, "light_gray_concrete");                               // storey line
    else if (r === 3) set(x, y, z, "white_concrete");                                    // spandrel
    else if (mullion) set(x, y, z, "gray_concrete");                                      // frame
    else if (k >= 1 && along % 6 === 4) { if (r === 1) set(x, y, z, "iron_bars"); }     // recessed balcony, rail on the slab
    else set(x, y, z, "light_blue_stained_glass");                                       // glazing
  }
  // warm light behind some bays on alternate storeys: a glowstone in the room inside, where that cell is open
  if (!mullion && along % 9 === 4) {
    const inner = cell.get(key(x + inward[0], z + inward[1]));
    if (inner && !inner.env) {
      for (let k = 1; 4 * k + 1 < deck; k += 2) if (4 * k + 1 > inner.ground) set(inner.x, 4 * k + 1, inner.z, "glowstone");
    }
  }
}

// entrance: a door on the north face with its lintel above, under the ground storey
{
  const { x, z, ground: gr } = door;
  const d = { facing: "north", hinge: "left", open: "false", powered: "false" };
  set(x, gr + 1, z, "iron_door", { ...d, half: "lower" });
  set(x, gr + 2, z, "iron_door", { ...d, half: "upper" });
  for (const dx of [-1, 0, 1]) {
    const n = cell.get(key(x + dx, z));
    if (n && n.env) set(n.x, gr + 3, n.z, "light_gray_concrete");
  }
}

// roof plant on the deck of the core and shoulders: small boxes in a grid
for (const c of cell.values()) {
  if (!c.env && (c.deck === 24 || c.deck === 20) && c.x % 10 >= 3 && c.x % 10 <= 4 && c.z % 12 >= 3 && c.z % 12 <= 4) {
    set(c.x, c.deck + 1, c.z, "smooth_stone");
    set(c.x, c.deck + 2, c.z, "smooth_stone");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_662008503.nbt";
console.log(g.save(out));

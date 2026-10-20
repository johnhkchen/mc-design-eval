import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541456403.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541456403.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 10, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const set = new Set(cells.map(([x, z]) => key(x, z)));
const minG = Math.min(...cells.map(c => Math.round(c[2])));
const grOf = (x, z) => {
  const c = cells.find(c => c[0] === x && c[1] === z);
  const gr = Math.round(c[2]) - minG;
  return Math.max(0, Math.min(10, gr));
};

// Outward faces: a neighbour cell missing from the footprint means that side is exposed.
const dirs = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Window pattern along a face: glass at positions 1,2,4,5,7,8; solid pillars at 3,6; corners solid.
const isWinT = t => t >= 1 && t <= 8 && t % 3 !== 0;

const paneProps = face =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false"
});

function wallBlock(face, x, y, z, gr) {
  const t = (face === "north" || face === "south") ? x : z;
  // Ground storey: shopfront glass with a central door on the north (street) face.
  if (y <= 4) {
    if (face === "north" && t === 4 && y === gr + 1) return { id: "dark_oak_door", p: doorProps("lower") };
    if (face === "north" && t === 4 && y === gr + 2) return { id: "dark_oak_door", p: doorProps("upper") };
    if (face === "north" && y === gr + 3 && t >= 3 && t <= 5) return { id: "dark_oak_slab", p: { type: "top", waterlogged: "false" } };
    if (t >= 1 && t <= 8) return { id: "light_blue_stained_glass_pane", p: paneProps(face) };
    return { id: "white_concrete" };
  }
  if (y === 5) return { id: "smooth_stone" };            // storey line / floor slab edge
  if (y >= 6 && y <= 8) {
    if (isWinT(t)) return { id: "light_blue_stained_glass_pane", p: paneProps(face) };
    return { id: "white_concrete" };
  }
  if (y === 9) return { id: "white_concrete" };
  if (y === 10) return { id: "smooth_stone" };          // cornice
  if (y === 11) return { id: "white_concrete" };        // parapet
  return null;
}

// Pass 1: foundations, floors, roof deck, walls.
for (const [x, z] of cells) {
  const gr = grOf(x, z);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor slab / base course at this cell's ground.
  g.set(x, gr, z, "polished_andesite");

  // Upper floor slab at the storey line (y=5) and roof deck (y=10) across the whole footprint.
  if (gr < 5) g.set(x, 5, z, "smooth_stone");
  if (gr < 10) g.set(x, 10, z, "gray_concrete");

  const faces = dirs.filter(([dx, dz]) => !set.has(key(x + dx, z + dz))).map(d => d[2]);
  if (faces.length === 0) continue;

  const face = faces[0];
  for (let y = gr + 1; y <= 11; y++) {
    const b = wallBlock(face, x, y, z, gr);
    if (!b) continue;
    if (b.p) g.set(x, y, z, b.id, b.p);
    else g.set(x, y, z, b.id);
  }
}

// Pass 2: rooftop plant enclosure (interior only).
for (const [x, z] of cells) {
  const edge = dirs.some(([dx, dz]) => !set.has(key(x + dx, z + dz)));
  if (edge) continue;
  if (x >= 3 && x <= 6 && z >= 3 && z <= 6) {
    g.set(x, 11, z, "light_gray_concrete");
    if (x >= 4 && x <= 5 && z >= 4 && z <= 5) g.set(x, 12, z, "light_gray_concrete");
  }
}

// Pass 3: warm light behind a few upper-storey windows (glowstone just inside the glass).
for (const [x, z] of cells) {
  for (const [dx, dz, face] of dirs) {
    if (set.has(key(x + dx, z + dz))) continue;
    const t = (face === "north" || face === "south") ? x : z;
    if (t !== 4) continue;
    const [ix, iz] = inward[face];
    const tx = x + ix, tz = z + iz;
    if (set.has(key(tx, tz))) g.set(tx, 7, tz, "glowstone");
  }
}

g.save(OUT);

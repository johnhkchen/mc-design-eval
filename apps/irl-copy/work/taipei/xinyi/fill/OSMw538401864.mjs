import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538401864.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538401864.nbt";

const W = 25, H = 23, D = 18;

// Palette: a two-storey 1970s-80s Taipei commercial block. Cream painted concrete
// walls, grey stone bands and cornice, tinted-glass shopfronts, dark frames.
const WALL = "white_concrete";
const BASE = "light_gray_concrete";
const TRIM = "smooth_stone";
const ROOF = "light_gray_concrete";
const FOUND = "stone_bricks";
const GLASS = "glass";
const FRAME = "dark_oak_planks";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, gr);
const has = (x, z) => foot.has(`${x},${z}`);
const gnd = (x, z) => foot.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outward faces a footprint cell exposes. n = -z, s = +z, w = -x, e = +x.
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
};
const FACING = { n: "north", s: "south", w: "west", e: "east" };
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

// Pass 1: foundations, floors, roofs, and the solid shell.
for (const [key, g0] of foot) {
  const [x, z] = key.split(",").map(Number);
  const edge = faces(x, z).length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, FOUND);

  // Ground floor slab.
  put(x, g0, z, edge ? BASE : ROOF);
  // Storey-2 floor slab (also the storey line on the outside).
  put(x, g0 + 5, z, TRIM);
  // Roof slab; edge cells become the cornice.
  put(x, g0 + 10, z, edge ? TRIM : ROOF);

  // Interior air: nothing else placed, so the gap behind the glass is open.
  if (!edge) continue;

  // Solid wall rows on the perimeter, storey lines, parapet.
  for (let y = g0 + 1; y <= g0 + 9; y++) put(x, y, z, WALL);
  put(x, g0 + 4, z, TRIM);   // storey-1 lintel line
  put(x, g0 + 9, z, TRIM);   // storey-2 lintel line
  put(x, g0 + 11, z, WALL);  // parapet
}

// Pass 2: openings, shopfronts, lights, on the exposed faces.
for (const [key, g0] of foot) {
  const [x, z] = key.split(",").map(Number);
  const fs = faces(x, z);
  if (fs.length === 0) continue;

  for (const f of fs) {
    const idx = f === "n" || f === "s" ? x : z;
    const [ix, iz] = INWARD[f];
    const ox = x + ix, oz = z + iz; // inward neighbour
    const inside = has(ox, oz);

    // Storey 1: continuous shopfront glass, with piers every third bay.
    if (idx % 3 !== 0) {
      for (let y = g0 + 1; y <= g0 + 3; y++) put(x, y, z, GLASS);
      if (inside && idx % 6 === 2) put(ox, g0 + 2, oz, "glowstone");
    } else {
      for (let y = g0 + 1; y <= g0 + 3; y++) put(x, y, z, FRAME);
    }

    // Storey 2: single punched windows on the bay centres.
    if (idx % 3 === 1) {
      for (let y = g0 + 6; y <= g0 + 8; y++) put(x, y, z, GLASS);
      if (inside && idx % 6 === 1) put(ox, g0 + 7, oz, "shroomlight");
    } else {
      for (let y = g0 + 6; y <= g0 + 8; y++) put(x, y, z, WALL);
    }
  }
}

// Pass 3: entrance on the street face. Prefer south, then north, then the sides.
const doorPref = ["s", "n", "w", "e"];
let doorFace = null, doorCells = [];
for (const f of doorPref) {
  const list = [];
  for (const [key] of foot) {
    const [x, z] = key.split(",").map(Number);
    if (faces(x, z).includes(f)) list.push([x, z]);
  }
  if (list.length) { doorFace = f; doorCells = list; break; }
}
if (doorFace) {
  const along = (doorFace === "n" || doorFace === "s") ? 0 : 1;
  doorCells.sort((a, b) => a[along] - b[along]);
  const [dx, dz] = doorCells[Math.floor(doorCells.length / 2)];
  const g0 = gnd(dx, dz);
  // Entrance surround: frame jambs and a stone lintel over the door.
  const [ix, iz] = INWARD[doorFace];
  const jambA = along === 0 ? [dx - 1, dz] : [dx, dz - 1];
  const jambB = along === 0 ? [dx + 1, dz] : [dx, dz + 1];
  for (const [jx, jz] of [jambA, jambB]) {
    if (!has(jx, jz)) continue;
    for (let y = g0 + 1; y <= g0 + 3; y++) put(jx, y, jz, FRAME);
  }
  put(dx, g0 + 3, dz, TRIM);
  put(dx, g0 + 1, dz, "dark_oak_door", {
    facing: FACING[doorFace], half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, g0 + 2, dz, "dark_oak_door", {
    facing: FACING[doorFace], half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Small warm lamp just inside the entrance.
  if (has(dx + ix, dz + iz)) put(dx + ix, g0 + 3, dz + iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: rooftop air-conditioning plant on the roof's interior cells.
for (const [key, g0] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (faces(x, z).length) continue;
  if ((x + z) % 7 === 0) put(x, g0 + 11, z, "iron_block");
}

g.save(OUT);

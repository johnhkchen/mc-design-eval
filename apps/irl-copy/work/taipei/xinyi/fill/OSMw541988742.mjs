import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988742";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 15;
// Two storeys of ~5 blocks: ground-floor shopfronts, upper office storey, cornice.
const S1 = 5;      // storey line between floors
const S2 = 9;      // upper band line
const ROOF = 10;   // top course (roof reads ~11 blocks above lowest ground)

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};
const has = (x, z) => inside.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Front door: north-facing (z-1 missing) edge cell closest to the middle.
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!has(x, z - 1) && Math.abs(x - W / 2) < best) {
      best = Math.abs(x - W / 2);
      door = [x, z];
    }
  }
}

for (const [x, z, rawGround] of cells) {
  const gr = Math.max(0, Math.min(rawGround, ROOF - 1));
  const top = Math.max(ROOF, gr);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  // Pattern index along the facade (x on north/south faces, z on east/west).
  const idx = (!has(x, z - 1) || !has(x, z + 1)) ? x : z;

  if (edge) {
    for (let y = gr; y <= top; y++) {
      if (y === top) put(x, y, z, "smooth_stone");
      else if (y === gr) put(x, y, z, "polished_andesite");
      else if (y < S1) {
        // Ground-floor shopfront: piers between glass.
        if (idx % 3 === 0) put(x, y, z, "stone_bricks");
        else put(x, y, z, "glass_pane");
      } else if (y === S1) put(x, y, z, "quartz_block");
      else if (y < S2) {
        // Upper office storey: window grid with white piers.
        if (idx % 3 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane");
      } else if (y === S2) put(x, y, z, "quartz_block");
    }
  } else {
    // Interior: floor slab at storey line, roof slab on top, no open rooms.
    if (gr <= S1) put(x, S1, z, "smooth_stone");
    put(x, top, z, "smooth_stone");
    // Warm light behind some windows.
    if (x % 4 === 2 && z % 4 === 2 && gr < S2) put(x, 7, z, "glowstone");
  }
}

// Front entrance: two-high dark oak door with a small canopy lintel.
if (door) {
  const [dx, dz] = door;
  const gr = Math.max(0, Math.min(groundOf.get(key(dx, dz)), ROOF - 1));
  const base = gr + 1;
  put(dx, base, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, base + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy lintel over the entrance, sitting on the wall above the door.
  for (let x = dx - 1; x <= dx + 1; x++) {
    if (has(x, dz)) put(x, base + 2, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant: a small light-grey mechanical enclosure on the roof.
for (let x = 4; x <= 7; x++) {
  for (let z = 5; z <= 8; z++) {
    if (has(x, z)) put(x, ROOF + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

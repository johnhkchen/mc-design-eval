import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw352791651";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 38 x 62 x 47; roof slab at y = 50; ten storeys of 5 blocks, lines at 50 - 5k.
const W = 38, H = 62, D = 47, ROOF = 50;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Exposed sides of a footprint cell.
function exposedSides(x, z) {
  const s = [];
  if (!inside(x - 1, z)) s.push("W");
  if (!inside(x + 1, z)) s.push("E");
  if (!inside(x, z - 1)) s.push("N");
  if (!inside(x, z + 1)) s.push("S");
  return s;
}
const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

// Materials: 1980s Taipei commercial tower, pale concrete frame, tinted glass curtain wall.
const FOUND = "stone_bricks";
const PLINTH = "polished_granite";
const SPANDREL = "gray_concrete";      // darker floor bands give depth against the glass
const PIER = "smooth_quartz";
const CORNER = "white_concrete";
const GLASS_A = "cyan_stained_glass";
const GLASS_B = "light_blue_stained_glass";
const COPING = "smooth_quartz_slab";
const CORNICE = "stone_brick_slab";

// Penthouse bounds (inside footprint).
const PH = { x0: 9, x1: 28, z0: 13, z1: 33, yWall0: 51, yWall1: 55, yCap: 56 };
const ENTRY_X = 19; // centre of the south face

for (const [x, z, gr] of cells) {
  const g0 = gr;
  const sides = exposedSides(x, z);
  const perim = sides.length > 0;
  const face = sides[0] ?? null;
  const corner = sides.length >= 2;
  const t = face === "W" || face === "E" ? z : x;

  // Foundation below the cell's ground, then the ground-level slab.
  for (let y = 0; y < g0; y++) put(x, y, z, FOUND);
  put(x, g0, z, PLINTH);

  // Storey lines and facade bands above ground.
  for (let y = g0 + 1; y < ROOF; y++) {
    const onLine = (ROOF - y) % 5 === 0;
    if (onLine) {
      put(x, y, z, SPANDREL); // floor slab / spandrel, every cell
      continue;
    }
    if (!perim) continue; // interior stays air between slabs

    const k = Math.floor((ROOF - y) / 5); // storey index from the top
    const ry = (ROOF - y) % 5;

    if (corner) {
      put(x, y, z, CORNER); // solid corner columns
      continue;
    }

    if (y < 5) {
      // Stone plinth and shopfront glass on the ground storey.
      if (y <= g0 + 1) put(x, y, z, PLINTH);
      else put(x, y, z, t % 3 === 0 ? PIER : GLASS_A);
    } else {
      if (t % 4 === 0) {
        put(x, y, z, PIER);
      } else {
        // Alternate glass tints by storey for depth and rhythm.
        put(x, y, z, k % 2 === 0 ? GLASS_A : GLASS_B);
      }
      // Warm light: glowstone one cell inside, behind selected windows.
      if (ry === 2 && k % 2 === 0 && t % 8 === 2) {
        const [dx, dz] = INWARD[face];
        if (inside(x + dx, z + dz)) put(x + dx, y, z + dz, "glowstone");
      }
    }
  }

  // Entrance: recessed doorway, stone pilasters, canopy on the south face.
  const onSouth = perim && sides.includes("S") && !corner;
  if (onSouth && x >= ENTRY_X - 3 && x <= ENTRY_X + 2) {
    const dx = x - ENTRY_X;
    if (dx === -3 || dx === 2) {
      // Pilasters framing the entrance.
      for (let y = g0 + 1; y <= g0 + 3; y++) put(x, y, z, "stone_bricks");
    } else if (x === ENTRY_X) {
      // Doorway at centre.
      put(x, g0 + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, g0 + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, g0 + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else {
      // Recessed glass either side of the door.
      put(x, g0 + 1, z, "tinted_glass");
      put(x, g0 + 2, z, "tinted_glass");
      put(x, g0 + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    // Canopy band across the entrance above the pilasters.
    put(x, g0 + 4, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
    // Warm light just inside the doorway.
    if (x === ENTRY_X + 1 && inside(x, z - 1)) put(x, g0 + 2, z - 1, "glowstone");
  }

  // Roof: parapet with cornice and coping on perimeter cells.
  if (perim) {
    put(x, ROOF + 1, z, CORNER);
    put(x, ROOF + 2, z, CORNER);
    put(x, ROOF + 3, z, CORNICE, { type: "bottom", waterlogged: "false" });
    put(x, ROOF + 4, z, COPING, { type: "top", waterlogged: "false" });
  }

  // Roof-level plant penthouse (interior cells only).
  const inPH = x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1;
  if (inPH) {
    const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    if (ring) {
      for (let y = PH.yWall0; y <= PH.yWall1; y++) {
        if (y === PH.yWall0 || y === PH.yWall1) put(x, y, z, SPANDREL);
        else put(x, y, z, (x + z) % 3 === 0 ? PIER : "black_stained_glass");
      }
    }
    put(x, PH.yCap, z, SPANDREL);
  }

  // Roof surface.
  if (!perim && !inPH) put(x, ROOF, z, SPANDREL);
}

// Lightning-rod mast on the penthouse roof.
for (let y = 57; y <= 60; y++) {
  g.set(19, y, 23, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

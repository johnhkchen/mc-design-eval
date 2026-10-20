import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1159644357.cells.json", "utf8"));

const W = 23, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (absolute y, floored)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.floor(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// Outward face of a perimeter cell: { dx, dz, facing } or null for interior cells
function faceOf(x, z) {
  if (!has(x - 1, z)) return { dx: -1, dz: 0, facing: "west" };
  if (!has(x + 1, z)) return { dx: 1, dz: 0, facing: "east" };
  if (!has(x, z - 1)) return { dx: 0, dz: -1, facing: "north" };
  if (!has(x, z + 1)) return { dx: 0, dz: 1, facing: "south" };
  return null;
}

// Along-facade coordinate
const uOf = (x, z, face) => (face.facing === "west" || face.facing === "east" ? z : x);

// Storey lines (absolute): ground storey y<5, upper storey 5..9, cornice 10, roof deck 11, parapet 11..12
const ROOF = 11;
const LINE = 5;

// Door: north face, centred on the footprint's x-centre (x = 11)
const DOOR_U = 11;

for (const [x, z, gr] of cells) {
  const fl = ground.get(`${x},${z}`);
  const face = faceOf(x, z);

  // Foundation: solid from 0 up to the cell's ground
  for (let y = 0; y < fl; y++) g.set(x, y, z, "stone_bricks");

  if (!face) {
    // Interior: ground floor slab, storey floor slabs, roof deck; air between (no interiors)
    for (const y of new Set([fl, LINE, 10, ROOF])) {
      if (y >= fl && y <= ROOF) g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter facade
  const u = uOf(x, z, face);
  const isDoorCol = face.facing === "north" && u >= DOOR_U - 1 && u <= DOOR_U + 1;
  const isDoor = face.facing === "north" && u === DOOR_U;

  for (let y = fl; y <= ROOF + 1; y++) {
    let b = null;
    let props = undefined;

    if (y === fl) {
      b = "polished_andesite"; // plinth / base course
    } else if (y < LINE) {
      // Ground storey: shopfront
      if (isDoor && (y === fl + 1 || y === fl + 2)) {
        b = "oak_door";
        props = {
          facing: "north",
          half: y === fl + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (isDoorCol && y === fl + 3) {
        b = "black_concrete"; // entrance canopy
      } else if (y === 4) {
        b = "gray_concrete"; // lintel below storey line
      } else if (isDoorCol && u !== DOOR_U) {
        b = "gray_concrete"; // door-zone pillars
      } else {
        b = u % 3 === 0 ? "gray_concrete" : "light_blue_stained_glass_pane";
      }
    } else if (y === LINE) {
      b = "smooth_stone"; // storey line
    } else if (y <= 8) {
      // Upper storey window grid
      b = u % 3 === 0 ? "white_concrete" : "light_blue_stained_glass_pane";
    } else if (y === 9) {
      b = "white_concrete"; // spandrel
    } else if (y === 10) {
      b = "stone_bricks"; // cornice
    } else if (y === ROOF) {
      b = "stone_bricks"; // parapet
    } else if (y === ROOF + 1) {
      b = "stone_brick_wall"; // parapet cap
    }

    if (b) g.set(x, y, z, b, props);

    // Warm light behind some glass: place inside the cell one step inward
    if (y !== fl && y > fl && y < LINE && b === "light_blue_stained_glass_pane" ||
        (y >= 6 && y <= 8 && b === "light_blue_stained_glass_pane")) {
      if ((x * 31 + z * 17 + y * 7) % 9 === 0) {
        const ix = x - face.dx, iz = z - face.dz;
        if (has(ix, iz) && y !== ground.get(`${ix},${iz}`) && y !== LINE && y !== 10 && y !== ROOF) {
          g.set(ix, y, iz, "shroomlight");
        }
      }
    }
  }

  // Interior floor slabs are not needed on perimeter; interior-facing air stays open.
}

// Roof plant: a small mechanical block with warm lanterns at its corners
for (let x = 8; x <= 10; x++) {
  for (let z = 8; z <= 10; z++) {
    if (!has(x, z)) continue;
    const fl = ground.get(`${x},${z}`);
    if (fl > ROOF) continue;
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
}
for (const [x, z] of [[8, 8], [10, 8], [8, 10], [10, 10]]) {
  if (has(x, z)) g.set(x, ROOF + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1159644357.nbt");

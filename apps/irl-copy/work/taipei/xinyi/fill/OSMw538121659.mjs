import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s Xinyi office block: two storeys of 5 blocks, flat roof
// with a cornice and parapet at y 11. Light concrete frame, blue-tinted glazing,
// shopfront at ground, recessed entrance on the street side (lowest z).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121659";
const W = 16, H = 23, D = 26;

const ROOF_Y = 11;    // parapet top
const DECK_Y = 10;    // roof slab
const FLOOR2_Y = 5;   // second-floor slab / storey line
const LINTEL_Y = 4;   // spandrel over shopfront

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

// Street side = lowest z row of the footprint; door sits there, centred on x.
let minZ = Infinity;
for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
const frontCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => z === minZ && isPerim(x, z));
frontCells.sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
const doorCell = frontCells[0] ?? null;

const g = new Voxels([W, H, D]);

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const pillar = (x + z) % 3 === 0;   // mullion / column rhythm
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    g.set(x, y, z, perim ? "stone_bricks" : "stone");
  }

  // Ground-level slab / base course.
  if (perim) {
    g.set(x, gr, z, "stone_bricks");
  } else {
    g.set(x, gr, z, "light_gray_concrete");
  }

  // Ground storey: shopfront glazing, transom, spandrel.
  for (let y = gr + 1; y <= 3; y++) {
    if (!perim) continue;
    if (isDoor && (y === gr + 1 || y === gr + 2)) continue; // door set below
    if (pillar) {
      g.set(x, y, z, "light_gray_concrete");
    } else {
      g.set(x, y, z, "blue_stained_glass");
    }
  }
  if (perim && LINTEL_Y > gr) {
    g.set(x, LINTEL_Y, z, "light_gray_concrete");
  }

  // Storey line between floors.
  if (perim) {
    g.set(x, FLOOR2_Y, z, "polished_andesite");
  } else {
    g.set(x, FLOOR2_Y, z, "light_gray_concrete");
  }

  // Upper storey: glazed bands with concrete mullions.
  if (perim) {
    for (let y = FLOOR2_Y + 1; y <= 9; y++) {
      g.set(x, y, z, pillar ? "light_gray_concrete" : "blue_stained_glass");
    }
  }

  // Roof deck and cornice.
  g.set(x, DECK_Y, z, perim ? "smooth_quartz" : "light_gray_concrete");

  // Parapet on the perimeter.
  if (perim) {
    g.set(x, ROOF_Y, z, "smooth_quartz");
  } else if (x % 5 === 2 && z % 7 === 3) {
    // Rooftop air-handling units.
    g.set(x, ROOF_Y, z, "iron_block");
  }

  // Interior: air gaps with warm lights behind the glass.
  if (!perim) {
    if (gr + 1 <= 2 && (x * 5 + z * 3) % 9 === 0) {
      g.set(x, 2, z, "shroomlight");
    }
    if (((x * 5 + z * 3) % 13) === 0) {
      g.set(x, 7, z, "shroomlight");
    }
  }
}

// Recessed entrance on the street side.
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = ground.get(`${dx},${dz}`);
  g.set(dx, gr + 1, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(dx, gr + 2, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Transom above the door.
  g.set(dx, gr + 3, dz, "blue_stained_glass");
}

g.save(`${DIR}/${ID}.nbt`);

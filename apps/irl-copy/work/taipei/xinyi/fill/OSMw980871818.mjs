// Era: 1970s-80s Taipei mid-rise concrete-frame commercial block, two storeys
// of ~5 blocks (ground-floor shopfront, upper storey of tiled-look windows),
// flat roof with parapet and a rooftop water tank. White concrete frame, light
// blue glass, a few lit windows, dark wood entrance door, lantern inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871818";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const ROOF_Y = 10;   // top solid row (roof slab / parapet cap), height ~11 from lowest ground
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, r] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(9, Math.round(r))));
}
const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};
const winRow = (y, gr) => (y >= gr + 1 && y <= 3) || (y >= 7 && y <= 8);

// Entrance: prefer the north (street-side) face, else the first face long enough.
const perimCells = cells.map(([x, z]) => [x, z]).filter(([x, z]) => isPerim(x, z));
let entFace = null, entCell = null;
for (const pref of ["north", "south", "west", "east"]) {
  const list = perimCells.filter(([x, z]) => faces(x, z).includes(pref));
  if (list.length >= 3) {
    entFace = pref;
    const along = (pref === "north" || pref === "south")
      ? list.sort((a, b) => a[0] - b[0])
      : list.sort((a, b) => a[1] - b[1]);
    entCell = along[Math.floor(along.length / 2)];
    break;
  }
}
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

for (const [x, z, r] of cells) {
  const gr = ground.get(key(x, z));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    // Interior: ground floor slab, storey-2 floor slab, roof deck. Air between (no interiors).
    g.set(x, 0, z, "smooth_stone");
    g.set(x, 5, z, "smooth_stone");
    g.set(x, ROOF_Y, z, "light_gray_concrete");
    continue;
  }

  // Perimeter shell: frame, windows, cornice, parapet.
  const f = faces(x, z);
  const alongIdx = (f.includes("north") || f.includes("south")) ? x : z;
  const pillar = f.length > 1 || alongIdx % 3 === 0;
  const isDoor = entCell && entCell[0] === x && entCell[1] === z;

  for (let y = gr; y <= ROOF_Y; y++) {
    if (isDoor && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: entFace, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    let b;
    if (y === ROOF_Y || y === 5) {
      b = "smooth_stone";                       // parapet cap and storey cornice
    } else if (y === gr) {
      b = "polished_andesite";                  // base course
    } else if (winRow(y, gr)) {
      if (pillar) {
        b = "light_gray_concrete";              // mullions
      } else if (y <= 3) {
        b = "cyan_stained_glass";               // shopfront glass
      } else {
        b = ((x + y + z) % 5 === 0) ? "orange_stained_glass" : "light_blue_stained_glass";
      }
    } else {
      b = "white_concrete";                     // spandrels and piers
    }
    g.set(x, y, z, b);
  }
}

// Warm lantern just inside the entrance.
if (entCell && entFace) {
  const [dx, dz] = inward[entFace];
  const ix = entCell[0] + dx, iz = entCell[1] + dz;
  if (has(ix, iz) && !isPerim(ix, iz)) {
    const ly = Math.max(ground.get(key(ix, iz)), 1);
    g.set(ix, ly, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop water tank (3x3, two high) with a warning light on top, on the roof deck.
for (let x = 6; x <= 8; x++) {
  for (let z = 9; z <= 11; z++) {
    if (has(x, z) && !isPerim(x, z)) {
      g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
      g.set(x, ROOF_Y + 2, z, "light_gray_concrete");
    }
  }
}
if (has(7, 10) && !isPerim(7, 10)) {
  g.set(7, ROOF_Y + 3, 10, "redstone_lamp");
}

g.save(`${DIR}/${ID}.nbt`);

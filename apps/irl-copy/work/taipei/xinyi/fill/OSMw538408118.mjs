import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408118";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 21 x 23 x 18 volume. Two storeys (ground shopfront band 0..4, upper band 6..9),
// roof deck at y=10, parapet at y=11, small plant room on top.
const W = 21, H = 23, D = 18;
const DECK_Y = 10;
const PARAPET_Y = 11;
const SLAB_Y = 5;

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const groundOf = new Map(
  cells.map(([x, z, g]) => [key(x, z), Math.max(0, Math.min(4, Math.round(g)))])
);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces for each perimeter cell. Direction vector points outside the footprint.
const FACES = [
  { name: "N", dx: 0, dz: -1, along: "x" },
  { name: "S", dx: 0, dz: 1, along: "x" },
  { name: "W", dx: -1, dz: 0, along: "z" },
  { name: "E", dx: 1, dz: 0, along: "z" },
];
const facesOf = (x, z) =>
  FACES.filter((f) => !inside.has(key(x + f.dx, z + f.dz)));

// Find the centre of the south (street-side) face for the entrance.
const southCells = cells
  .filter(([x, z]) => !inside.has(key(x, z + 1)))
  .map(([x, z]) => x);
const doorX = southCells.length
  ? Math.floor((Math.min(...southCells) + Math.max(...southCells)) / 2)
  : -1;

for (const [x, z] of cells) {
  const gc = groundOf.get(key(x, z));
  const faces = facesOf(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length > 1;

  // Foundation fill from y=0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Floor slab at this cell's ground level (bottom of the building).
  put(x, gc, z, "smooth_stone");

  // Belt course / floor slab between storeys, across all footprint cells.
  put(x, SLAB_Y, z, "smooth_stone");

  // Roof deck across all footprint cells.
  put(x, DECK_Y, z, "light_gray_concrete");

  if (!perimeter) {
    // Plant room on the roof, inset from the parapet.
    if (x >= 7 && x <= 11 && z >= 6 && z <= 10) {
      put(x, PARAPET_Y, z, "light_gray_concrete");
      put(x, PARAPET_Y + 1, z, "light_gray_concrete");
      if (x === 9 && z === 8) put(x, PARAPET_Y + 2, z, "iron_block");
    }
    continue;
  }

  // Parapet with cap on the perimeter.
  put(x, PARAPET_Y, z, "white_terracotta");

  // Main facade bands. Ground band: gc..4. Upper band: 6..9 (5 is the slab).
  for (let y = gc; y <= 9; y++) {
    if (y === SLAB_Y || y === DECK_Y) continue;

    const face = faces[0];
    const idx = face.along === "x" ? x : z;
    const pier = corner || idx % 3 === 0;

    if (y <= 4) {
      // Ground floor shopfront.
      if (y === gc) {
        put(x, y, z, "polished_granite");
      } else if (y === 4) {
        put(x, y, z, "red_terracotta");
      } else if (pier) {
        put(x, y, z, "polished_andesite");
      } else {
        put(x, y, z, "cyan_stained_glass");
      }
    } else {
      // Upper storey.
      if (y === 6 || y === 9) {
        put(x, y, z, "white_terracotta");
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Warm light behind some glass: glowstone one block inside the footprint.
  if (!corner) {
    const face = faces[0];
    const idx = face.along === "x" ? x : z;
    const ix = x - face.dx;
    const iz = z - face.dz;
    if (inside.has(key(ix, iz))) {
      if (idx % 6 === 1) put(ix, 7, iz, "glowstone");
      if (idx % 6 === 4) put(ix, 1, iz, "glowstone");
    }
  }

  // Street entrance on the south face, centred.
  if (!corner && faces[0].name === "S" && x === doorX) {
    put(x, gc, z, "dark_oak_door", {
      facing: "south",
      half: "lower",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, gc + 1, z, "dark_oak_door", {
      facing: "south",
      half: "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, 4, z, "lantern", { hanging: "true" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record for this footprint, so it is read as a two-storey, c.1980s Taipei
// reinforced-concrete block: white tiled facade, light-blue tinted glazing,
// a stone base, a shopfront ground floor, and a parapet roof at y = 11.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612585";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 31;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

// Which outward face a footprint cell sits on (null = interior).
function faceOf(x, z) {
  const wMiss = !has(x - 1, z);
  const eMiss = !has(x + 1, z);
  const nMiss = !has(x, z - 1);
  const sMiss = !has(x, z + 1);
  const corner = (wMiss || eMiss) && (nMiss || sMiss);
  let face = null;
  if (wMiss) face = "w";
  else if (eMiss) face = "e";
  else if (nMiss) face = "n";
  else if (sMiss) face = "s";
  return { face, corner };
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Walls, floors, roof and interior structure.
const minZ = Math.min(...cells.map(([, z]) => z));
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const gE = Math.min(gr, 4); // storey lines are absolute; ground storey starts at the cell's ground
  const { face, corner } = faceOf(x, z);

  if (face === null) {
    // Interior: floor slabs at y 5 and 10, roof deck at 10, sparse columns.
    g.set(x, 5, z, "light_gray_concrete");
    g.set(x, 10, z, "light_gray_concrete");
    if (x % 6 === 0 && z % 6 === 0) {
      for (let y = gE; y <= 9; y++) g.set(x, y, z, "white_concrete");
    }
    // Small roof plant units (one block) on the roof deck.
    if ((x * 5 + z * 3) % 13 === 0) g.set(x, 11, z, "gray_concrete");
    continue;
  }

  // Perimeter facade.
  const along = face === "w" || face === "e" ? z : x;
  const isWin = !corner && [1, 2].includes(((along % 4) + 4) % 4);

  // Base course and ground-floor shopfront.
  g.set(x, gE, z, "smooth_stone");
  for (let y = gE + 1; y <= 3; y++) {
    g.set(x, y, z, isWin ? "light_blue_stained_glass" : "white_concrete");
  }
  g.set(x, 4, z, "white_concrete");      // ground-floor lintel / storey line
  g.set(x, 5, z, "white_concrete");      // floor slab edge
  // Upper storey: sill, glazing, lintel.
  g.set(x, 6, z, isWin ? "light_gray_concrete" : "white_concrete");
  g.set(x, 7, z, isWin ? "light_blue_stained_glass" : "white_concrete");
  g.set(x, 8, z, isWin ? "light_blue_stained_glass" : "white_concrete");
  g.set(x, 9, z, "white_concrete");
  // Cornice and parapet to y 11.
  g.set(x, 10, z, "smooth_stone");
  g.set(x, 11, z, "light_gray_concrete");

  // Warm lights set just inside some windows (only in free interior cells).
  const inward = { w: [1, 0], e: [-1, 0], n: [0, 1], s: [0, -1] }[face];
  const ix = x + inward[0], iz = z + inward[1];
  if (isWin && has(ix, iz) && faceOf(ix, iz).face === null && (ix % 6 !== 0 || iz % 6 !== 0)) {
    if (((along % 8) + 8) % 8 === 1) g.set(ix, 7, iz, "glowstone");
    if (((along % 8) + 8) % 8 === 5 && gE < 2) g.set(ix, 2, iz, "shroomlight");
  }
}

// 3. Entrance: centred on the south-west street frontage (lowest z), with a door.
const frontCands = cells
  .filter(([x, z]) => z === minZ && !faceOf(x, z).corner && faceOf(x, z).face !== null)
  .sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
if (frontCands.length) {
  const [dx, dz, dgr] = frontCands[0];
  const gE = Math.min(Math.round(dgr), 4);
  const y0 = gE + 1, y1 = gE + 2;
  if (y1 <= 3) {
    const props = { facing: "north", hinge: "left", open: "false", powered: "false" };
    g.set(dx, y0, dz, "oak_door", { ...props, half: "lower" });
    g.set(dx, y1, dz, "oak_door", { ...props, half: "upper" });
    // Warm lanterns flanking the door, set in the shopfront glazing line.
    for (const sx of [dx - 1, dx + 1]) {
      if (has(sx, dz) && faceOf(sx, dz).face !== null) {
        g.set(sx, y1, dz, "lantern", { hanging: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

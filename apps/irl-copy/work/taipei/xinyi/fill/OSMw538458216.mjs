import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458216";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 16 x 23 x 16: two 5-block storeys, cornice, parapet, small roof plant.
const W = 16, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));

// Podium/floor level: the highest ground under the footprint, so the whole
// footprint sits on one flat plinth (foundation fills everything below it).
const B = Math.max(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const cx = Math.round((minX + maxX) / 2);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outward = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !inFp(x + dx, z + dz))
    .map(([d]) => d);

const isPerimeter = (x, z) => outward(x, z).length > 0;

// 1. Foundation: solid from y 0 up to the flat plinth under every footprint cell.
for (const [x, z] of cells) {
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone");
}

// 2. Interior floor slabs for each level, and the roof deck.
for (const [x, z] of cells) {
  if (isPerimeter(x, z)) continue;
  g.set(x, B, z, "smooth_stone");
  g.set(x, B + 5, z, "light_gray_concrete");
  g.set(x, B + 10, z, "smooth_stone");
}

// 3. Facade shell: base course, storey lines, pilasters, glazed bays, spandrels,
//    cornice and parapet. Every perimeter cell also gets the deck slab below its cornice.
for (const [x, z] of cells) {
  const outs = outward(x, z);
  if (outs.length === 0) continue;
  const corner = outs.length > 1;
  const face = outs[0];
  const alongX = face === "N" || face === "S";

  // Pilasters on a 4-block module, always at the corners.
  const pillar = corner ||
    (alongX ? (x === minX || x === maxX || (x - minX) % 4 === 0)
            : (z === minZ || z === maxZ || (z - minZ) % 4 === 0));

  for (let s = 0; s < 2; s++) {
    const y0 = B + 5 * s;
    // Storey line / base course.
    g.set(x, y0, z, s === 0 ? "stone_bricks" : "white_concrete");

    // Window zone: pilaster or glazing.
    for (let y = y0 + 1; y <= y0 + 3; y++) {
      if (pillar) {
        g.set(x, y, z, "white_concrete");
      } else {
        const ground = s === 0;
        const pane = ground ? "glass_pane" : "light_blue_stained_glass_pane";
        const conn = alongX
          ? { north: "false", south: "false", east: "true", west: "true" }
          : { north: "true", south: "true", east: "false", west: "false" };
        g.set(x, y, z, pane, { ...conn, waterlogged: "false" });
      }
    }

    // Spandrel below the next storey line.
    g.set(x, y0 + 4, z, "light_gray_concrete");
  }

  // Cornice and parapet.
  g.set(x, B + 10, z, "smooth_stone");
  g.set(x, B + 11, z, "white_concrete");
}

// 4. Main entrance on the south face, centred, replacing one ground-floor pane.
const southCells = cells
  .filter(([x, z]) => {
    const o = outward(x, z);
    return o.length === 1 && o[0] === "S";
  })
  .map(([x, z]) => x);
let doorX = southCells.length
  ? southCells.reduce((a, b) => (Math.abs(b - cx) < Math.abs(a - cx) ? b : a))
  : null;
if (doorX !== null) {
  const doorZ = maxZ;
  const dprops = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, B + 1, doorZ, "dark_oak_door", dprops("lower"));
  g.set(doorX, B + 2, doorZ, "dark_oak_door", dprops("upper"));
  // Hanging lantern under the spandrel above the door.
  g.set(doorX, B + 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
}

// 5. Warm light: glowstone on the floor just inside some lit bays.
for (const [x, z] of cells) {
  const outs = outward(x, z);
  if (outs.length !== 1) continue;
  const face = outs[0];
  const alongX = face === "N" || face === "S";
  if (alongX ? (x === minX || x === maxX) : (z === minZ || z === maxZ)) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz; // one step inward
  if (!inFp(ix, iz)) continue;
  for (let s = 0; s < 2; s++) {
    if (((x * 7 + z * 3 + s) % 5) !== 0) continue;
    if (x === doorX && z === maxZ && s === 0) continue;
    const y0 = B + 5 * s;
    g.set(ix, y0 + 1, iz, "glowstone");
  }
}

// 6. Roof plant: two cooling boxes on the deck, and a lightning rod at the centre.
const plant = [[5, 5], [10, 10]];
for (const [px, pz] of plant) {
  for (const dx of [0, 1]) for (const dz of [0, 1]) {
    const x = px + dx, z = pz + dz;
    if (!inFp(x, z) || isPerimeter(x, z)) continue;
    g.set(x, B + 11, z, "light_gray_concrete");
    g.set(x, B + 12, z, "light_gray_concrete");
  }
}
const rodZ = Math.round((minZ + maxZ) / 2);
if (inFp(cx, rodZ) && !isPerimeter(cx, rodZ)) {
  g.set(cx, B + 11, rodZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

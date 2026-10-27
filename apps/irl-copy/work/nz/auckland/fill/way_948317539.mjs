// Way 948317539, Auckland CBD edge (seen from Maungawhau): a 1920s brick commercial block. Three storeys in the core
// stepping down to two and one at the wings, red brick piers with cream plaster bands and window heads and sills,
// a dark timber shopfront on the street front, a stone plinth on the downhill side, and a lift overrun on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317539.cells.json", "utf8"));
const g = new Voxels([20, 25, 19]);
const B = new Map();                                    // "x,y,z" -> block id, for the glass connections and the lights
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); B.set(key(x, y, z), block); };

// Lidar roof heights are noisy: each cell is quantised to one of three flat tiers (1, 2 or 3 storeys of 4 blocks),
// with a one-block parapet on top: the core reaches y 13, the middle 9, the wings 5.
const tierTop = (roof) => (roof <= 6 ? 4 : roof <= 9 ? 8 : 12);
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { x, z, g: ground, roof });
// the 3x3 mean of the lidar roof over the footprint cells around each one, so single noisy cells don't saw the parapet
const C = new Map();
for (const c of raw.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const r = raw.get(`${c.x + dx},${c.z + dz}`); if (r) { sum += r.roof; n++; } }
  C.set(`${c.x},${c.z}`, { x: c.x, z: c.z, g: c.g, T: tierTop(sum / n) });
}
const col = (x, z) => C.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];          // east, west, south, north

// the outward faces of column c at row y: off the footprint, or above a lower neighbour's roof (a setback face)
const faces = (c, y) => NB.filter(([dx, dz]) => { const n = col(c.x + dx, c.z + dz); return !n || n.T <= y; });

const glass = [];
for (const c of C.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");          // foundation up to this cell's ground
  for (let y = c.g; y < c.T; y++) {
    const f = faces(c, y);
    if (!f.length) {                                                         // interior: floor and ceiling slabs, air between
      if (y === c.g || y % 4 === 0 || y % 4 === 3) put(c.x, y, c.z, "oak_planks");
      continue;
    }
    let block;
    if (y === c.g) block = "polished_andesite";                              // base course
    else if (y % 4 === 0) block = "smooth_quartz";                           // cream floor band, over each sill line
    else if (y % 4 === 3) block = y === 3 ? "dark_oak_planks" : "bricks";    // lintel course; dark fascia over the shops
    else {
      const face = f.find(([dx]) => !dx) ?? f[0];                            // a north/south face reads first on the ragged plan
      const along = face[0] ? c.z : c.x;                                     // position along that face
      block = along % 3 === 0 ? "bricks" : "glass_pane";                     // 1-block piers, 2-block windows
    }
    put(c.x, y, c.z, block);
    if (block === "glass_pane") glass.push([c, y, f]);
  }
  if (faces(c, c.T - 1).length) put(c.x, c.T, c.z, "smooth_quartz");        // parapet on the outer edge
}

// warm lights behind some upper-window glass: the cell inside the window, standing on the floor slab
glass.forEach(([c, y, f]) => {
  if (f.length !== 1 || y % 4 !== 1 || (c.x * 31 + c.z * 17 + y * 7) % 5 !== 0) return;
  const [dx, dz] = f[0], ix = c.x - dx, iz = c.z - dz, ic = col(ix, iz);
  if (!ic || y < ic.g || y >= ic.T || faces(ic, y).length) return;
  put(ix, y, iz, (c.x + c.z) % 2 ? "glowstone" : "shroomlight");
});

// glass panes connect to whatever stands beside them, as the game would draw them
for (const [c, y] of glass) {
  const st = {};
  const dirs = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  for (const [name, [dx, dz]] of Object.entries(dirs)) st[name] = B.has(key(c.x + dx, y, c.z + dz)) ? "true" : "false";
  g.set(c.x, y, c.z, "glass_pane", { ...st, waterlogged: "false" });
}

// the street entrance: a double-height dark oak door in the north wall, under the fascia
const dc = col(9, 0);
if (dc && dc.g + 2 <= 3) {
  const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(9, dc.g + 1, 0, "dark_oak_door", { ...door, half: "lower" });
  put(9, dc.g + 2, 0, "dark_oak_door", { ...door, half: "upper" });
}

// roof: a 2x2 lift overrun on the central three-storey roof, two plant units on the middle tier
const roofCells = [...C.values()].filter((c) => c.T === 12 && !faces(c, 11).length);
const box = roofCells
  .filter((c) => [[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => col(c.x + dx, c.z + dz)?.T === 12 && !faces(col(c.x + dx, c.z + dz), 11).length))
  .sort((a, b) => Math.hypot(a.x - 9.5, a.z - 8.5) - Math.hypot(b.x - 9.5, b.z - 8.5))[0];
if (box) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(box.x + dx, 12, box.z + dz, "bricks");
    put(box.x + dx, 13, box.z + dz, "bricks");
    put(box.x + dx, 14, box.z + dz, "smooth_quartz");
  }
}
const plant = [...C.values()].filter((c) => c.T === 8 && !faces(c, 7).length && !(box && Math.abs(c.x - box.x) < 3 && Math.abs(c.z - box.z) < 3));
[plant[Math.floor(plant.length / 3)], plant[Math.floor((2 * plant.length) / 3)]].forEach((c) => c && put(c.x, 8, c.z, "iron_block"));

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317539.nbt";
console.log(g.save(out));

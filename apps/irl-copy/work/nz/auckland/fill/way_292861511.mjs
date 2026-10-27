// way_292861511: a 1960s-70s reinforced-concrete office block on the Eden Terrace edge of the CBD. Lidar roof 27-39
// blocks above y 0: a basalt plinth, eight storeys of pale concrete and tinted glass on the main block, a 39-block
// tower (ten storeys) on its east side with the door at its foot, a setback penthouse on the tower and two lower wings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861511.cells.json`, "utf8"));
const [X, Y, Z] = [26, 52, 27];

// lidar roof -> flat tiers (noise smoothed): low wings 7, the main block 27 or 35, the tower 39
const tier = (r) => (r <= 12 ? 7 : r <= 30 ? 27 : r <= 36 ? 35 : 39);
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, top: tier(roof) });
// a setback penthouse on the middle of the tower: four more storeys-worth of 4-block bays in the 4 x 3 core
for (let z = 11; z <= 13; z++) for (let x = 16; x <= 19; x++) { const c = fp.get(`${x},${z}`); if (c?.top === 39) c.top = 43; }

const cell = (x, z) => fp.get(`${x},${z}`);
const solid = (x, y, z) => { const c = cell(x, z); return !!c && y >= 0 && y < c.top; };
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const pairs = [...fp.keys()].map((k) => k.split(",").map(Number));
const lit = (axis, F) => (axis * 5 + F * 3) % 9 === 0;   // about one bay in nine glows from behind the glass

const g = new Voxels([X, Y, Z]);
const panes = new Map();   // "x,y,z" -> the axis the pane stands in: "x" (east/west face) or "z"

// 1. the mass: basalt plinth to y 2, then floor bands (white) every 4 blocks from y 3 and pale concrete between;
//    the top block is a cornice on the outside and roof membrane inside
for (const [x, z] of pairs) {
  const { top } = cell(x, z);
  for (let y = 0; y < top; y++) {
    if (y < 3) g.set(x, y, z, "polished_andesite");
    else if (y === top - 1) g.set(x, y, z, exposed(x, y, z).length ? "white_concrete" : "stone");
    else g.set(x, y, z, (y - 3) % 4 === 0 ? "white_concrete" : "light_gray_concrete");
  }
}

// 2. the glazing: on each exposed face a bay grid of 3 (mullion at every third block, glass between), two rows of
//    glass per storey, an air pocket behind every pane (glowstone in the lit ones), no interior
for (const [x, z] of pairs) {
  const { top } = cell(x, z);
  for (let y = 4; y < top - 1; y++) {
    const off = (y - 3) % 4;
    if (off === 0 || off === 3) continue;
    const dir = exposed(x, y, z)[0];
    if (!dir) continue;
    const [dx, dz] = dir;
    const axis = dx ? z : x;                 // position along the face
    const ix = x - dx, iz = z - dz;          // the cell behind the glass
    if (!solid(ix, y, iz) || !solid(x - 2 * dx, y, z - 2 * dz)) continue;   // too thin to hold a pocket
    if (axis % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }    // mullion
    const F = y - off;
    g.set(x, y, z, F === 3 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane");
    panes.set(`${x},${y},${z}`, dx ? "x" : "z");
    if (lit(axis, F)) g.set(ix, y, iz, "glowstone");
    else g.set(ix, y, iz, "air");
  }
}

// 3. entrance: a pair of doors on the east face at the foot of the tower, steps up from the street, a canopy
for (const z of [13, 14]) {
  g.set(25, 3, z, "oak_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
  const hinge = z === 13 ? "left" : "right";
  for (const [y, half] of [[4, "lower"], [5, "upper"]]) {
    g.set(25, y, z, "dark_oak_door", { facing: "west", half, hinge, open: "false", powered: "false" });
    g.set(24, y, z, "air");
  }
}
for (let x = 26; x <= 27; x++) for (const z of [13, 14]) g.set(x, 6, z, "smooth_stone");
g.set(27, 5, 13, "lantern", { hanging: "true", waterlogged: "false" });
g.set(27, 5, 14, "lantern", { hanging: "true", waterlogged: "false" });

// 4. roof: two plant enclosures on the main block's roof (a 3 x 2 block in the interior, clear of the edge)
const taken = new Set();
const boxes = [];
for (let z = 1; z < Z - 2 && boxes.length < 2; z++) for (let x = 1; x < X - 3 && boxes.length < 2; x++) {
  const cs = [];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) cs.push([x + dx, z + dz]);
  const ok = cs.every(([cx, cz]) => cell(cx, cz)?.top === 35 && !taken.has(`${cx},${cz}`)
    && DIRS.every(([dx, dz]) => (cell(cx + dx, cz + dz)?.top ?? 0) >= 35));
  if (!ok) continue;
  boxes.push(cs);
  for (const [cx, cz] of cs) taken.add(`${cx},${cz}`);
}
for (const cs of boxes) for (const [cx, cz] of cs) {
  g.set(cx, 35, cz, "light_gray_concrete"); g.set(cx, 36, cz, "light_gray_concrete");
  g.set(cx, 37, cz, "white_concrete");
}

// 5. the penthouse's mast, on its cap
g.set(17, 43, 12, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// 6. pane connections: a pane joins its in-plane neighbours (glass, mullion or any solid), so no lone posts
for (const [k, axis] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const here = g.get(x, y, z)?.block;
  if (!here?.endsWith("_stained_glass_pane")) continue;   // a door went in where a pane had been
  const joined = axis === "x"
    ? { north: g.get(x, y, z - 1), south: g.get(x, y, z + 1), east: null, west: null }
    : { east: g.get(x + 1, y, z), west: g.get(x - 1, y, z), north: null, south: null };
  const st = Object.fromEntries(["north", "south", "east", "west"].map((d) => [d, joined[d] ? "true" : "false"]));
  g.set(x, y, z, here, { ...st, waterlogged: "false" });
}

const out = g.save(`${DIR}/way_292861511.nbt`);
console.log(`way_292861511: ${out.blocks} blocks, ${out.palette} palette entries, ${panes.size} panes, ${boxes.length} roof enclosures`);

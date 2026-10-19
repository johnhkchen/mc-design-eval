// NYC1034320: 45 West 46 Street, a 1920 mixed residential and commercial midblock building, 5 x 26 blocks, roof 18 above
// its lowest ground. Massing from the lidar roof, smoothed into flat tiers: a one-storey shopfront on the street (z 0..1),
// a two-storey low wing (z 2..9) with a light court notched into its east side, a five-storey setback (z 10..16, 16 high)
// and a six-storey tower behind it (z 17..25, 18 high) with a spine up its west edge. Red brick walls, limestone quoins,
// sills, lintels and string courses, glass panes in stone frames, a dark-oak shop door with a lantern inside, lamps behind
// some windows, a parapet with coping, and a penthouse and water tank on the roof. The shell is one block thick with an
// air gap behind every window and a floor slab per storey; no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const lidar = JSON.parse(readFileSync(`${DIR}/NYC1034320.cells.json`, "utf8"));

// Clean tiers from the lidar: roof 0 is a light court (kept open to the sky), everything else is a flat tier.
const plan = new Map();
for (const [x, z, , roof] of lidar) {
  const g = z >= 15 ? 1 : 0;                                   // the site rises once, at z 15
  const r = roof === 0 ? 0 : z <= 1 ? 4 : z <= 9 ? 7 : x === 0 ? 18 : z <= 16 ? 16 : 18;
  plan.set(`${x},${z}`, { g, r });
}

const cell = (x, z) => plan.get(`${x},${z}`);
const inside = (x, y, z) => { const c = cell(x, z); return !!c && c.r > 0 && y >= c.g && y < c.r; };
const faces = (x, y, z) => ({ W: !inside(x - 1, y, z), E: !inside(x + 1, y, z), N: !inside(x, y, z - 1), S: !inside(x, y, z + 1) });
const exposed = (x, y, z) => { const f = faces(x, y, z); return f.W || f.E || f.N || f.S || !inside(x, y - 1, z) || !inside(x, y + 1, z); };
// Shell: the cells on the outside of the massing, plus a floor slab on every storey line. Everything else is air.
const solid = (x, y, z) => inside(x, y, z) && ((y - cell(x, z).g) % 3 === 0 || exposed(x, y, z));

const panes = new Map();   // "x,y,z" -> the axis the pane's plane runs along ("z" on a west/east face, "x" on a north/south one)
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// The outside block of a shell cell: stone at each storey line, brick between, glass in the window bays, limestone quoins.
function facade(x, y, z) {
  const c = cell(x, z), rel = y - c.g, f = faces(x, y, z);
  const horiz = f.W || f.E || f.N || f.S;
  if (y === c.r - 1) return horiz ? "stone_bricks" : "smooth_stone";     // cornice, and the roof deck inside
  if (!horiz) return "smooth_stone";                                       // floor slabs inside
  if ((f.W || f.E) && (f.N || f.S)) return "stone_bricks";                // quoins
  const shop = rel < 3 && z <= 9;                                          // ground floor of the street wing: shopfronts
  const win = (f.W || f.E ? z : x) % 2 === 1;                              // windows on odd bays, brick piers between
  if (rel % 3 === 0) return win || shop ? "stone_bricks" : "bricks";      // storey line: sill under and lintel over each window
  if (win) return "glass_pane";                                            // two-high glass in each bay
  return shop ? "stone_bricks" : "bricks";
}

const g = new Voxels([5, 30, 26]);

for (const [key, { g: base, r }] of plan) {
  const [x, z] = key.split(",").map(Number);
  if (r === 0) { put(x, 0, z, "stone_bricks"); continue; }                // court paving at the ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");            // foundation on the rising ground
  for (let y = base; y < r; y++) {
    if (!solid(x, y, z)) continue;
    if (x === 2 && z === 0 && y < 2) {                                    // the shop door, dark oak, in the street front
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const block = facade(x, y, z);
    if (block === "glass_pane") {
      const f = faces(x, y, z);
      panes.set(`${x},${y},${z}`, f.W || f.E ? "z" : "x");
    }
    put(x, y, z, block);
  }
  // Parapet with coping on the outer edge of the roof.
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !plan.has(`${x + dx},${z + dz}`));
  if (edge) {
    put(x, r, z, "stone_bricks");
    put(x, r + 1, z, "stone_bricks");
    put(x, r + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Lamps behind some windows: the air gap behind each glass pane, where it has one. Glowstone and shroomlight, warm.
const lamp = (x, y, z) => { const h = (x * 3 + y * 5 + z * 7) % 9; return h === 0 ? "glowstone" : h === 4 ? "shroomlight" : null; };
for (const [key] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const f = faces(x, y, z);
  const ix = f.W && !f.E ? x + 1 : f.E && !f.W ? x - 1 : x;
  const iz = f.N && !f.S ? z + 1 : f.S && !f.N ? z - 1 : z;
  if (!inside(ix, y, iz) || solid(ix, y, iz)) continue;
  const l = lamp(x, y, z);
  if (l) put(ix, y, iz, l);
}
// The lantern inside the shop door.
put(2, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Penthouse on the rear roof (x 1..3, z 18..21): brick and stone walls, glass in the middle row, a slab cap. Its
// interior is one block of air behind the glass.
for (let z = 18; z <= 21; z++) for (let x = 1; x <= 3; x++) {
  const edge = x !== 2 || z === 18 || z === 21;
  const corner = x !== 2 && (z === 18 || z === 21);
  put(x, 18, z, edge ? "stone_bricks" : "smooth_stone");
  if (edge) {
    if (corner) { put(x, 19, z, "stone_bricks"); } else { put(x, 19, z, "glass_pane"); panes.set(`${x},19,${z}`, x !== 2 ? "z" : "x"); }
    put(x, 20, z, corner ? "stone_bricks" : "bricks");
  }
  put(x, 21, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
// Water tank on a stone base at the rear (x 1..3, z 22..24), wood staves and a slab lid.
for (let z = 22; z <= 24; z++) for (let x = 1; x <= 3; x++) {
  put(x, 18, z, "stone_bricks"); put(x, 19, z, "stone_bricks");
  for (let y = 20; y <= 22; y++) put(x, y, z, "spruce_planks");
  put(x, 23, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

// Glass panes connect to the wall and glass beside them along their plane, as the game draws them.
const LINK = new Set(["glass_pane", "bricks", "stone_bricks", "smooth_stone"]);
const linked = (x, y, z) => { const b = g.get(x, y, z)?.block; return !!b && LINK.has(b.replace("minecraft:", "")); };
for (const [key, axis] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const s = axis === "z"
    ? { north: linked(x, y, z - 1), south: linked(x, y, z + 1), east: false, west: false }
    : { north: false, south: false, east: linked(x + 1, y, z), west: linked(x - 1, y, z) };
  const state = Object.fromEntries(Object.entries({ ...s, waterlogged: "false" }).map(([k, v]) => [k, String(v)]));
  put(x, y, z, "glass_pane", state);
}

const info = g.save(`${DIR}/NYC1034320.nbt`);
console.log(`NYC1034320: ${info.blocks} blocks, ${info.palette} palette entries`);

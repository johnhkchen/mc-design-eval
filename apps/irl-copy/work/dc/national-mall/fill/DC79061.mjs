// DC79061: 1509 16th St NW, Commercial-Office, 1920s brick-and-limestone office block (Height Act era: the
// roof sits near the 90 ft avenue cap). Four storeys over a shopfront, cream stone piers and string courses,
// brick spandrels, a calcite cornice and parapet, one flat roof tier (the 10s in the lidar are noise).
// Shell = footprint cells with a street face; interior cells are air between floor slabs (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79061.cells.json", "utf8"));
const SIZE = [13, 23, 7];
const TOP = 10;                                    // lidar roof 11 = top course at y 10; parapet caps it

const foot = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) => Object.keys(DIRS).filter((d) => !inFoot(x + DIRS[d][0], z + DIRS[d][1]));
const inward = (x, z, d) => [x - DIRS[d][0], z - DIRS[d][1]];   // the cell behind a face
const isInterior = (x, z) => inFoot(x, z) && faces(x, z).length === 0;

const M = new Map();                               // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => M.has(`${x},${y},${z}`);

const PIER = "calcite", BRICK = "bricks", BASE = "polished_andesite", FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane", SLAB = "smooth_stone";
const WINDOW_ROWS = [2, 4, 6, 8];

function shellBlock(x, y, z, f) {
  if (y === 1) return BASE;                        // base course
  if (f.length >= 2) return PIER;                  // quoins at the corners
  if (y === 3 || y === 9 || y === TOP) return PIER;   // string courses, cornice, parapet
  const c = f[0] === "N" || f[0] === "S" ? x : z;  // position along the face
  if (c % 2 === 0) return PIER;                    // pilasters
  if (WINDOW_ROWS.includes(y)) {
    const [ix, iz] = inward(x, z, f[0]);
    return isInterior(ix, iz) ? GLASS : BRICK;      // glazing only with an air gap behind it
  }
  return BRICK;                                    // spandrels at y 5 and 7
}

for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  put(x, 0, z, FOUND);                             // foundation to the lowest ground (y 0)
  if (f.length) {
    for (let y = 1; y <= TOP; y++) put(x, y, z, shellBlock(x, y, z, f));
  } else {
    for (let y = 1; y <= TOP; y++) put(x, y, z, SLAB);   // solid core: no hanging floors over voids
  }
}

// the only air inside is one cell deep behind each window (the gap behind the glass), on the window rows
for (const k of [...M.keys()]) {
  const [x, y, z] = k.split(",").map(Number);
  if (!WINDOW_ROWS.includes(y) || M.get(k)?.block !== GLASS) continue;
  const f = faces(x, z);
  const [ix, iz] = inward(x, z, f[0]);
  M.delete(`${ix},${y},${iz}`);
}

// the entrance: a door in the base course on the north front, under the calcite pier column at x 6
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(6, 1, 0, "dark_oak_door", doorState("lower"));
put(6, 2, 0, "dark_oak_door", doorState("upper"));
M.delete("6,2,1");                                 // the vestibule behind the door is air
// a dark awning band over the door, and a warm lantern hung inside the vestibule
for (const x of [5, 6, 7]) put(x, 3, 0, "gray_concrete");
put(6, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// warm lights: lanterns hung in the ground-floor shop, glowstone and shroomlight behind selected windows
for (const x of [5, 7]) put(x, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  if (f.length !== 1) continue;
  const c = f[0] === "N" || f[0] === "S" ? x : z;
  const [ix, iz] = inward(x, z, f[0]);
  if (!isInterior(ix, iz)) continue;
  if (M.get(`${x},4,${z}`)?.block === GLASS && c % 4 === 1) put(ix, 4, iz, "glowstone");
  if (M.get(`${x},8,${z}`)?.block === GLASS && c % 4 === 3) put(ix, 8, iz, "shroomlight");
}

// roof: three mechanical units on the roof deck, one with a lantern
const roofDeck = [...foot.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => isInterior(x, z) && x % 4 === 2);
for (const [x, z] of roofDeck.slice(0, 3)) put(x, 11, z, "light_gray_concrete");
if (roofDeck[0]) put(roofDeck[0][0], 12, roofDeck[0][1], "lantern", { hanging: "false", waterlogged: "false" });

// panes join their neighbours on the wall plane (a solid block or another pane), as the game draws them
const NOCONNECT = /(lantern|door)$/;
const panes = [...M.keys()].filter((k) => M.get(k).block === GLASS || M.get(k).block.endsWith("_glass_pane"));
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const conn = (dx, dz) => { const n = M.get(`${x + dx},${y},${z + dz}`); return !!n && !NOCONNECT.test(n.block); };
  M.get(k).state = { north: String(conn(0, -1)), south: String(conn(0, 1)), east: String(conn(1, 0)), west: String(conn(-1, 0)), waterlogged: "false" };
}

// every column stands on the ground: nothing above a full-height void (lanterns hang from a slab, so they are exempt)
// the one-cell pockets behind the glass are capped by the storey's slab, which spans over them from the solid core
const floating = [...M.keys()].filter((k) => {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || M.get(k).block.includes("lantern")) return false;
  for (let yy = 0; yy < y; yy++) if (has(x, yy, z)) return false;
  return true;
});
if (floating.length) console.warn("floating columns:", floating.slice(0, 12));

const g = new Voxels(SIZE);
for (const [k, { block, state }] of M) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79061.nbt");
console.log(out);

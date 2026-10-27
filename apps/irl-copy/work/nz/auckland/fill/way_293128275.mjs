// Stratis: a five-storey 1960s reinforced-concrete office block on a dark volcanic-stone plinth (Auckland's basalt),
// white concrete piers in a 3-block bay grid with blue-tinted glass, a shopfront at street level, and a setback top
// floor with a roof terrace and a plant room. The footprint and ground come from the cells file; each storey is a
// two-layer shell (glass or pier on the outside, an air gap behind the glass) with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128275.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128275.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 53, H = 35, D = 111;
const CONC = "white_concrete", BAND = "light_gray_concrete", GLASS = "light_blue_stained_glass_pane";
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;

const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
// depth: 1 on the outer skin, growing inward (multi-source BFS from outside the footprint)
const depth = new Map(), queue = [];
for (const [x, z] of cells) if (NB.some(([dx, dz]) => !ground.has(key(x + dx, z + dz)))) { depth.set(key(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(key(x, z));
  for (const [dx, dz] of NB) { const k = key(x + dx, z + dz); if (ground.has(k) && !depth.has(k)) { depth.set(k, d + 1); queue.push([x + dx, z + dz]); } }
}
const dep = (x, z) => depth.get(key(x, z)) ?? 0;
const pier = (x, z) => (x + z) % 3 === 0;                       // 1-block piers every 3 along any face
const warm = (x, y, z) => (x * 7 + y * 5 + z * 3) % 9 === 0;     // about one window in nine lit from behind

const plan = new Map();
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  plan.set(`${x},${y},${z}`, { block, state });
};

// Storeys: B = floor slab row, T = top row (lintel, or the cap on the top floor), I = setback inset from the outer skin.
const STOREYS = [
  { B: 4, T: 7, I: 0, win: [5, 6], glass: "cyan_stained_glass_pane", lintel: "dark_oak_planks" },   // shopfront + fascia
  { B: 8, T: 11, I: 0, win: [9, 10], lintel: BAND },
  { B: 12, T: 15, I: 0, win: [13, 14], lintel: BAND },
  { B: 16, T: 19, I: 0, win: [17, 18], lintel: BAND },
  { B: 20, T: 22, I: 2, win: [21], roof: true },                                                    // setback top floor
];

for (const [x, z, gr] of cells) {
  const d = dep(x, z);
  // Plinth: solid from y 0 up to the first floor (the foundation to the ground, and the downhill side's lower storeys).
  // Where the ground is low, its outer skin carries basement glass with an air gap behind it.
  for (let y = 0; y <= 3; y++) {
    const low = gr <= 1 && (y === 1 || y === 2) && !pier(x, z);
    if (d === 2 && low) continue;
    if (d === 1 && low) { put(x, y, z, GLASS); continue; }
    put(x, y, z, y === 3 && d === 1 ? "polished_andesite" : "stone_bricks");
  }
  for (const s of STOREYS) {
    const O = s.I + 1, N = s.I + 2;
    put(x, s.B, z, BAND);                                    // floor slab / string course across the footprint
    if (d < O) continue;                                      // setback ring: just the terrace floor
    for (let y = s.B + 1; y <= s.T; y++) {
      const top = y === s.T, isWin = s.win.includes(y);
      if (d === O) {
        if (top) put(x, y, z, s.roof ? "smooth_stone_slab" : s.lintel, s.roof ? { type: "top", waterlogged: "false" } : undefined);
        else if (isWin && !pier(x, z)) put(x, y, z, s.glass ?? GLASS);
        else put(x, y, z, CONC);
      } else if (d === N) {
        if (top) put(x, y, z, s.roof ? "smooth_stone" : CONC);
        else if (isWin && !pier(x, z)) { if (warm(x, y, z)) put(x, y, z, "glowstone"); }   // else the air gap
        else put(x, y, z, CONC);
      } else if (top && s.roof) put(x, y, z, "smooth_stone");   // roof plate over the top floor
    }
  }
}

// Entrance: the middle of the outer cells on one of the long faces (facing across x), a dark-oak door with lanterns and an awning band.
const onXFace = cells.filter(([x, z]) => dep(x, z) === 1 && NB.some(([dx, dz]) => dz === 0 && !ground.has(key(x + dx, z + dz))));
onXFace.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
const [ex, ez] = onXFace[Math.floor(onXFace.length / 2)];
const out = NB.find(([dx, dz]) => dz === 0 && !ground.has(key(ex + dx, ez + dz)));
const facing = DIR[out.join(",")];
const along = out[0] !== 0 ? [0, 1] : [1, 0];                // the wall's direction, across the door
const at = (k, j = 0, y) => [ex + along[0] * k - out[0] * j, y, ez + along[1] * k - out[1] * j];
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
put(ex, 5, ez, "dark_oak_door", doorState("lower"));
put(ex, 6, ez, "dark_oak_door", doorState("upper"));
for (const k of [-2, 2]) put(...at(k, 0, 6), "lantern", { hanging: "true", waterlogged: "false" });
for (let k = -2; k <= 2; k++) for (let j = 0; j <= 1; j++) {
  const [cx, , cz] = at(k, j, 8);
  if (dep(cx, cz) < 1) continue;
  put(cx, 8, cz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Roof: a plant room on the top floor's roof, placed where a 9 x 5 rectangle sits fully inside the interior (depth >= 6).
const inside = (x, z) => dep(x, z) >= 6;
const centre = cells.reduce((a, [x, z]) => [a[0] + x, a[1] + z], [0, 0]).map((v) => v / cells.length);
const cand = cells.filter(([x, z]) => inside(x, z)).sort((a, b) =>
  Math.hypot(a[0] - centre[0], a[1] - centre[1]) - Math.hypot(b[0] - centre[0], b[1] - centre[1]));
const spot = cand.find(([x0, z0]) => {
  for (let x = x0 - 4; x <= x0 + 4; x++) for (let z = z0 - 2; z <= z0 + 2; z++) if (!inside(x, z)) return false;
  return true;
});
if (spot) {
  const [x0, z0] = spot;
  for (let x = x0 - 4; x <= x0 + 4; x++) for (let z = z0 - 2; z <= z0 + 2; z++) {
    const edge = x === x0 - 4 || x === x0 + 4 || z === z0 - 2 || z === z0 + 2;
    for (let y = 23; y <= 25; y++) if (edge) put(x, y, z, BAND);
    put(x, 26, z, "smooth_stone");
  }
}

// Glass panes connect to their in-plane neighbours only (not inward into the air gap).
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
for (const [k, v] of plan) {
  if (!v.block.endsWith("glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number), d0 = dep(x, z);
  const st = {};
  for (const [dx, dz, name] of DIRS) {
    const inward = dep(x + dx, z + dz) === d0 + 1;
    st[name] = !inward && plan.has(`${x + dx},${y},${z + dz}`) ? "true" : "false";
  }
  v.state = { ...st, waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, v] of plan) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const res = g.save(OUT);
console.log(`Stratis: ${cells.length} footprint cells, ${res.blocks} blocks, palette ${res.palette}, entrance at ${ex},${ez} facing ${facing}, roof plant ${spot ? "placed" : "skipped"}`);

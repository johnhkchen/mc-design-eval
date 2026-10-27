// WO Carpark, Mt Eden / Eden Terrace side of the CBD: a six-level precast car park (1970s-80s concrete, open bays
// with iron rails) on a flat datum 24 blocks up (20 m), with two glazed office towers rising from it to 64 blocks
// (about 16 storeys at 4 per storey). Tiers are 24 (podium), 36 (shoulder setback), 64 (tower), each on a storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_440548418.cells.json", "utf8"));
const SIZE = [61, 76, 46];
const PODIUM = 24, SHOULDER = 36, TOWER = 64;
const tierOf = (h) => (h >= 55 ? TOWER : h >= 30 ? SHOULDER : PODIUM);

// the footprint: g = ground, t = tier top; one majority pass over each cell and its four neighbours, so the tier edges
// are clean outlines rather than lidar speckle
const raw = new Map(cells.map(([x, z, g, roof]) => [`${x},${z}`, { x, z, g, t: tierOf(roof) }]));
const at = (x, z) => raw.get(`${x},${z}`);
const cell = new Map();
for (const [k, c] of raw) {
  const votes = new Map();
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(c.x + dx, c.z + dz); if (n) votes.set(n.t, (votes.get(n.t) ?? 0) + 1);
  }
  let best = c.t;
  for (const [t, n] of votes) if (n > (votes.get(best) ?? 0)) best = t;
  cell.set(k, { ...c, t: best });
}
const cellAt = (x, z) => cell.get(`${x},${z}`);

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
// the faces of a cell's wall at layer y that show to air: out of the footprint, or the neighbour's roof lies below y
const exposed = (c, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const n = cellAt(c.x + dx, c.z + dz);
  return !n || y >= n.t;
});
const along = (c, ex) => (ex.some((d) => d === "n" || d === "s") ? c.x : c.z);
const isPier = (c, ex) => along(c, ex) % 3 === 0;                    // the mullion grid; narrow towers keep glass between piers
const isPillar = (c) => c.x % 6 === 3 && c.z % 6 === 3;             // structural grid inside, so no floor hangs
const isPlant = (c) => c.t === TOWER && exposed(c, c.t).length === 0 && [2, 3].includes(c.x % 7) && [2, 3].includes(c.z % 7);
const isEntrance = (c) => c.z === 0 && c.x >= 48 && c.x <= 50;      // the north face: the only street-level door

// a few tower windows get a glowstone in the air gap just inside the glass
const glow = new Set();
for (const c of cell.values()) {
  for (let y = Math.max(PODIUM, c.g); y < c.t - 1; y++) {
    if (y % 4 === 3) continue;
    const ex = exposed(c, y);
    if (!ex.length || isEntrance(c) || isPier(c, ex) || (c.x * 5 + c.z * 7 + y) % 13 !== 0) continue;
    const [dx, dz] = DIRS[ex[0]];
    const q = cellAt(c.x - dx, c.z - dz);
    if (q && y >= q.g && y < q.t - 1 && exposed(q, y).length === 0) glow.add(`${q.x},${q.z},${y}`);
  }
}

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

function layer(c, y) {
  const { x, z, g: base, t } = c;
  if (glow.has(`${x},${z},${y}`)) return put(x, y, z, "glowstone");
  const ex = exposed(c, y);
  if (ex.length && isEntrance(c)) {
    if (y <= 1) return x === 49
      ? put(x, y, z, "iron_door", { facing: "south", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" })
      : put(x, y, z, "light_blue_stained_glass");
    if (y === 2) return put(x, y, z, "polished_andesite");          // the canopy header over the door
  }
  if (y === t - 1) return put(x, y, z, ex.length ? "smooth_stone" : "gray_concrete"); // cornice; roof deck
  if (!ex.length) {                                                  // the interior: floor plates, columns, air
    if (y % 4 === 3) return put(x, y, z, "light_gray_concrete");
    if (isPillar(c)) return put(x, y, z, "light_gray_concrete");
    return;
  }
  if (y === base) return put(x, y, z, "polished_andesite");          // the base course at the ground
  if (y % 4 === 3) return put(x, y, z, "white_concrete");           // storey line: spandrel band
  if (y < PODIUM) {                                                  // the car park: piers, open bays, rails, lanterns
    if (isPier(c, ex)) return put(x, y, z, "light_gray_concrete");
    if (y % 4 === 0) return put(x, y, z, "iron_bars");
    if (y % 4 === 2 && along(c, ex) % 6 === 1) return put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    return;
  }
  if (isPier(c, ex)) return put(x, y, z, "white_concrete");          // the office tower: glazed bays between piers
  return put(x, y, z, "light_blue_stained_glass");
}

for (const c of cell.values()) {
  const { x, z, g: base, t } = c;
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");        // the foundation, solid to the ground
  for (let y = base; y < t; y++) layer(c, y);
  if (exposed(c, t).length) put(x, t, z, "light_gray_concrete");       // the parapet
  if (isPlant(c)) { put(x, t, z, "light_gray_concrete"); put(x, t + 1, z, "light_gray_concrete"); } // roof plant
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_440548418.nbt";
const stats = g.save(out);
console.log(JSON.stringify({ footprint: cell.size, ...stats }));

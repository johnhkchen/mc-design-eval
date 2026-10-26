import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1920s Federal-revival office block on the Mall's flank: red brick walls on a granite plinth, pale limestone
// (calcite piers, smooth-stone sills, floor bands and cornice), a 6-block (two-storey) wing rising in steps to a
// 9-block (three-storey) body and an 11-block top tier with rooftop plant. Setbacks show as roof terraces with a parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75311.cells.json`, "utf8"));

const W = 17, H = 23, D = 18;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));

// Lidar roof, median over a 5x5 window, then snapped to three clean tiers: 6, 9, 11 blocks
const TIER = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++)
    for (let dx = -2; dx <= 2; dx++) {
      const c = raw.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  TIER.set(key(x, z), med <= 7 ? 6 : med <= 9 ? 9 : 11);
}
const T = (x, z) => TIER.get(key(x, z));

// Directions: N/S walls run along x, E/W walls run along z. A neighbour outside the footprint is ground (tier 0);
// a lower neighbour exposes this cell's wall above its roof, so setbacks show their own faces.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const nbTop = (x, z, d) => { const [dx, dz] = DIRS[d]; return has(x + dx, z + dz) ? T(x + dx, z + dz) : 0; };
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => y >= nbTop(x, z, d));

const cellsList = cells.map((c) => [c[0], c[1]]);

// Building: every column is solid from y 0 to its tier's top, interior columns carry a floor slab per storey and
// a roof deck; facade columns carry the articulated skin (plinth, bands, windows and piers, cornice, parapet).
for (const [x, z] of cellsList) {
  const top = T(x, z);
  for (let y = 0; y < top; y++) {
    const E = exposed(x, z, y);
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }        // plinth / ground floor slab
    if (!E.length) {
      if (y === top - 1) g.set(x, y, z, "deepslate_tiles");                // roof deck
      else if (y % STOREY === 0) g.set(x, y, z, "smooth_stone");           // floor slab per storey
      continue;                                                            // air behind the glass
    }
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }       // cornice course
    if (y % STOREY === 0) { g.set(x, y, z, "smooth_stone"); continue; }    // floor band
    const runsX = E.includes("N") || E.includes("S");
    const runsZ = E.includes("W") || E.includes("E");
    const u = runsX ? x : z;
    // bays of four: two glazed, a limestone pier at the corner-side, and a brick spandrel between
    if ((runsX && runsZ) || u % 4 === 0) { g.set(x, y, z, "calcite"); continue; }   // corner and every fourth bay: limestone pier
    if (u % 4 === 3) { g.set(x, y, z, "bricks"); continue; }                        // brick between windows
    g.set(x, y, z, "glass_pane", runsX
      ? { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }
      : { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" });
  }
  // Parapet course on any column with a wall at its top
  if (exposed(x, z, top - 1).length) g.set(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// The entrance: a dark oak door in a window bay of the south (street) face, at ground level, centred on that run
const south = cellsList.filter(([x, z]) => exposed(x, z, 1).includes("S") && T(x, z) >= 6);
const sx = south.map(([x]) => x).sort((a, b) => a - b);
const midX = sx[Math.floor(sx.length / 2)];
const door = south
  .filter(([x, z]) => x % 4 === 1 && exposed(x, z, 1).length === 1)
  .sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))[0];
if (door) {
  const [dx, dz] = door;
  g.set(dx, 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light: lanterns and glowstone standing on the floor slab, in the air gap behind some glass
for (const [x, z] of cellsList) {
  const top = T(x, z);
  for (const y of [1, 4, 7]) {
    if (y >= top - 1) continue;
    const E = exposed(x, z, y);
    if (!E.length || (door && door[0] === x && door[1] === z)) continue;
    const d = E[0];
    const u = d === "N" || d === "S" ? x : z;
    if (E.length > 1 || u % 4 === 0 || u % 4 === 3) continue;                     // only behind a glazed bay
    const [dx, dz] = DIRS[d];
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz) || exposed(ix, iz, y).length || y >= T(ix, iz) - 1) continue;
    const h = (x * 5 + z * 3 + y * 7) % 6;
    if (h === 0) g.set(ix, y, iz, "glowstone");
    else if (h === 2 || h === 4) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop plant on the top tier: two-block units on the deck, away from the parapet
for (const [x, z] of cellsList) {
  if (T(x, z) !== 11 || exposed(x, z, 10).length) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    g.set(x, 11, z, "stone_bricks");
    g.set(x, 12, z, "stone_bricks");
  }
}

const res = g.save(`${DIR}/DC75311.nbt`);
console.log(JSON.stringify(res));

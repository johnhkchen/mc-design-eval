// P. Hayman & Co.: a six-storey Edwardian commercial block (brick on a stone base, stone bands and cornice, shopfronts
// at street level), stepped down to a two-storey-lower wing on the lidar's low edges and up to a short attic core on the
// east. Hollow: a 1-block shell with air behind the glass and a floor slab per storey, nothing built off the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_884055554.cells.json", "utf8"));   // [x, z, ground, roof]

const g = new Voxels([45, 41, 42]);

// the footprint, and each cell's tier top: the lidar roof, averaged over 5x5 and quantised to three flat tiers
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { g: ground, r: roof });
const inF = (x, z) => F.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const roofMean = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const c = F.get(`${x + dx},${z + dz}`); if (c) { s += c.r; n++; } }
  return s / n;
};
const tierTop = (m) => (m <= 24.5 ? 22 : m <= 26.5 ? 26 : 28);
const tiers = { 22: 0, 26: 0, 28: 0 };
for (const [key, c] of F) { const [x, z] = key.split(",").map(Number); c.T = tierTop(roofMean(x, z)); tiers[c.T]++; }

// storey bands start at 2, 6, 10 ... ; FLOORS are the storey slabs plus the setback decks at 21 and 25
const BANDS = [2, 6, 10, 14, 18, 22, 26];
const FLOORS = new Set([2, 6, 10, 14, 18, 22, 21, 25]);
const band = (y) => BANDS.filter((b) => b <= y).pop();

// exposed faces of a cell at height y: off the footprint, or above the neighbour's tier top
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = F.get(`${x + dx},${z + dz}`); return !n || n.T <= y; });
const isRing = (x, z, y) => exposed(x, z, y).length > 0;

// the entrance: on the facade with the most plain wall at street level, the middle bay (a window bay) of it
const dirCount = new Map(DIRS.map((d) => [d.join(), 0]));
for (const [key, c] of F) { const [x, z] = key.split(",").map(Number); const e = exposed(x, z, 2); if (e.length === 1) dirCount.set(e[0].join(), dirCount.get(e[0].join()) + 1); }
const entryDir = DIRS.reduce((best, d) => (dirCount.get(d.join()) > dirCount.get(best.join()) ? d : best));
const entryBays = [];
for (const [key, c] of F) { const [x, z] = key.split(",").map(Number); const e = exposed(x, z, 2); if (e.length === 1 && e[0].join() === entryDir.join()) { const a = entryDir[0] !== 0 ? z : x; if (a % 3 === 1) entryBays.push(a); } }
entryBays.sort((p, q) => p - q);
const doorA = entryBays[Math.floor(entryBays.length / 2)];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const glassState = (alongZ) => (alongZ ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" });
const warm = (x, y, z) => (x * 7 + z * 13 + y * 5) % 11 === 0;   // about one window in eleven gets a light behind it

let panes = 0, lights = 0, walls = 0;
for (const [key, c] of F) {
  const [x, z] = key.split(",").map(Number);
  const T = c.T;
  // foundation and base floor: solid from y 0 up to the cell's ground (at least the first floor level)
  for (let y = 0; y <= Math.max(c.g, 1); y++) g.set(x, y, z, "stone_bricks");
  for (let y = 2; y < T; y++) {
    const ex = exposed(x, z, y);
    if (y === T - 1) { g.set(x, y, z, ex.length ? "stone_bricks" : "smooth_stone"); continue; }   // parapet cap / roof deck
    if (!ex.length) { if (FLOORS.has(y)) g.set(x, y, z, "stone_bricks"); continue; }                 // slab or air gap
    walls++;
    // a cell open on two sides is a step in the diagonal edge: it takes the first face, so the bays run on past it
    const [dx, dz] = ex[0];
    const alongZ = dx !== 0, a = alongZ ? z : x;
    const b = band(y), r = y - b, ground = b === 2;
    if (ground) {
      if (r === 0) { g.set(x, y, z, "polished_andesite"); continue; }
      if (r === 3) { g.set(x, y, z, "stone_bricks"); continue; }                                       // shopfront fascia
      if (dx === entryDir[0] && dz === entryDir[1] && a === doorA) {
        g.set(x, y, z, "oak_door", { facing: FACING[entryDir.join()], half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (a % 3 === 0) { g.set(x, y, z, "stone_bricks"); continue; }                                 // shopfront piers
      g.set(x, y, z, "glass_pane", glassState(alongZ)); panes++;
    } else {
      if (r === 0) { g.set(x, y, z, "stone_bricks"); continue; }                                       // string course
      if (r === 3) { g.set(x, y, z, "bricks"); continue; }                                             // lintel course
      if (a % 3 === 0) { g.set(x, y, z, "bricks"); continue; }                                         // brick piers
      g.set(x, y, z, "glass_pane", glassState(alongZ)); panes++;
    }
    // warm light behind the glass: a glowstone in the air cell just inside the pane
    if (warm(x, y, z)) {
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && !isRing(ix, iz, y) && !FLOORS.has(y) && y < F.get(`${ix},${iz}`).T - 1) { g.set(ix, y, iz, "glowstone"); lights++; }
    }
  }
}

// roof: plant boxes on the middle tier, a lift-core on the attic core
let cx = 0, cz = 0, cn = 0;
for (const [key, c] of F) if (c.T === 28) { const [x, z] = key.split(",").map(Number); cx += x; cz += z; cn++; }
cx = Math.round(cx / cn); cz = Math.round(cz / cn);
for (const [key, c] of F) {
  const [x, z] = key.split(",").map(Number);
  if (c.T === 28 && Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1 && !isRing(x, z, 27)) for (let y = 28; y <= 30; y++) g.set(x, y, z, y === 30 ? "stone_bricks" : "bricks");
  if (c.T === 26 && x % 12 >= 4 && x % 12 <= 8 && z % 12 >= 3 && z % 12 <= 6 && !isRing(x, z, 25) && !DIRS.some(([dx, dz]) => { const n = F.get(`${x + dx},${z + dz}`); return !n || n.T < 26; }))
    g.set(x, 26, z, "light_gray_concrete"), g.set(x, 27, z, "light_gray_concrete");
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_884055554.nbt");
console.log(JSON.stringify({ cells: F.size, tiers, entryDir, doorA, walls, panes, lights, ...out }));

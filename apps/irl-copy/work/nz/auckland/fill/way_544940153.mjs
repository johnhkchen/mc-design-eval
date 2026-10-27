import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 544940153: a nine-storey reinforced-concrete office block of the 1970s-80s (flat roof, tinted glass in
// ribbon bays between white concrete piers, a polished-andesite base and lintels, a stone ground floor with
// shopfronts and a timber-hooded entrance), with a four-storey wing on its south-east side. The lidar roof is
// flat at 37-38 across the tower and 20 on the wing, so the massing follows it; its edge cells read low (0-2, 15,
// 25) and are smoothed into the tiers around them.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const X = 24, Y = 54, Z = 22;
const TOWER = "T", WING = "W";
const HEIGHT = { T: 38, W: 20 };                       // roof surface above y 0
const STOREYS = { T: [6, 10, 14, 18, 22, 26, 30, 34], W: [6, 10, 14] };  // each storey: spandrel, two window rows, string
const ROOF_ROW = { T: 37, W: 18 };                     // the top solid row inside; the parapet/cornice sits here at the edge
const GROUND_CEILING = 5;                              // the lintel row over the shopfronts

const cells = JSON.parse(readFileSync(`${DIR}/way_544940153.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const isFoot = (x, z) => raw.has(key(x, z));
const around = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  .map(([dx, dz]) => raw.get(key(x + dx, z + dz))).filter(Boolean);

// Massing: the lidar's roof reads 37-38 on the tower and ~20 on the wing. Cells at 30+ are tower, the 16-29 band is
// wing unless most of its neighbours are tower, and the noise under 16 takes its neighbours' vote.
const cls = new Map();
for (const c of raw.values()) {
  const towerNeighbours = around(c.x, c.z).filter((n) => n.r >= 30).length;
  const k = key(c.x, c.z);
  if (c.r >= 30) cls.set(k, TOWER);
  else if (c.r > 15) cls.set(k, towerNeighbours >= 4 ? TOWER : WING);
  else cls.set(k, towerNeighbours >= 4 ? TOWER : WING);
}
const classOf = (x, z) => cls.get(key(x, z));

// Exposure: which sides of a footprint cell face outside it (the facade) and which open into the building.
const exposed = (x, z) => ({ N: !isFoot(x, z - 1), S: !isFoot(x, z + 1), W: !isFoot(x - 1, z), E: !isFoot(x + 1, z) });
const isPerimeter = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.W || e.E; };

// A pier is a column on the bay grid (every third block along a face): solid white concrete in front of the glass,
// so the facade reads as bays rather than a sheet. On the stepped edges nearly every cell faces two ways, so a corner
// is a pier only when it also sits on the grid; the rest keep their glass.
const isPier = (x, z) => {
  const e = exposed(x, z), ns = e.N || e.S, ew = e.W || e.E;
  return (ns && ew && (x % 3 === 0 || z % 3 === 0)) || (ns && x % 3 === 0) || (ew && z % 3 === 0);
};

// Facade rows, bottom up: base course, shopfront (ground floor), lintel, then each storey's band.
function facadeBlock(c, x, z, y, g, pier) {
  if (y === g) return ["polished_andesite"];
  if (y <= 4) return [pier ? "stone_bricks" : "light_blue_stained_glass"];
  if (y === GROUND_CEILING) return ["polished_andesite"];
  if (c === TOWER && y >= ROOF_ROW.T) return ["smooth_stone"];
  if (c === WING && y >= ROOF_ROW.W) return ["smooth_stone"];
  const rel = (y - 6) % 4;
  if (rel === 0 || rel === 3) return [pier ? "white_concrete" : "light_gray_concrete"];
  if (pier) return ["white_concrete"];
  return [(x * 7 + z * 5 + y) % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass"];
}

const v = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => v.set(x, y, z, block, state);

// The entrance: the south-facing perimeter cell of the tower nearest the middle of that face.
const southFacing = [...raw.values()].filter((c) => exposed(c.x, c.z).S && classOf(c.x, c.z) === TOWER);
const midX = southFacing.reduce((s, c) => s + c.x, 0) / southFacing.length;
const door = southFacing.reduce((best, c) => (Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best));
const canopy = new Set([key(door.x - 1, door.z), key(door.x, door.z), key(door.x + 1, door.z)]);

// Solid below each cell's ground (foundation), then the building up to its roof.
for (const c of raw.values()) {
  const { x, z, g } = c, k = classOf(x, z), top = HEIGHT[k], perim = isPerimeter(x, z), pier = isPier(x, z);
  for (let y = 0; y < g; y++) set(x, y, z, "stone_bricks");
  if (perim && (x === door.x && z === door.z)) {
    set(x, g + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, g + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  for (let y = g; y < top; y++) {
    if (perim) {
      if (door && x === door.x && z === door.z && (y === g + 1 || y === g + 2)) continue;
      if (canopy.has(key(x, z)) && y === g + 3 && exposed(x, z).S) {
        set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
        continue;
      }
      if (y > ROOF_ROW[k] + 1) continue;
      const [block, state] = facadeBlock(k, x, z, y, g, pier);
      set(x, y, z, block, state);
    } else if (y === ROOF_ROW[k]) {
      set(x, y, z, "gray_concrete");
    } else if (y === g || y === GROUND_CEILING || STOREYS[k].includes(y)) {
      set(x, y, z, "smooth_stone");
    }
  }
}

// Canopy over the entrance: the cell inside the door carries the hood too.
if (isFoot(door.x, door.z - 1) && !isPerimeter(door.x, door.z - 1)) {
  const inner = raw.get(key(door.x, door.z - 1));
  set(door.x, inner.g + 3, door.z - 1, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// Warm light behind some upper-storey windows: a glowstone in the interior cell the glass faces.
const inward = (x, z, e) => (e.S ? [x, z - 1] : e.N ? [x, z + 1] : e.E ? [x - 1, z] : [x + 1, z]);
let glows = 0;
for (const c of raw.values()) {
  const { x, z, g } = c, k = classOf(x, z), e = exposed(x, z);
  if (!isPerimeter(x, z) || isPier(x, z)) continue;
  for (const y of [...STOREYS[k].flatMap((f) => [f + 1, f + 2])]) {
    if (y <= 5 || y >= ROOF_ROW[k]) continue;
    if ((x * 5 + z * 3 + y) % 7 !== 0) continue;
    const [ix, iz] = inward(x, z, e);
    if (!isFoot(ix, iz) || isPerimeter(ix, iz)) continue;
    set(ix, y, iz, "glowstone"); glows++;
  }
}

// Roof plant: small units on the tower's roof deck, 2 by 2 on a rhythm, standing on the deck.
let plant = 0;
for (const c of raw.values()) {
  const { x, z } = c;
  if (classOf(x, z) !== TOWER || isPerimeter(x, z)) continue;
  if (x % 6 === 2 || x % 6 === 3) if (z % 6 === 2 || z % 6 === 3) { set(x, HEIGHT.T, z, "light_gray_concrete"); plant++; }
}

const counts = v.save(`${DIR}/way_544940153.nbt`);
const towerCells = [...cls.values()].filter((k) => k === TOWER).length;
console.log(`way_544940153: ${v.count()} blocks (palette ${counts.palette}); tower cells ${towerCells}, wing cells ${cls.size - towerCells}; glowstones ${glows}; plant units ${plant}; door at (${door.x}, ${door.z})`);

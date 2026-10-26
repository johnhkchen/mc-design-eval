// FR245184613: a residential Haussmann-style block of 1880, seven storeys (a ground floor, five floors and a
// mansard attic) built on the lidar footprint. Storeys are 4 blocks (a floor string at y = 1 mod 4, two window rows,
// a lintel), so the attic floor sits at y = 25 and the mansard (26-28) tops the lidar's 29. The lidar's falloff on the
// rim (24-28, and noisy dips to 17-18) is the mansard's eave, so the roof is one stepped mass, not per-cell tops.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184613.cells.json`, "utf8"));

const W = 20, H = 45, D = 19;
const ATTIC = 25;                                   // the attic floor; the cornice sits on the rim here
const ROOF = 29;                                    // the lidar's roof height: blocks run up to y = 28

const fp = new Map();                               // "x,z" -> { x, z, g, lidar, d }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { x, z, g, lidar: r, d: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const exposed = (x, z) => NEI.filter(([, dx, dz]) => !at(x + dx, z + dz)).map(([n]) => n);

// Distance inward from the rim (rim = 0): the mansard steps in one block per row, and the lidar agrees on the rim.
const queue = [];
for (const c of fp.values()) if (exposed(c.x, c.z).length) queue.push(c);
const seen = new Set(queue.map((c) => `${c.x},${c.z}`));
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [, dx, dz] of NEI) {
    const n = at(c.x + dx, c.z + dz), k = `${c.x + dx},${c.z + dz}`;
    if (n && !seen.has(k)) { seen.add(k); n.d = c.d + 1; queue.push(n); }
  }
}

// The way out of a mansard step at distance d: the rim side (for the rim itself, the open side).
function outwardOf(x, z, d) {
  for (const [name, dx, dz] of NEI) {
    const n = at(x + dx, z + dz);
    if (d === 0 ? !n : n && n.d === d - 1) return name;
  }
  return "north";
}

// Doors: the middle of the north run and the south run, each with a chiseled bay over it and lanterns either side.
const door = new Map(), bay = new Map(), lantern = new Map();
for (const [zEdge, facing] of [[Math.min(...[...fp.values()].map((c) => c.z)), "north"], [Math.max(...[...fp.values()].map((c) => c.z)), "south"]]) {
  const xs = [...fp.values()].filter((c) => c.z === zEdge).map((c) => c.x).sort((a, b) => a - b);
  const x0 = xs[Math.floor(xs.length / 2)];
  door.set(`${x0},${zEdge}`, facing);
  for (const dx of [-1, 0, 1]) bay.set(`${x0 + dx},${zEdge}`, facing);
  for (const dx of [-1, 1]) lantern.set(`${x0 + dx},${zEdge}`, facing);
}

// Classify one cell: [block, state] or null (air). Rows: y = 0 plinth (solid under every cell, the foundation where
// the ground is raised); y = 1 mod 4 floor string (solid); y = 0 mod 4 lintel; y = 2, 3 window band with the
// piers; attic floor at 25; mansard 26-28 stepping in one block a row.
function cls(x, z, y) {
  const c = at(x, z); if (!c) return null;
  if (y === 0) return ["stone_bricks"];
  if (y >= ROOF) return null;
  if (y >= ATTIC) {
    if (y === ATTIC) return c.d === 0 ? ["stone_bricks"] : ["smooth_stone"];   // cornice on the rim, floor slab inside
    const j = y - (ATTIC + 1), d = c.d;
    if (d === j) return ["deepslate_tile_stairs", { facing: outwardOf(x, z, d), half: "bottom", shape: "straight", waterlogged: "false" }];
    if (d > j) return ["deepslate_tiles"];
    return null;                                                             // the roof steps in above this row
  }
  if (y % 4 === 1) return ["smooth_stone"];                                  // storey string = floor slab
  const dirs = exposed(x, z), ext = dirs.length > 0;
  if (!ext) return null;                                                     // interior air behind the facade
  const dk = `${x},${z}`;
  if (y === 4 && bay.has(dk)) return ["chiseled_stone_bricks"];
  if (y === 3 && lantern.has(dk)) return ["lantern", { hanging: "true", waterlogged: "false" }];
  if ((y === 2 || y === 3) && door.has(dk)) {
    return ["dark_oak_door", { facing: door.get(dk), half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y % 4 === 0) return ["stone_bricks"];                                  // lintel band over each window row
  const onZ = dirs.includes("north") || dirs.includes("south"), onX = dirs.includes("east") || dirs.includes("west");
  if (onZ && onX) return ["calcite"];                                        // corner pier
  if ((onZ ? x : z) % 3 === 0) return ["calcite"];                          // pier between window pairs
  const st = onZ ? { north: "false", south: "false", east: "true", west: "true" }
                 : { north: "true", south: "true", east: "false", west: "false" };
  if (y === 6) return ["iron_bars", st];                                     // noble floor: a balcony rail at the sill
  return ["glass_pane", st];
}

const g = new Voxels([W, H, D]);
for (const c of fp.values()) {
  for (let y = 0; y < H; y++) { const b = cls(c.x, c.z, y); if (b) g.set(c.x, y, c.z, b[0], b[1]); }
}

// Warm light behind some upper-floor glass: a glowstone one cell inside the pane (the air gap stays everywhere else).
let lights = 0;
for (const c of fp.values()) {
  for (let y = 9; y < ATTIC; y += 1) {
    if (y % 4 !== 3 || (c.x * 31 + c.z * 17 + y * 7) % 13 !== 0) continue;
    const dirs = exposed(c.x, c.z); if (!dirs.length) continue;
    const b = cls(c.x, c.z, y); if (!b || b[0] !== "glass_pane") continue;
    const [, dx, dz] = NEI.find(([n]) => n === OPP[dirs[0]]);
    const ix = c.x + dx, iz = c.z + dz;
    if (at(ix, iz) && cls(ix, iz, y) === null) { g.set(ix, y, iz, "glowstone"); lights++; }
  }
}

// Roof plant: brick chimney stacks on the mansard's flat top (where the top is full, 4+ cells in).
let chimneys = 0;
for (const c of fp.values()) {
  if (c.d < 4 || c.x % 7 !== 3 || c.z % 6 !== 2) continue;
  for (let y = ROOF; y <= ROOF + 1; y++) g.set(c.x, y, c.z, "bricks");
  g.set(c.x, ROOF + 2, c.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  chimneys++;
}

const out = `${DIR}/FR245184613.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries, ${lights} lit windows, ${chimneys} chimneys, doors ${[...door.keys()].join(" ")}`);

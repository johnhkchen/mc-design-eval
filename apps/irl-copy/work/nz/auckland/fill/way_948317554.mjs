// A three-storey Edwardian brick commercial block (c.1910s, Eden Terrace / Newton fabric): shopfronts on the street
// level, sash-style window grids above, a stone cornice and parapet, basalt foundations on the uphill side.
// The lidar roof (4-12 blocks above y 0) is smoothed into three flat tiers: 12 (three storeys), 8 (two), 4 (shop).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317554.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317554.nbt";

const g = new Voxels([27, 25, 16]);

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const inside = (x, z) => cell.has(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];

// clean flat tiers from the lidar roof: 3 storeys, 2 storeys, 1 storey (shopfront / lower wing)
const tier = (r) => (r >= 11 ? 12 : r >= 7 ? 8 : 4);
for (const c of cell.values()) {
  c.tier = tier(c.roof);
  c.out = DIRS.filter(([, dx, dz]) => !inside(c.x + dx, c.z + dz));   // the sides that face outside the footprint
  c.perim = c.out.length > 0;
  c.corner = c.out.length >= 2;
}

// the entrance: a street-level perimeter cell on the south face, nearest the middle of the lower frontage
const doorCands = [...cell.values()].filter((c) => c.perim && !c.corner && c.ground === 0 && c.out.some(([n]) => n === "south"));
doorCands.sort((a, b) => (Math.abs(a.x - 21) + Math.abs(a.z - 14)) - (Math.abs(b.x - 21) + Math.abs(b.z - 14)));
const door = doorCands[0];
const isDoor = (c) => c === door;

// roof plant room: a 3 x 3 block on the top tier, clear of the walls
let plant = null, pd = Infinity;
for (const c of cell.values()) {
  const ok = [0, 1, 2].every((i) => [0, 1, 2].every((j) => {
    const q = cell.get(`${c.x + i},${c.z + j}`);
    return q && q.tier === 12 && !q.perim;
  }));
  if (ok) { const d = Math.abs(c.x + 1 - 12) + Math.abs(c.z + 1 - 7); if (d < pd) { pd = d; plant = c; } }
}

// window rhythm: ground-level shopfront glazing with a pier every fourth cell; upper windows two wide, brick piers between
const paneState = (c) => (c.out.some(([n]) => n === "north" || n === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const isWindow = (c, y) => {
  const m = (c.x + c.z) % 4;
  if (y <= 2) return m !== 0;
  return m === 1 || m === 2;
};
const glassRow = (c, y) => (y >= c.ground + 1 && y <= 2) || (y >= 5 && y <= 6) || (y >= 9 && y <= 10);

function facade(c, y) {
  if (y === c.tier - 1) return ["smooth_stone"];                       // cornice / parapet cap
  if (c.corner) return ["stone_bricks"];                                // quoins
  if (y === c.ground) return ["stone_bricks"];                          // base course
  if (y === 4 || y === 8) return ["smooth_stone"];                      // sill and storey string course
  if (glassRow(c, y) && isWindow(c, y)) return ["glass_pane", paneState(c)];
  return ["bricks"];                                                    // piers, lintels, shop fascia
}

function interior(c, y) {
  if (y === c.tier - 1) return ["stone"];                               // roof deck
  if (y === c.ground || y === 4 || y === 8) return ["smooth_stone"];    // floor slab per storey; air between
  return null;
}

for (const c of cell.values()) {
  const { x, z, ground: G, tier: T } = c;
  for (let y = 0; y < G; y++) g.set(x, y, z, "cobblestone");            // basalt rubble foundation to the lowest ground
  for (let y = G; y < T; y++) {
    if (c.perim) {
      if (isDoor(c) && y <= 2) continue;                                // entrance set below
      const [b, s] = facade(c, y); g.set(x, y, z, b, s);
    } else {
      const r = interior(c, y); if (r) g.set(x, y, z, r[0], r[1]);
    }
  }
}

// warm light in some windows: a lantern on the inside cell just behind the glass, standing on the floor slab
let k = 0;
for (const c of cell.values()) {
  if (!c.perim || c.corner || isDoor(c)) continue;
  const [, dx, dz] = c.out[0];
  const ix = c.x - dx, iz = c.z - dz;
  const inner = cell.get(`${ix},${iz}`);
  if (!inner || inner.perim) continue;
  for (const y of [1, 5, 9]) {
    if (y >= inner.tier - 1 || y < inner.ground + 1 || !glassRow(c, y) || !isWindow(c, y)) continue;
    const lit = y === 1 ? k % 4 === 0 : k % 3 === 0;
    if (lit && y > inner.ground) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    k++;
  }
}

// the entrance: a dark oak door on the street, a hanging lantern over it under the fascia
g.set(door.x, 0, door.z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(door.x, 1, door.z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(door.x, 2, door.z, "lantern", { hanging: "true", waterlogged: "false" });

// the roof plant room: stone ring two high on the top roof, a smooth lid
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
  const x = plant.x + i, z = plant.z + j;
  if (i !== 1 || j !== 1) g.set(x, 12, z, "stone_bricks");
  g.set(x, 13, z, "smooth_stone");
}

const info = g.save(OUT);
console.log(`saved ${OUT}: ${info.blocks} blocks, palette ${info.palette}`);

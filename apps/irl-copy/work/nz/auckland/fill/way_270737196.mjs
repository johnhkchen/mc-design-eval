// Way 270737196, Eden Terrace / Mt Eden slope: a 1960s-70s Auckland concrete-and-brick block, three storeys on a
// brick-based plinth over a stone foundation. The lidar roof sorts into three flat tiers: a 14-block tower core, a
// 10-block podium wing, and one-storey annexes where the lidar reads almost nothing. Each storey is a 4-block band:
// a light-grey floor line, two rows of glass (shopfront at street level, panes above) and a white-concrete lintel,
// with white-concrete piers every third bay. The interior is air between the floor slabs, with lamps behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_270737196.cells.json`, "utf8"));
const g = new Voxels([19, 27, 22]);

const B = {
  foundation: "stone_bricks",
  base: "bricks",
  wall: "white_concrete",
  line: "light_gray_concrete",
  roof: "smooth_stone",
  shopfront: "light_blue_stained_glass",
  pane: "light_blue_stained_glass_pane",
  plant: "iron_block",
  canopy: "smooth_stone_slab",
};

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: "south", south: "north", west: "east", east: "west" };   // a door faces into the building
const ENTRANCE = [7, 1];                                                          // street side: lowest ground, west face

// The lidar roof -> a flat tier: tower 14, podium wing 10, one-storey annex (never below ground + 4).
const tierTop = (roof, ground) => (roof >= 12 ? 14 : roof >= 7 ? 10 : Math.max(4, ground + 4));

const info = new Map();
for (const [x, z, ground, roof] of cells) {
  const key = `${x},${z}`;
  if (info.has(key)) throw new Error(`duplicate footprint cell ${key}`);
  info.set(key, { x, z, ground, T: tierTop(roof, ground) });
}
const inF = (x, z) => info.has(`${x},${z}`);
const outward = (c) => Object.keys(DIRS).filter((d) => !inF(c.x + DIRS[d][0], c.z + DIRS[d][1]));

for (const c of info.values()) {
  c.out = outward(c);
  c.perim = c.out.length > 0;
  c.groundTop = [4, 8, 12].find((k) => k > c.ground) ?? c.T;          // the storey line above the shopfront
  // floor slabs: the ground, each storey line below the roof, and the roof deck
  c.F = new Set([c.ground]);
  for (const k of [4, 8, 12]) if (k > c.ground && k < c.T - 1) c.F.add(k);
  c.F.add(c.T - 1);
  c.alongX = c.out.includes("north") || c.out.includes("south");
  c.isEntrance = c.x === ENTRANCE[0] && c.z === ENTRANCE[1];
}

const paneState = (alongX) =>
  alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of info.values()) {
  const { x, z, ground, T } = c;
  for (let y = 0; y < T; y++) {
    if (y < ground) { g.set(x, y, z, B.foundation); continue; }
    if (!c.perim) {
      if (c.F.has(y)) g.set(x, y, z, y === T - 1 ? B.roof : B.line);
      continue;
    }
    if (c.isEntrance && (y === ground + 1 || y === ground + 2)) {
      const half = y === ground + 1 ? "lower" : "upper";
      g.set(x, y, z, "iron_door", { facing: INWARD[c.out[0]], half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (c.isEntrance && y === ground + 3) { g.set(x, y, z, B.canopy, { type: "bottom", waterlogged: "false" }); continue; }
    if (y === ground) g.set(x, y, z, B.base);
    else if (y === T - 1) g.set(x, y, z, B.wall);                           // parapet / coping
    else if (y % 4 === 0) g.set(x, y, z, B.line);                           // storey line and cornice
    else if (y % 4 === 3) g.set(x, y, z, B.wall);                           // lintel
    else {                                                                 // the glass rows
      const pier = (x + z) % 3 === 0;
      if (pier) g.set(x, y, z, B.wall);
      else if (y < c.groundTop) g.set(x, y, z, B.shopfront);
      else g.set(x, y, z, B.pane, paneState(c.alongX));
    }
  }
}

// Lamps behind some glass: an interior cell just inside a pane, in the air gap, gets a glowstone at street level or a shroomlight above.
let lamps = 0;
for (const c of info.values()) {
  if (!c.perim) continue;
  const [dx, dz] = DIRS[c.out[0]];
  for (let y = c.ground; y < c.T - 1; y++) {
    if (y % 4 === 0 || y % 4 === 3 || y === c.ground) continue;
    if ((c.x + c.z) % 3 === 0) continue;                                    // pier
    if ((c.x * 7 + c.z * 5 + y * 3) % 5 !== 0) continue;
    const n = info.get(`${c.x - dx},${c.z - dz}`);
    if (!n || n.perim || y < n.ground || y >= n.T - 1 || n.F.has(y)) continue;
    g.set(n.x, y, n.z, y < c.groundTop ? "glowstone" : "shroomlight");
    lamps++;
  }
}

// Roof plant on the tower's deck: a light-grey housing with an iron vent on top.
for (const c of info.values()) {
  if (c.perim || c.T !== 14 || !(c.x >= 8 && c.x <= 9 && c.z >= 8 && c.z <= 9)) continue;
  g.set(c.x, 14, c.z, B.line);
  g.set(c.x, 15, c.z, B.plant);
}

const res = g.save(`${DIR}/way_270737196.nbt`);
console.log(`way_270737196: ${info.size} cells, ${res.blocks} blocks, ${res.palette} palette entries, ${lamps} lamps`);

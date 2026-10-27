// One-storey 1960s-70s concrete commercial block (Newton / Eden Terrace light commercial): solid body on the
// lidar ground, stone plinth, glazed band with concrete piers, white spandrel, parapet cap, flat roof with plant.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1526009755.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1526009755.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];       // east, west, south, north (outward faces)
const fp = new Map();
for (const [x, z, ground] of cells) {
  // one flat parapeted tier, 4 blocks total: the lidar roof is 3 on the body and 1-2 only on the ragged edge cells,
  // which read as noise (a sawtooth silhouette), so every cell takes the same tier
  fp.set(key(x, z), { x, z, g: ground, T: 4 });
}
const faces = (c) => DIRS.filter(([dx, dz]) => !fp.has(key(c.x + dx, c.z + dz)));
const isPerim = (c) => faces(c).length > 0;
// a glazed-band cell is a pier at each corner, every third cell along a face, and never beside the door (the shopfront)
const isPier = (c) => {
  const [fx, fz] = faces(c)[0];
  const along = fz !== 0 ? c.x : c.z;
  const nearDoor = fx === DOOR.face[0] && fz === DOOR.face[1] && Math.abs(c.x - DOOR.x) <= 3;
  return !nearDoor && (faces(c).length > 1 || along % 3 === 0);
};

const v = new Voxels([46, 16, 26]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const DOOR = { x: 11, z: 18, face: [0, 1] };             // lowest street-level face on the south side
const doorCell = fp.get(key(DOOR.x, DOOR.z));
if (!doorCell || doorCell.g !== 0 || doorCell.T !== 4) throw new Error("door cell not at ground 0 with 4 tiers");

const stats = { body: 0, perimeter: 0, glass: 0, piers: 0, pockets: 0, lights: 0, roofUnits: 0 };

// 1. solid body on every footprint cell, rows 0..T-1 (no hanging anything; the foundation fills below each ground)
for (const c of fp.values()) {
  for (let y = 0; y < c.T - 1; y++) { put(c.x, y, c.z, "stone"); stats.body++; }
  put(c.x, c.T - 1, c.z, "gray_concrete"); stats.body++;    // roof membrane (interior)
}

// 2. perimeter: plinth, glazed band with concrete piers, white spandrel above, parapet cap on the top row
for (const c of fp.values()) {
  if (!isPerim(c)) continue;
  stats.perimeter++;
  const isDoor = c.x === DOOR.x && c.z === DOOR.z;

  put(c.x, c.T - 1, c.z, "smooth_stone");                   // parapet cap
  for (let y = c.g; y <= c.T - 2; y++) {
    if (y === c.g) { put(c.x, y, c.z, "stone_bricks"); continue; }      // base course
    if (y === c.g + 1) {                                                // glazed band: glass panes, piers between
      if (isPier(c)) { put(c.x, y, c.z, "light_gray_concrete"); stats.piers++; }
      else { put(c.x, y, c.z, "glass_pane"); stats.glass++; }
      continue;
    }
    put(c.x, y, c.z, "white_concrete");                              // spandrel / storey line
  }
  // the entrance: a door in the lowest south-face cell, its spandrel above as the lintel
  if (isDoor) {
    const facing = FACING[`${DOOR.face[0]},${DOOR.face[1]}`];
    for (const [half, y] of [["lower", c.g], ["upper", c.g + 1]])
      put(c.x, y, c.z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
  }
}

// 3. the air gap behind the glass: one cell in from each glazed pane, warm light in one window in three
for (const c of fp.values()) {
  if (!isPerim(c) || c.T - 2 < c.g + 1) continue;
  if (c.x === DOOR.x && c.z === DOOR.z) continue;
  if (isPier(c)) continue;
  const y = c.g + 1;
  const [fx, fz] = faces(c)[0];
  const inx = c.x - fx, inz = c.z - fz;
  const inner = fp.get(key(inx, inz));
  if (!inner || isPerim(inner)) continue;                   // no interior behind a 1-cell wall
  if (y < inner.g || y > inner.T - 2) continue;             // pocket only inside the solid body
  const warm = (c.x * 7 + c.z * 3) % 3 === 0;
  v.set(inx, y, inz, "air");
  stats.pockets++;
  if (warm) {
    put(inx, y, inz, (c.x + c.z) % 2 ? "glowstone" : "shroomlight");
    stats.lights++;
  }
}

// 4. roof plant: iron-block units standing on the roof membrane, spaced across the interior roof
for (const c of fp.values()) {
  // 2x2 plant boxes (light concrete, one course high) well inside the roof edge, not single cubes
  if (c.x % 10 !== 4 || c.z % 8 !== 3) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => fp.get(key(c.x + dx, c.z + dz)));
  if (block.some((b) => !b || isPerim(b))) continue;
  for (const b of block) put(b.x, 4, b.z, "light_gray_concrete");
  stats.roofUnits++;
}

v.save(OUT);
console.log(JSON.stringify({ cells: cells.length, ...stats, door: `${DOOR.x},${DOOR.z}` }));

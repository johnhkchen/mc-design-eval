import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE93-0001-10F-2: 2004 Xinyi office block, 10 storeys (~50 blocks to roof).
// Two tiers: a 9-storey base with a stepped-back 2-storey crown on the inner
// core, so the massing has a setback. Concrete frame, blue-green tinted glazing,
// white spandrels and corner piers, light-grey mullions, a stone base, a framed
// street entrance, warm lights in the glazing, and plant on the upper roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0001-10F-2";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 44, H = 62, D = 22;
const TIER1_TOP = 40;   // lower tier roof deck level (ring cells) / crown base slab (core)
const ROOF = 50;        // crown roof deck
const PARAPET_TOP = 51; // parapet top on ring cells / crown parapet

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPer = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Crown core: inner footprint cells, set back from every edge.
const INNER = (x, z) => x >= 4 && x <= 39 && z >= 4 && z <= 17 && has(x, z);
const innerPer = (x, z) => !INNER(x - 1, z) || !INNER(x + 1, z) || !INNER(x, z - 1) || !INNER(x, z + 1);

// Glazing panes oriented along the wall they sit in.
const pane = (xWall) => xWall
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Street entrance: north face (min z), nearest cell to the middle.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
const entranceCell = cells
  .filter(([, z]) => z === minZ)
  .sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx))[0];
const ent = entranceCell ? [entranceCell[0], entranceCell[1], Math.round(entranceCell[2])] : null;

// Pass 1: lower tier, every footprint cell.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const inn = INNER(x, z);
  const per = isPer(x, z);
  const xWall = !has(x, z - 1) || !has(x, z + 1); // exposed N/S -> wall runs along x
  const corner = xWall && (!has(x - 1, z) || !has(x + 1, z));
  const along = xWall ? x : z;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const top = inn ? TIER1_TOP : PARAPET_TOP;
  for (let y = gr; y <= top; y++) {
    // Ring cells end at a roof deck on y=40; the core carries on above.
    if (!inn && y === TIER1_TOP) { put(x, y, z, "light_gray_concrete"); continue; }

    if (!per) {
      // Interior of the lower tier: floor slabs, ground floor, a few warm lights.
      if (y % 5 === 0 && y > 0) { put(x, y, z, "white_concrete"); continue; }
      if (y === gr) { put(x, y, z, "smooth_stone"); continue; }
      const nearPer = isPer(x - 1, z) || isPer(x + 1, z) || isPer(x, z - 1) || isPer(x, z + 1);
      if (nearPer && y % 5 === 2 && y > gr && y < TIER1_TOP &&
          ((x + 2 * z + Math.floor(y / 5) * 3) % 7 === 0)) {
        put(x, y, z, "glowstone");
      }
      continue;
    }

    // Lower-tier perimeter: the facade shell.
    if (y >= TIER1_TOP + 1) { put(x, y, z, "white_concrete"); continue; } // parapet
    if (y < 5) {
      // Shopfront band.
      if (y === gr) put(x, y, z, "stone_bricks");
      else if (y === 4) put(x, y, z, "white_concrete");                    // lintel
      else if (along % 4 === 0) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", pane(xWall));
      continue;
    }
    if (corner) { put(x, y, z, "white_concrete"); continue; }             // corner piers
    if (y % 5 === 0) put(x, y, z, "white_concrete");
    else if (along % 3 === 0) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", pane(xWall));
  }
}

// Pass 2: the crown, stepped back on the core, storeys 41..50 with its own shell.
for (const [x, z, gr0] of cells) {
  if (!INNER(x, z)) continue;
  const per2 = innerPer(x, z);
  const xWall2 = !INNER(x, z - 1) || !INNER(x, z + 1);
  const corner2 = xWall2 && (!INNER(x - 1, z) || !INNER(x + 1, z));
  const along2 = xWall2 ? x : z;

  for (let y = TIER1_TOP + 1; y <= ROOF; y++) {
    if (!per2) {
      if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; }
      if (y % 5 === 0) { put(x, y, z, "white_concrete"); continue; }
      const adjPer = innerPer(x - 1, z) || innerPer(x + 1, z) || innerPer(x, z - 1) || innerPer(x, z + 1);
      if (adjPer && y % 5 === 2 && ((x + 3 * z + y) % 6 === 0)) {
        put(x, y, z, "glowstone");
      }
      continue;
    }
    if (y >= ROOF) { put(x, y, z, "white_concrete"); continue; }         // crown parapet
    if (corner2) { put(x, y, z, "white_concrete"); continue; }
    if (y % 5 === 0) put(x, y, z, "white_concrete");
    else if (along2 % 3 === 0) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", pane(xWall2));
  }
}

// Pass 3: entrance. Framed by pilasters, a glazed door, and a warm lantern.
if (ent) {
  const [ex, ez, gr] = ent;
  const onNorth = (x) => has(x, minZ);
  // Pilasters flanking the door on the street face.
  for (const px of [ex - 2, ex + 2]) {
    if (!onNorth(px)) continue;
    for (let y = gr; y <= 4; y++) put(px, y, minZ, "white_concrete");
  }
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(ex, gr, ez, "oak_door", doorProps("lower"));
  put(ex, gr + 1, ez, "oak_door", doorProps("upper"));
  if (gr <= 3) put(ex, 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: plant penthouse on the crown roof, centred on the core.
for (const [x, z] of cells) {
  if (!INNER(x, z) || innerPer(x, z)) continue;
  if (Math.abs(x - 21.5) > 6 || Math.abs(z - 10.5) > 3) continue;
  for (let y = ROOF + 1; y <= 53; y++) put(x, y, z, "light_gray_concrete");
  put(x, 54, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

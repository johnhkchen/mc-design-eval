import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893361";
const W = 15, H = 23, D = 11;

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Era read: 1990s-2000s Xinyi mid-rise commercial block. Two storeys of shopfront
// and offices on a stone plinth, white tiled walls, quartz cornices, a parapet
// and rooftop plant. Roof sits 11 blocks above the lowest ground.
const L0 = Math.min(...ground.values());
const R = L0 + 11;           // parapet / roof plant level
const DECK = L0 + 10;        // roof deck / storey-2 ceiling
const FL2 = L0 + 5;          // storey-2 floor / cornice line

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward direction of an edge cell: prefer a missing z-neighbour (street faces)
function outward(x, z) {
  if (!has(x, z + 1)) return [0, 1];
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x + 1, z)) return [1, 0];
  if (!has(x - 1, z)) return [-1, 0];
  return null;
}
function isCorner(x, z) {
  const zMissing = !has(x, z + 1) || !has(x, z - 1);
  const xMissing = !has(x + 1, z) || !has(x - 1, z);
  return zMissing && xMissing;
}

// Entrance: edge cell on the highest-z (street) side nearest the middle of the width
const midX = (W - 1) / 2;
let door = null;
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const e = outward(x, z);
  if (!e || isCorner(x, z)) continue;
  if (!door || z > door[1] || (z === door[1] && Math.abs(x - midX) < Math.abs(door[0] - midX)))
    door = [x, z];
}
const doorKey = door ? `${door[0]},${door[1]}` : null;

// Pass 1: foundations, floors, interior structure
for (const [x, z, gr] of cells) {
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const e = outward(x, z);
  if (!e) {
    // interior: ground floor slab, storey-2 floor, roof deck
    put(x, gr, z, "light_gray_concrete");
    if (FL2 > gr) put(x, FL2, z, "light_gray_concrete");
    if (DECK > gr) put(x, DECK, z, "gray_concrete");
    // rooftop plant on a sparse grid
    if (x % 4 === 2 && z % 3 === 1) {
      put(x, R, z, "iron_block");
    }
  }
}

// Pass 2: facades on edge cells
for (const [x, z, gr] of cells) {
  const e = outward(x, z);
  if (!e) continue;
  const [dx, dz] = e;
  const corner = isCorner(x, z);
  const along = dz !== 0 ? x : z;
  const isDoor = `${x},${z}` === doorKey;
  const glassProps = dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y <= R; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks");                       // plinth course
      continue;
    }
    if (y === R) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet cap
      continue;
    }
    if (y === FL2 || y === DECK) {
      put(x, y, z, "smooth_quartz");                      // storey cornice bands
      continue;
    }
    if (corner) {
      put(x, y, z, "white_concrete");                     // corner piers
      continue;
    }
    if (isDoor) {
      if (y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    }

    const storey1Rows = y > gr && y < L0 + 4;
    const storey2Rows = y > FL2 && y < L0 + 9;
    const spandrel = y === L0 + 4 || y === L0 + 9;

    if (spandrel) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if ((storey1Rows || storey2Rows) && along % 3 !== 0) {
      put(x, y, z, "glass_pane", glassProps);
      continue;
    }
    if (y < L0 + 4 && along % 3 === 0 || y > FL2 && y < L0 + 9 && along % 3 === 0 || !(storey1Rows || storey2Rows)) {
      put(x, y, z, "white_concrete");
      continue;
    }
    put(x, y, z, "white_concrete");
  }

  // warm lights behind some glass, inside the air gap of the adjacent interior cell
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && !isDoor) {
    const igr = gAt(ix, iz);
    if (along % 6 === 1) {
      const ly = L0 + 2;
      if (ly > igr && ly < FL2) put(ix, ly, iz, "glowstone");
    }
    if (along % 6 === 4) {
      const ly = L0 + 7;
      if (ly > igr && ly < DECK) put(ix, ly, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

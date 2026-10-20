import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw218489812";
const W = 128, H = 23, D = 139;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Materials: 1980s Taipei civic/institutional block, cream tile-clad concrete,
// granite plinth, stone-brick bands, light-blue glazing with white mullions.
const WALL = "smooth_quartz";
const BASE = "polished_granite";
const BAND = "stone_bricks";
const SLAB = "light_gray_concrete";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const GLASS_FULL = "light_blue_stained_glass";
const EQUIP = "light_gray_concrete";

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const key = (x, z) => `${x},${z}`;

const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const has = (x, z) => G.has(key(x, z));

// Which sides of a cell face outside the footprint
const missingOf = (x, z) => ({
  px: !has(x + 1, z), nx: !has(x - 1, z),
  pz: !has(x, z + 1), nz: !has(x, z - 1),
});

// Entrance: perimeter cell on the north (min z) side, nearest the centroid x
let cx = 0; for (const [x] of cells) cx += x; cx /= cells.length;
let door = null;
for (const [x, z] of cells) {
  if (missingOf(x, z).nz) {
    if (!door || z < door.z || (z === door.z && Math.abs(x - cx) < Math.abs(door.x - cx))) {
      door = { x, z };
    }
  }
}

// Entrance bay: door cell plus the north-facing cells either side of it,
// read as a glazed vestibule under a stone canopy line.
const bay = new Set();
if (door) {
  for (let dx = -1; dx <= 1; dx++) {
    const x = door.x + dx, z = door.z;
    if (has(x, z) && missingOf(x, z).nz) bay.add(key(x, z));
  }
}
const doorKey = door ? key(door.x, door.z) : null;

for (const [x, z] of cells) {
  const gr = G.get(key(x, z));
  if (gr < 0) continue;
  const m = missingOf(x, z);
  const perim = m.px || m.nx || m.pz || m.nz;

  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, FOUND);

  // Ground-level course / slab
  put(x, gr, z, perim ? BASE : SLAB);

  if (!perim) {
    // Interior: floor slabs and roof deck only, air gap between
    put(x, gr + 5, z, SLAB);
    put(x, gr + 10, z, SLAB);
    continue;
  }

  // Wall runs along z if an x-neighbour is missing, otherwise along x
  const runsZ = m.px || m.nx;
  const paneProps = runsZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Inward direction (toward the footprint)
  const inx = m.px ? -1 : m.nx ? 1 : 0;
  const inz = m.pz ? -1 : m.nz ? 1 : 0;

  const isDoor = doorKey === key(x, z);
  const inBay = bay.has(key(x, z));

  // Storey schedule above ground:
  // 1 spandrel, 2-3 window, 4 lintel, 5 storey band, 6 spandrel,
  // 7-8 window, 9 lintel, 10 cornice; 11 parapet
  for (let dy = 1; dy <= 10; dy++) {
    const y = gr + dy;
    if (y >= H) break;

    if (inBay) {
      // Entrance vestibule: full glazing at ground storey, stone canopy at dy 4
      if (dy >= 1 && dy <= 3) {
        if (isDoor && dy <= 2) continue; // door placed below
        put(x, y, z, GLASS_FULL);
      } else if (dy === 4) {
        put(x, y, z, BAND);
      } else {
        // upper storeys continue the normal facade
        const id = dy === 5 || dy === 10 ? BAND : (dy === 6 || dy === 9) ? WALL
          : (x + z) % 3 === 0 ? WALL : null;
        if (id) put(x, y, z, id);
        else put(x, y, z, GLASS, paneProps);
      }
      continue;
    }

    let id = WALL, props;
    if (dy === 5 || dy === 10) id = BAND;
    else if (dy === 1 || dy === 4 || dy === 6 || dy === 9) id = WALL;
    else {
      // window band
      if ((x + z) % 3 === 0) id = WALL; // mullion
      else { id = GLASS; props = paneProps; }
    }
    if (id === GLASS) put(x, y, z, id, props);
    else put(x, y, z, id);

    // Warm light inside a few windows (glowstone behind the glass)
    if (id === GLASS && ((x * 31 + z * 17 + dy * 7) % 11 === 0)) {
      const ix = x + inx, iz = z + inz;
      if (has(ix, iz) && G.get(key(ix, iz)) + 1 <= y) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Continuous parapet, with a stone cap course every sixth cell for rhythm
  if (gr + 11 < H) put(x, gr + 11, z, (x + z) % 6 === 0 ? BAND : WALL);
}

// Entrance door, lintel marker and foyer lanterns
if (door) {
  const gr = G.get(doorKey);
  const facing = "north";
  const dx = door.x, dz = door.z;
  put(dx, gr + 1, dz, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 2, dz, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lanterns on the bay's outer edges, standing on the vestibule floor
  for (const off of [-1, 1]) {
    const lx = dx + off, lz = dz;
    if (has(lx, lz) && bay.has(key(lx, lz))) {
      put(lx, gr + 1, lz + 1, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
  // Inner foyer lanterns flanking the door, inside
  for (const off of [-1, 1]) {
    const lx = dx + off, lz = dz + 1;
    if (has(lx, lz)) put(lx, G.get(key(lx, lz)) + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof equipment: a few HVAC plant boxes on the roof deck
for (const [x, z] of cells) {
  const gr = G.get(key(x, z));
  if (x % 9 === 4 && z % 9 === 4) {
    const m = missingOf(x, z);
    if (!(m.px || m.nx || m.pz || m.nz)) {
      put(x, gr + 11, z, EQUIP);
      put(x, gr + 12, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

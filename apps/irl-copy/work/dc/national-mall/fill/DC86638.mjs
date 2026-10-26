import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC86638.cells.json`, "utf8"));
const cells = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof]));

const W = 11, H = 25, D = 11;
const g = new Voxels([W, H, D]);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => { if (inB(x, y, z)) g.set(x, y, z, id, props); };

const key = (x, z) => `${x},${z}`;
const footprint = new Set(cells.map(([x, z]) => key(x, z)));
const maxRoof = Math.max(...cells.map((c) => Math.round(c[3])));

// Entrance sits on the south face, centred on x = 5.
const ENTRY_X = 5, ENTRY_Z = 10;

// Windows: odd positions along each non-corner face; brick piers on even positions.
const isWindow = (x, z) => {
  const corner = (x === 0 || x === 10) && (z === 0 || z === 10);
  if (corner) return false;
  if ((z === 0 || z === 10) && x % 2 === 1) return true;
  if ((x === 0 || x === 10) && z % 2 === 1) return true;
  return false;
};
const glassProps = (x, z) =>
  (z === 0 || z === 10)
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, groundRaw, roofRaw] of cells) {
  const G = Math.max(0, Math.round(groundRaw));
  let T = Math.round(roofRaw);
  T = Math.max(G + 8, Math.min(T, H - 4));
  const perim = x === 0 || x === 10 || z === 0 || z === 10;
  const dx = x === 0 ? 1 : x === 10 ? -1 : 0;
  const dz = z === 0 ? 1 : z === 10 ? -1 : 0;
  const isEntryCell = x === ENTRY_X && z === ENTRY_Z;
  // Ground-storey entrance surround: the cells either side of the door become stone piers
  const isEntrySurround = z === ENTRY_Z && Math.abs(x - ENTRY_X) === 1;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  for (let y = G; y < T; y++) {
    const r = y - G;

    // Roof deck / parapet
    if (y === T - 1) {
      put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (!perim) {
      // Interior: floor slabs only, air elsewhere (no interiors)
      if (r % 3 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter shell
    if (y === T - 2) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    if (r === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (r % 3 === 0) { put(x, y, z, "smooth_stone"); continue; }

    // Ground-storey entrance: door in a stone portal
    if (isEntryCell && (r === 1 || r === 2)) {
      if (r === 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntrySurround && (r === 1 || r === 2)) { put(x, y, z, "stone_bricks"); continue; }

    if (isWindow(x, z)) {
      put(x, y, z, "glass_pane", glassProps(x, z));
      // Warm light in some windows, placed in the air gap behind the glass
      if ((dx || dz) && r % 3 === 2 && (x + z + r) % 5 === 0 && footprint.has(key(x + dx, z + dz))) {
        put(x + dx, y, z + dz, "shroomlight");
      }
    } else {
      put(x, y, z, "bricks");
    }
  }
}

// Central roof penthouse on the tallest part, with a lantern for dusk
for (let x = 4; x <= 6; x++) {
  for (let z = 4; z <= 6; z++) {
    const cell = cells.find(([cx, cz]) => cx === x && cz === z);
    if (!cell) continue;
    if (Math.round(cell[3]) < maxRoof - 1) continue;
    const G = Math.max(0, Math.round(cell[2]));
    const T = Math.max(G + 8, Math.min(Math.round(cell[3]), H - 4));
    put(x, T, z, "quartz_block");
    if (x === 5 && z === 5) put(x, T + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC86638.nbt`);

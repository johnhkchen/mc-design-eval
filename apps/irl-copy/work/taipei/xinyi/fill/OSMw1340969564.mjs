import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1340969564";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 19, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup and extents
const gmap = new Map();
let minG = Infinity;
let loX = Infinity, hiX = -Infinity, loZ = Infinity, hiZ = -Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
  loX = Math.min(loX, x); hiX = Math.max(hiX, x);
  loZ = Math.min(loZ, z); hiZ = Math.max(hiZ, z);
}
const has = (x, z) => gmap.has(`${x},${z}`);
const midX = (loX + hiX) / 2;
const midZ = (loZ + hiZ) / 2;

// Roof deck sits about 7 blocks above the lowest ground; parapet + cap above it.
const yTop = Math.min(minG + 7, H - 3);

// Exterior faces of a cell: n (z-1), s (z+1), w (x-1), e (x+1)
function exteriorSides(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push("n");
  if (!has(x, z + 1)) out.push("s");
  if (!has(x - 1, z)) out.push("w");
  if (!has(x + 1, z)) out.push("e");
  return out;
}

const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PILLAR_Y = { axis: "y" };

// Tile for an exterior wall position (rel = height above the cell's ground).
function wallTile(side, x, z, rel) {
  const idx = (side === "n" || side === "s") ? x : z;
  const lo = (side === "n" || side === "s") ? loX : loZ;
  const hi = (side === "n" || side === "s") ? hiX : hiZ;
  const corner = idx === lo || idx === hi;
  const mid = (side === "n" || side === "s") ? midX : midZ;
  const isMid = idx === mid;
  const glass = { id: "glass_pane", props: (side === "n" || side === "s") ? GLASS_EW : GLASS_NS };

  if (rel <= 3) {
    if (rel === 3) {
      return corner ? { id: "quartz_pillar", props: PILLAR_Y } : { id: "dark_oak_planks" };
    }
    if (corner) return { id: "white_concrete" };
    return glass; // door handled by caller on south centre bay
  }
  // upper storey
  if (corner) return { id: "quartz_pillar", props: PILLAR_Y };
  if (rel === 5 || rel === 6) {
    if (isMid) return { id: "smooth_quartz" };
    return glass;
  }
  return { id: "white_concrete" };
}

// Glowstone behind glass: interior centre cell, if the footprint has one.
const glowCell = has(midX, midZ) && exteriorSides(midX, midZ).length === 0
  ? { x: midX, z: midZ } : null;

for (const [x, z, gc] of cells) {
  // Foundation up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  // Base course / ground floor slab
  g.set(x, gc, z, "smooth_stone");

  const sides = exteriorSides(x, z);
  const isExt = sides.length > 0;

  for (let y = gc + 1; y < yTop; y++) {
    const rel = y - gc;

    // Storey line between ground and upper floor (all cells)
    if (rel === 4) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!isExt) continue; // interior air

    const side = sides[0];

    // Entrance: centre bay of the south face, two blocks high
    if (side === "s" && x === midX && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    const t = wallTile(side, x, z, rel);
    if (t) g.set(x, y, z, t.id, t.props);
  }

  // Roof deck, parapet and cap
  if (isExt) {
    g.set(x, yTop, z, "smooth_stone");
    if (yTop + 1 < H) g.set(x, yTop + 1, z, "white_concrete");
    if (yTop + 2 < H) g.set(x, yTop + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, yTop, z, "gray_concrete");
  }
}

// Warm light behind the upper-floor glass in the interior centre
if (glowCell) {
  const gc = gmap.get(`${glowCell.x},${glowCell.z}`);
  const yGlow = gc + 5;
  if (yGlow < yTop) g.set(glowCell.x, yGlow, glowCell.z, "glowstone");
}

// Small roof plant unit on the centre of the roof
if (glowCell) {
  if (yTop + 1 < H) g.set(glowCell.x, yTop + 1, glowCell.z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001474.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001474.nbt";

const W = 16, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// ---- read footprint -------------------------------------------------------
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const has = new Map();
for (const [x, z, gr, roof] of raw) {
  has.set(`${x},${z}`, { x, z, gr: Math.round(gr), roof: Math.round(roof) });
}
const present = (x, z) => has.has(`${x},${z}`);

// Building-wide roof tier: median lidar roof, so the massing reads as one flat top
const roofs = [...has.values()].map((c) => c.roof).sort((a, b) => a - b);
const Rb = roofs[Math.floor(roofs.length / 2)];

// Per-cell ground and roof, smoothed into two-block storey tiers
const cells = [];
for (const c of has.values()) {
  let top = Math.abs(c.roof - Rb) <= 2 ? Rb : c.gr + 2 * Math.round((c.roof - c.gr) / 2);
  top = Math.max(c.gr + 4, Math.min(H - 1, top));
  cells.push({ x: c.x, z: c.z, gr: Math.max(0, Math.min(H - 6, c.gr)), top });
}

// ---- helpers --------------------------------------------------------------
const isPerim = (x, z) => !present(x, z - 1) || !present(x, z + 1) || !present(x - 1, z) || !present(x + 1, z);

// Exterior face of a perimeter cell: street front (low z), back, west, east
function faceOf(x, z) {
  if (!present(x, z - 1)) return "front";
  if (!present(x, z + 1)) return "back";
  if (!present(x - 1, z)) return "west";
  return "east";
}

// Window bays: glass on the face, brick piers between
function isWindowBay(face, x, z) {
  if (face === "front" || face === "back") return x % 3 !== 0;
  return z % 3 !== 0;
}

const GLASS_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Inward offset from an exterior cell toward the room
function inward(face, x, z) {
  if (face === "front") return [x, z + 1];
  if (face === "back") return [x, z - 1];
  if (face === "west") return [x + 1, z];
  return [x - 1, z];
}

// ---- foundations, walls, floors, cornice, roof -----------------------------
for (const c of cells) {
  const { x, z, gr, top } = c;
  const perim = isPerim(x, z);
  const face = perim ? faceOf(x, z) : null;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const isA = rel % 2 === 0;   // floor line / string course row
    const isB = !isA;            // window band row

    // cornice: stone course, with a half-slab lip on the top row
    if (y >= top - 2) {
      if (perim) {
        if (y === top - 1) g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
        else g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, y === top - 1 ? "stone" : "smooth_stone");
      }
      continue;
    }

    if (perim) {
      if (isA) {
        g.set(x, y, z, "stone_bricks");
      } else if (isWindowBay(face, x, z)) {
        const props = (face === "front" || face === "back") ? GLASS_Z : GLASS_X;
        g.set(x, y, z, "glass_pane", props);
        // warm light in the room behind some panes
        if ((x + z + rel) % 4 === 0) {
          const [ix, iz] = inward(face, x, z);
          if (present(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "shroomlight");
        }
      } else {
        g.set(x, y, z, "bricks");
      }
      continue;
    }

    // interior: floor slabs only, air gap behind windows
    if (isA) g.set(x, y, z, "smooth_stone");
  }
}

// ---- ground-floor entrance: centred door, lanterns, flat hood ---------------
const doorCell = cells.find((c) => c.x === 7 && c.z === 0);
if (doorCell) {
  const y0 = doorCell.gr + 1;
  g.set(7, y0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(7, y0 + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

  // hood: slab course across the bay above the door
  if (doorCell.gr + 3 < doorCell.top - 2) {
    for (const hx of [6, 7, 8]) {
      if (present(hx, 0)) g.set(hx, doorCell.gr + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }

  // lanterns flanking the door, on the ground-floor band, lit from inside
  for (const lx of [5, 9]) {
    if (present(lx, 0)) {
      g.set(lx, doorCell.gr + 1, 0, "stone_bricks");
      g.set(lx, doorCell.gr + 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(OUT);

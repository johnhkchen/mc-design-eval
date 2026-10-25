import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR2285668093";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 18, D = 8;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> { ground, roof }
const cm = new Map();
for (const [x, z, gr, r] of cells) {
  const ground = Math.max(0, Math.min(H - 4, Math.round(gr)));
  const roof = Math.min(H - 1, Math.max(ground + 3, Math.round(r)));
  cm.set(`${x},${z}`, { ground, roof });
}
const has = (x, z) => cm.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const zs = [...cm.keys()].map(k => +k.split(",")[1]);
const frontZ = Math.min(...zs);

// Entrance: front edge cell nearest the middle of the width
let doorX = null;
{
  let best = Infinity;
  for (const k of cm.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === frontZ && Math.abs(x - (W - 1) / 2) < best) {
      best = Math.abs(x - (W - 1) / 2);
      doorX = x;
    }
  }
}

// Windows: exposed facade, storey rows 2-3 (row 1 is a dark sill), not at the door bay
const isWin = (x, z, rel) =>
  has(x, z) && isPerim(x, z) && !isCorner(x, z) &&
  (rel % 5 === 2 || rel % 5 === 3) && (x + z) % 3 !== 0 &&
  !(z === frontZ && x === doorX);

const isLit = (x, z, rel) => isWin(x, z, rel) && (x * 7 + z * 3 + rel * 5) % 13 === 0;

const paneProps = (x, z, rel) => ({
  north: isWin(x, z - 1, rel) ? "true" : "false",
  south: isWin(x, z + 1, rel) ? "true" : "false",
  east: isWin(x + 1, z, rel) ? "true" : "false",
  west: isWin(x - 1, z, rel) ? "true" : "false",
  waterlogged: "false",
});

for (const [k, { ground, roof }] of cm) {
  const [x, z] = k.split(",").map(Number);
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  const front = z === frontZ;
  const doorBay = front && x === doorX;

  // Plinth: rubble stone from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) {
    g.set(x, y, z, (x + z + y) % 5 === 0 ? "cobblestone" : "stone");
  }

  for (let y = ground; y < roof; y++) {
    const rel = y - ground;

    // Interior core: solid, with a floor line per storey
    if (!perim) {
      g.set(x, y, z, rel % 5 === 0 ? "smooth_stone" : "stone_bricks");
      continue;
    }

    // Quoins at corners: chiseled column, reads as a dressed corner
    if (corner) {
      g.set(x, y, z, rel % 5 === 0 ? "smooth_stone" : "chiseled_stone_bricks");
      continue;
    }

    // Base course
    if (rel === 0) {
      if (doorBay) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Door upper half and a small canopy over it
    if (doorBay) {
      if (rel === 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (rel === 2) {
        g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      } else if (rel % 5 === 0) {
        g.set(x, y, z, "smooth_stone");
      } else {
        g.set(x, y, z, "stone_bricks");
      }
      continue;
    }

    if (rel % 5 === 0) { g.set(x, y, z, "smooth_stone"); continue; }   // storey string course
    if (rel % 5 === 4) { g.set(x, y, z, "chiseled_stone_bricks"); continue; } // lintel band

    // Window sill (dark wood frame under each opening)
    if (rel % 5 === 1 && has(x, z) && isWin(x, z, rel + 1)) {
      g.set(x, y, z, "dark_oak_planks");
      continue;
    }

    if (isWin(x, z, rel)) {
      if (isLit(x, z, rel)) {
        g.set(x, y, z, "orange_stained_glass"); // warm lit room, reads at dusk
      } else {
        g.set(x, y, z, "glass_pane", paneProps(x, z, rel));
      }
    } else {
      // Render-like granite texture: mostly stone bricks, a few cracked patches
      g.set(x, y, z, (x * 3 + z * 5 + rel) % 7 === 0 ? "cracked_stone_bricks" : "stone_bricks");
    }
  }

  // Parapet and roof: sloped-looking eave on the perimeter, slate cap over everything
  if (roof - 1 >= ground) {
    g.set(x, roof - 1, z, perim ? "stone_brick_wall" : "stone_bricks");
  }
  if (perim) {
    g.set(x, roof, z, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, roof, z, "deepslate_tiles");
  }
}

g.save(`${DIR}/${ID}.nbt`);

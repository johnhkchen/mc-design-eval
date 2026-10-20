import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001553";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 10, H = 23, D = 5;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, { gr: Math.round(gr), rf: Number(rf) });
}
const has = (x, z) => map.has(`${x},${z}`);
const groundAt = (x, z) => map.get(`${x},${z}`).gr;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const B = Math.min(...cells.map(c => Math.round(c[2])));
const rfSorted = cells.map(c => Number(c[3])).sort((a, b) => a - b);
const medRoof = Math.round(rfSorted[Math.floor(rfSorted.length / 2)]);
const R = clamp(medRoof, B + 9, 21);

function topOf(x, z) {
  let t = Math.round(map.get(`${x},${z}`).rf);
  if (Math.abs(t - R) <= 1) t = R;
  return clamp(t, B + 6, R);
}

const isPerimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const DOOR_X = 4;
const FRONT_WINDOW_X = new Set([1, 2, 3, 6, 7, 8]);
const PIER_X = new Set([5]);
const glassFront = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassSide = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function inWindowRow(y, gr, t) {
  for (let s = 0; s < 3; s++) {
    const w = y - (B + 3 * s);
    if ((w === 1 || w === 2) && y <= t - 3 && y >= gr) return true;
  }
  return false;
}

const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// ---- pass 1: foundations, interior floors/roof decks, perimeter walls ----
for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const t = topOf(x, z);
  const per = isPerimeter(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!per) {
    for (const fl of [B, B + 3, B + 6]) {
      if (fl >= gr && fl < t - 1) g.set(x, fl, z, "oak_planks");
    }
    if (t - 1 >= gr) g.set(x, t - 1, z, "smooth_stone");
    continue;
  }

  const onFront = z === 0 || z === D - 1;
  const onSide = x === 0 || x === W - 1;
  const pier = (onFront && PIER_X.has(x)) || isCorner(x, z);

  for (let y = gr; y < t; y++) {
    let id = "bricks";
    let props;

    if (y === gr) {
      id = "stone_bricks"; // plinth
    } else if (y === t - 1) {
      id = "stone_brick_slab";
      props = { type: "top", waterlogged: "false" }; // parapet cap
    } else if (y === t - 2) {
      id = "smooth_stone"; // cornice band
    } else if (y === B + 3 || y === B + 6) {
      if (y < t - 2) id = "smooth_stone"; // storey lines
    }

    // quoins and piers: stone_bricks column, reads as articulation
    if (pier && id === "bricks") id = "stone_bricks";

    // windows
    if (inWindowRow(y, gr, t) && id === "bricks") {
      if (onFront && FRONT_WINDOW_X.has(x)) {
        id = "glass_pane";
        props = glassFront;
      } else if (onSide && !isCorner(x, z) && z >= 1 && z <= 3) {
        id = "glass_pane";
        props = glassSide;
      }
    }

    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }
}

// ---- pass 2: entrance on the street face, with surround and canopy ----
{
  const x = DOOR_X, z = 0;
  if (has(x, z)) {
    const dy = groundAt(x, z);
    // stone surround on the wall, one block each side and above the door
    for (const sx of [x - 1, x + 1]) {
      if (has(sx, z)) {
        g.set(sx, dy, z, "stone_bricks");
        g.set(sx, dy + 1, z, "stone_bricks");
        g.set(sx, dy + 2, z, "stone_bricks");
      }
    }
    // door: lower and upper halves, facing out to the street (north)
    g.set(x, dy, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, dy + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // lintel over the door
    g.set(x, dy + 2, z, "stone_bricks");
    // canopy: slab over the door, sits on the lintel row, wall-supported
    for (const sx of [x - 1, x, x + 1]) {
      if (has(sx, z)) g.set(sx, dy + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// ---- pass 3: warm lights behind front-window glass (interior air cells) ----
for (const x of [2, 7]) {
  for (const s of [0, 2]) {
    const y = B + 3 * s + 1;
    if (has(x, 1) && !isPerimeter(x, 1)) {
      const gr = groundAt(x, 1);
      const t = topOf(x, 1);
      if (y >= gr && y < t - 3) g.set(x, y, 1, "glowstone");
    }
  }
}

// ---- pass 4: roof equipment, brick chimney stacks on interior roof cells ----
for (const [cx, cz] of [[2, 2], [7, 2]]) {
  if (!has(cx, cz)) continue;
  const t = topOf(cx, cz);
  if (t + 1 <= H - 1) {
    g.set(cx, t, cz, "bricks");
    g.set(cx, t + 1, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

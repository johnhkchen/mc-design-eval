// Auckland, 15 x 8 blocks, two-tier Edwardian/interwar brick commercial block: a one-storey shopfront wing (roof 5)
// and a two-storey corner range (roof 8) stepping up along the north side. Brick with white-plaster string courses
// and lintels, stone quoins and plinth, glass panes set in a 1-deep air gap, lit lanterns and glowstone behind some.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_448579572.cells.json", "utf8"));

const X = 15, Y = 21, Z = 8;
const key = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;

// lidar roof heights snapped to two clean tiers: 8 = two storeys, 5 = one storey and a parapet (4s and 6s are noise)
const H = new Map();
for (const [x, z, , roof] of cells) H.set(key(x, z), roof >= 7 ? 8 : 5);
const top = (x, z) => H.get(key(x, z)) ?? 0;          // 0 outside the footprint

const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACE = { N: "north", S: "south", W: "west", E: "east" };

// the outward faces of cell (x, z) that are open air at height y (a neighbour lower than y, or none)
function exposed(x, z, y) {
  const t = top(x, z); if (y >= t) return [];
  return Object.keys(DIR).filter((d) => y >= top(x + DIR[d][0], z + DIR[d][1]));
}

// the storey rhythm: plinth, shopfront (y1-2 glass, y3 fascia); upper storeys: white string, two rows of glass, lintel
function bandOf(y, t) {
  if (y === 0) return "plinth";
  if (y === t - 1) return "parapet";
  if (y < 4) return y === 3 ? "fascia" : "win";
  const r = (y - 4) % 4;
  return r === 0 ? "string" : r === 3 ? "lintel" : "win";
}

// along a facade a pier every third cell and glass in the two between; a window needs a 1-deep air gap behind it
const DOOR = [1, 0];                                  // the entrance, north face, ground floor
const winAir = new Map();                             // key3 -> the lamp block (or null) for the glass's air gap
const windows = new Set();                            // key3 of the glass panes

for (const [x, z] of [...H.keys()].map((k) => k.split(",").map(Number))) {
  const t = top(x, z);
  for (let y = 1; y < t; y++) {
    const ex = exposed(x, z, y);
    if (ex.length !== 1 || bandOf(y, t) !== "win") continue;
    const d = ex[0];
    const idx = d === "N" || d === "S" ? x : z;
    if (idx % 3 === 0) continue;
    const ix = x - DIR[d][0], iz = z - DIR[d][1];      // the cell behind the glass
    if (top(ix, iz) <= y || exposed(ix, iz, y).length) continue;
    windows.add(key3(x, y, z));
    winAir.set(key3(ix, y, iz), null);
  }
}
// lamps standing in the air gaps: glowstone on the shopfront floor, lanterns on upper floors
for (const [k] of winAir) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 1 && (x + z) % 3 === 0) winAir.set(k, { block: "glowstone" });
  else if (y === 5 && (x + z) % 4 === 1) winAir.set(k, { block: "lantern", state: { hanging: "false" } });
}

const g = new Voxels([X, Y, Z]);

// the entrance: a two-high oak door in the north face, with its hall air behind
const doorAir = [key3(DOOR[0], 1, DOOR[1] + 1), key3(DOOR[0], 2, DOOR[1] + 1)];
for (const k of doorAir) winAir.set(k, null);

for (const [x, z] of [...H.keys()].map((k) => k.split(",").map(Number))) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const k3 = key3(x, y, z);
    if (x === DOOR[0] && z === DOOR[1] && (y === 1 || y === 2)) {
      g.set(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (winAir.has(k3)) {
      const lamp = winAir.get(k3);
      if (lamp) g.set(x, y, z, lamp.block, lamp.state);
      continue;
    }
    const ex = exposed(x, z, y);
    if (!ex.length) {
      g.set(x, y, z, y === t - 1 ? "smooth_stone" : "stone");     // solid fill, roof membrane on top
      continue;
    }
    const band = bandOf(y, t);
    const corner = ex.length > 1;
    if (band === "plinth" || band === "parapet" || (corner && band !== "fascia" && band !== "string")) {
      g.set(x, y, z, "stone_bricks");                             // plinth, cap, and the quoins at the corners
    } else if (band === "fascia" || band === "string") {
      g.set(x, y, z, "white_concrete");
    } else if (band === "lintel") {
      g.set(x, y, z, windows.has(k3) ? "white_concrete" : "bricks");
    } else if (windows.has(k3)) {
      const d = ex[0];
      const ns = d === "N" || d === "S";
      g.set(x, y, z, "glass_pane", ns ? { east: "true", west: "true", north: "false", south: "false" }
                                      : { north: "true", south: "true", east: "false", west: "false" });
    } else {
      g.set(x, y, z, y < 4 ? "polished_andesite" : "bricks");   // piers: stone on the shopfront, brick above
    }
  }
}

// roof plant on the lower roof, clear of the parapet: two condenser boxes
for (const [x, z] of [[4, 4], [7, 4]]) g.set(x, 5, z, "light_gray_concrete");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_448579572.nbt");
console.log(JSON.stringify(out));

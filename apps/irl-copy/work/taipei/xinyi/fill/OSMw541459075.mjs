import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541459075";
const cells = JSON.parse(readFileSync(base + ".cells.json", "utf8"));

const W = 12, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

const maxG = Math.max(...cells.map((c) => c[2]));
// Flat roof about 11 blocks above lowest ground; 2 storeys of ~5 plus parapet.
const roofTop = Math.min(H - 4, Math.max(11, maxG + 6));

const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// Which sides are exposed to the outside
function exposed(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("north");
  if (!has(x, z + 1)) m.push("south");
  if (!has(x + 1, z)) m.push("east");
  if (!has(x - 1, z)) m.push("west");
  return m;
}
const isEdge = (x, z) => exposed(x, z).length >= 1;
const isCorner = (x, z) => exposed(x, z).length >= 2;
const outOf = (x, z) => {
  const m = exposed(x, z);
  return m.length === 1 ? m[0] : null;
};
// position along the facade
const alongIdx = (x, z, out) => (out === "north" || out === "south" ? x - minX : z - minZ);

// Pick the entrance: a non-corner south-facing (else any) edge cell at street level
let doorCell = null;
for (const [x, z, gr] of cells) {
  if (gr > 3 || isCorner(x, z) || !isEdge(x, z)) continue;
  if (outOf(x, z) === "south") { doorCell = [x, z, gr]; break; }
}
if (!doorCell) {
  for (const [x, z, gr] of cells) {
    if (gr > 3 || isCorner(x, z) || !isEdge(x, z)) continue;
    doorCell = [x, z, gr];
    break;
  }
}
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

// A window pane sits on a non-corner edge cell, not a mullion, not the door
function isPane(x, z) {
  if (!has(x, z) || !isEdge(x, z) || isCorner(x, z)) return false;
  if (`${x},${z}` === doorKey) return false;
  const out = outOf(x, z);
  if (!out) return false;
  return alongIdx(x, z, out) % 3 !== 0;
}

const paneProps = (x, z) => {
  const out = outOf(x, z);
  const conn = (dx, dz) => (isPane(x + dx, z + dz) && outOf(x + dx, z + dz) === out ? "true" : "false");
  if (out === "north" || out === "south") {
    return { north: "false", south: "false", east: conn(1, 0), west: conn(-1, 0) };
  }
  return { north: conn(0, -1), south: conn(0, 1), east: "false", west: "false" };
};

// ---- Build ----
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const out = outOf(x, z);

  // Foundation up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) {
    g.set(x, y, z, y === gr - 1 ? "polished_granite" : "polished_andesite");
  }

  for (let y = gr; y < roofTop && y < H; y++) {
    const r = y % 5;
    const isGroundFloor = y < 5;

    if (!edge) {
      if (r === 0 || y === roofTop - 1) {
        // storey slab, or the roof deck
        g.set(x, y, z, y === roofTop - 1 ? "gray_concrete" : "light_gray_concrete");
      } else if (r === 2 && y < roofTop - 1 && (x * 7 + z * 5 + y * 3) % 11 === 0) {
        // warm light behind the glass line, inside the floor plate
        g.set(x, y, z, "shroomlight");
      }
      continue;
    }

    if (corner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (r === 0) {
      g.set(x, y, z, "light_gray_concrete");
    } else if (r === 4) {
      g.set(x, y, z, "white_concrete"); // cornice / storey line
    } else {
      // window band (r 1..3); ground floor is the shopfront
      const key = `${x},${z}`;
      if (key === doorKey && (y === gr || y === gr + 1) && isGroundFloor) {
        g.set(x, y, z, "oak_door", {
          facing: out,
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (alongIdx(x, z, out) % 3 === 0) {
        g.set(x, y, z, "white_concrete"); // mullion frame
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
      }
    }
  }

  // Parapet on the exposed edges
  if (edge && roofTop < H) {
    g.set(x, roofTop, z, "white_concrete");
  }
}

// Roof plant room in the middle of the deck
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x < 3 || x > 8 || z < 8 || z > 16) continue;
  if (gr > roofTop - 1) continue;
  for (let y = roofTop; y <= roofTop + 1 && y < H; y++) {
    g.set(x, y, z, y === roofTop + 1 ? "stone_bricks" : "light_gray_concrete");
  }
}

g.save(base + ".nbt");

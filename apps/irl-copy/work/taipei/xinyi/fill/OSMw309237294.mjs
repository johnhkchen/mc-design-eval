import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309237294";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 32, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Two-storey mid-century commercial block: stone plinth, white rendered walls,
// light-grey storey bands, glazed shopfronts below and ribbon windows above,
// stone parapet. Roof about 11 blocks above the lowest ground.
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const key = (x, z) => `${x},${z}`;
const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(key(x, z), gr);
const has = (x, z) => GROUND.has(key(x, z));
const L = Math.min(...cells.map((c) => c[2]));          // lowest ground under the footprint

const DV = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Outward face of a perimeter cell, or null for interior cells.
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

const pendingDoors = [];
const pendingLights = [];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const topY = Math.max(L + 10, gr + 1);                 // roof deck level for this cell
  const out = outward(x, z);
  const per = out !== null;

  // Datum levels: ground, first floor slab, roof deck.
  const levels = [...new Set([gr, L + 5, topY].filter((v) => v >= gr && v <= topY))].sort((a, b) => a - b);

  for (let k = 0; k < levels.length; k++) {
    const y = levels[k];
    let mat;
    if (per) {
      if (k === 0) mat = "stone_bricks";                       // base course
      else if (y === topY) mat = "stone_bricks";              // parapet cap
      else if (y === L + 5) mat = "light_gray_concrete";      // storey band
      else mat = "white_concrete";
    } else {
      mat = y === topY ? "light_gray_concrete" : "stone";     // floor slab / roof deck
    }
    put(x, y, z, mat);
  }

  // Walls between datums (air gap behind glass, no interiors).
  if (per) {
    const alongX = out === "north" || out === "south";
    const i = alongX ? x : z;
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    const pier = i % 4 === 0;

    for (let k = 0; k < levels.length - 1; k++) {
      for (let y = levels[k] + 1; y < levels[k + 1]; y++) {
        const rel = y - L;
        let mat = "white_concrete";
        let props;
        if (rel >= 1 && rel <= 3) {
          if (!pier) { mat = "glass_pane"; props = paneProps; }
        } else if (rel === 4) {
          mat = pier ? "white_concrete" : "light_gray_concrete";
        } else if (rel >= 6 && rel <= 8) {
          if (!pier) { mat = "glass_pane"; props = paneProps; }
        } else if (rel === 9) {
          mat = pier ? "white_concrete" : "light_gray_concrete";
        }
        put(x, y, z, mat, props);
      }
    }

    // Warm light behind selected windows.
    const [dx, dz] = DV[out];
    const ix = x - dx, iz = z - dz;
    if (!pendingLights.length || true) {
      if (!pier && i % 8 === 2 && has(ix, iz)) {
        if (!(outward(ix, iz) !== null)) {
          if ([2, 7].includes(y0rel(levels, L))) {}
        }
      }
    }
    if (!pier && i % 8 === 2 && has(ix, iz) && outward(ix, iz) === null) {
      for (const rel of [2, 7]) {
        const y = L + rel;
        if (y > gr && y < topY && !levels.includes(y)) {
          pendingLights.push([ix, y, iz, rel === 2 ? "glowstone" : "shroomlight"]);
        }
      }
    }
  } else if (topY === L + 10 && (x % 6 === 3) && (z % 5 === 2)) {
    // Roof plant boxes on the deck.
    put(x, topY + 1, z, "light_gray_concrete");
  }
}

// Helper kept trivial (unused logic guard).
function y0rel() { return -1; }

// Single entrance on the north face, nearest the middle of the frontage.
{
  const northCells = cells.filter(([x, z]) => outward(x, z) === "north");
  if (northCells.length) {
    const mx = northCells.reduce((s, c) => s + c[0], 0) / northCells.length;
    northCells.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx));
    const [ex, ez, eg] = northCells[0];
    const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
    pendingDoors.push([ex, eg + 1, ez, { ...doorProps, half: "lower" }]);
    pendingDoors.push([ex, eg + 2, ez, { ...doorProps, half: "upper" }]);
    // Lintel above the door to read as an entrance.
    pendingLights.push([ex, eg + 3, ez, "light_gray_concrete"]);
  }
}

for (const [x, y, z, id] of pendingLights) put(x, y, z, id);
for (const [x, y, z, props] of pendingDoors) put(x, y, z, "dark_oak_door", props);

g.save(`${DIR}/${ID}.nbt`);

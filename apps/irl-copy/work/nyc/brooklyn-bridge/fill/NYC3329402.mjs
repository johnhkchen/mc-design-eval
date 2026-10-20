import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3329402";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 18 Bridge Street, DUMBO: 1910 brick mixed-use warehouse/tenement, ~6 storeys,
// cobble/stone base, common-bond brick walls, stone sills and cornice,
// ground-floor shopfront, one entrance, glass windows with brick piers.
const W = 15, H = 24, D = 10;
const g = new Voxels([W, H, D]);

const idx = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => idx.has(`${x},${z}`);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Outward face of a perimeter cell (null for interior cells)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}
const FACING = { N: "north", S: "south", E: "east", W: "west" };

// Building-wide roof level: median of lidar roofs, then each cell snapped to
// whole 2-block storeys relative to that median so the parapet is clean.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];

function topFor(rf, gr) {
  const minTop = gr + 5;
  let t = medRoof + 2 * Math.round((rf - medRoof) / 2);
  return clamp(t, minTop, H - 2);
}

// Entrance: perimeter cell on the north face nearest the frontage centre
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (faceOf(x, z) !== "N") continue;
    const d = Math.abs(x - Math.floor(W / 2));
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
  if (!doorKey) {
    for (const [x, z] of cells) {
      if (faceOf(x, z)) { doorKey = `${x},${z}`; break; }
    }
  }
}

for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = clamp(Math.round(c[2]), 0, H - 8);
  const top = topFor(c[3], gr);

  // Foundation: cobble below, stone plinth surface at ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "cobblestone");
  g.set(x, gr, z, "stone_bricks");

  const f = faceOf(x, z);

  if (!f) {
    // Interior: air gap, floor slabs, roof deck
    for (let k = 1; gr + 2 * k < top - 1; k++) {
      g.set(x, gr + 2 * k, z, "smooth_stone");
    }
    g.set(x, top - 1, z, "stone_bricks");
    if (x % 5 === 2 && z % 4 === 1 && top + 1 <= H - 1) {
      g.set(x, top, z, "bricks");
      g.set(x, top + 1, z, "bricks");
    }
    continue;
  }

  // Perimeter wall
  const along = (f === "N" || f === "S") ? x : z;
  const isPier = along % 3 === 0;
  for (let y = gr + 1; y <= top; y++) {
    const rel = y - gr - 1;
    let id;
    if (y === top) {
      id = "stone_bricks";                       // parapet cap
    } else if (y === top - 1) {
      id = "stone_bricks";                       // cornice
    } else if (rel % 2 === 0) {
      // spandrel row: stone sill directly under each window, brick elsewhere
      const belowWindow = y + 1 <= top - 2 && !isPier;
      id = belowWindow ? "stone_bricks" : "bricks";
    } else {
      // window row
      if (isPier) {
        id = "bricks";                           // brick pier
      } else if (((x * 3 + y * 5) % 17) === 0 && y > gr + 1 && y < top - 2) {
        id = "glowstone";                        // rare warm lit window
      } else {
        id = "glass";
      }
    }
    g.set(x, y, z, id);
  }
}

// Entrance door (overrides the shopfront glass on the chosen cell)
if (doorKey) {
  const [dx, dz] = doorKey.split(",").map(Number);
  const f = faceOf(dx, dz) || "N";
  const c = cells.find(([x, z]) => x === dx && z === dz);
  const gr = clamp(Math.round(c[2]), 0, H - 8);
  const doorProps = (half) => ({
    facing: FACING[f],
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(dx, gr + 1, dz, "oak_door", doorProps("lower"));
  g.set(dx, gr + 2, dz, "oak_door", doorProps("upper"));
}

g.save(`${DIR}/${ID}.nbt`);

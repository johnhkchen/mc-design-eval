import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/../../../../../../apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167428";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 22, H = 38, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level (rounded)
const cells = new Map();
for (const [x, z, gr] of raw) cells.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => cells.has(`${x},${z}`);
const groundAt = (x, z) => cells.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Vertical plan (absolute y, 0 = lowest ground):
// storeys 0-4, 5-9, 10-14, 15-19, 20-24 (5 blocks each), roof deck 25, parapet 26, plant 26-28, rod to 31.
const ROOF = 25;
const PARAPET = 26;
const BAND_LEVELS = [5, 10, 15, 20];

// Pass 1: foundation, walls, floor slabs, roof deck
for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation under the cell up to its ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs / storey lines
  for (const y of BAND_LEVELS) {
    if (y < gr) continue;
    g.set(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
  }

  if (!edge) {
    // Interior: only floor slabs and roof deck, air in between (no interiors)
    g.set(x, ROOF, z, "gray_concrete");
    continue;
  }

  // Exterior wall column from ground to roof
  for (let y = gr; y <= ROOF; y++) {
    let id;
    if (y === ROOF) {
      id = "white_concrete"; // cornice course at top of walls
    } else if (y % 5 === 0) {
      id = "white_concrete"; // storey line
    } else if (y < 5) {
      // Ground floor shopfront: pilasters with glass bays
      id = (x + z) % 4 === 0 ? "polished_andesite" : "glass";
    } else {
      // Upper storeys: mullions and window bays with occasional lit windows
      if ((x + z) % 3 === 0) {
        id = "white_concrete";
      } else if ((x * 5 + z * 3 + y * 7) % 13 === 0) {
        id = "glowstone"; // warm lit window
      } else {
        id = "light_blue_stained_glass";
      }
    }
    g.set(x, y, z, id);
  }

  // Parapet ring on the edge
  g.set(x, PARAPET, z, "white_concrete");
}

// Pass 2: entrance on the north face (exposed -z side), nearest the face's middle
{
  const northEdge = [...cells.keys()]
    .map((k) => k.split(",").map(Number))
    .filter(([x, z]) => !has(x, z - 1));
  if (northEdge.length) {
    const mx = northEdge.reduce((s, [x]) => s + x, 0) / northEdge.length;
    const [ex, ez] = northEdge.reduce((best, c) =>
      Math.abs(c[0] - mx) < Math.abs(best[0] - mx) ? c : best
    );
    const gr = groundAt(ex, ez);
    const doorProps = { facing: "south", hinge: "left", open: "false", powered: "false" };
    g.set(ex, gr, ez, "oak_door", { ...doorProps, half: "lower" });
    g.set(ex, gr + 1, ez, "oak_door", { ...doorProps, half: "upper" });
    // Lintel over the door, hanging lantern beneath it
    g.set(ex, gr + 4, ez, "white_concrete");
    g.set(ex, gr + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 3: rooftop plant room (interior cells only) and lightning rod
{
  const keys = [...cells.keys()].map((k) => k.split(",").map(Number));
  const cx = keys.reduce((s, [x]) => s + x, 0) / keys.length;
  const cz = keys.reduce((s, [, z]) => s + z, 0) / keys.length;
  for (const [x, z] of keys) {
    if (isEdge(x, z)) continue;
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1) {
      for (let y = PARAPET; y <= 28; y++) g.set(x, y, z, "light_gray_concrete");
    }
  }
  // Rod on a central interior cell
  let best = null;
  for (const [x, z] of keys) {
    if (isEdge(x, z)) continue;
    const d = Math.abs(x - cx) + Math.abs(z - cz);
    if (!best || d < best.d) best = { x, z, d };
  }
  if (best) for (let y = 29; y <= 31; y++) g.set(best.x, y, best.z, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);

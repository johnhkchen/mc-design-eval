// Residential block, built 1870: a ground floor and five floors of Paris limestone (calcite piers, stone string courses
// and lintels), then a stepped zinc mansard for the seventh storey. The lidar roofs snap to storey lines; the walls are a
// hollow shell with glass, an air gap behind each pane, and a floor slab per storey. The courtyard notch is open to the south.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184467.cells.json`, "utf8"));
const X = 27, Y = 45, Z = 14;

const TRIM = "stone_bricks", WALL = "calcite", ZINC = "deepslate_tiles", FLOOR = "oak_planks";
const DOOR_XS = [5, 21];                          // two entrances on the north front, each on a window bay

// the lidar roof heights snap to storey lines (5 for the ground storey, then every 4): clean tiers, not noise
const TIERS = [5, 9, 13, 17, 21, 25, 29];
const snap = (r) => { let best = TIERS[0]; for (const t of TIERS) if (Math.abs(t - r) <= Math.abs(best - r)) best = t; return best; };

const col = new Map();                            // "x,z" -> { g: ground, r: first air row above the roof }
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { g, r: snap(r) });
const has = (x, z) => col.has(`${x},${z}`);

// edge distance: 1 for a cell on the outline, rising inward (BFS from the outside), used for the mansard's set-backs
const edge = new Map(), queue = [];
for (const [x, z] of cells)
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) { edge.set(`${x},${z}`, 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = edge.get(`${x},${z}`);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
    if (has(nx, nz) && !edge.has(k)) { edge.set(k, d + 1); queue.push([nx, nz]); }
  }
}

// inside the building: between the ground and the roof; from the 6th floor line up, each tier steps in one block from the edge
const inside = (x, y, z) => {
  const c = col.get(`${x},${z}`);
  if (!c || y < c.g || y >= c.r) return false;
  return y < 25 || edge.get(`${x},${z}`) > (y < 27 ? 1 : 2);
};
const isFloor = (y) => y >= 5 && (y - 5) % 4 === 0;      // string courses = floor lines (5, 9, ... 25)
// row kinds on the facade: plinth at the ground, windows and lintels in each storey, a string course on each floor line
const rowKind = (y, g) => {
  if (y === g) return "plinth";
  if (y < 5) return y === 4 ? "lintel" : "win";
  const m = (y - 5) % 4;
  return m === 0 ? "string" : m === 3 ? "lintel" : "win";
};

const v = new Voxels([X, Y, Z]);
const panes = [];                                 // [x, y, z, inward dx, inward dz] for each window, for the lights behind the glass

for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.g; y++) v.set(x, y, z, TRIM);            // foundation up to the lowest ground under the cell
  for (let y = c.g; y < c.r; y++) {
    if (!inside(x, y, z)) continue;
    const shell = !inside(x + 1, y, z) || !inside(x - 1, y, z) || !inside(x, y, z + 1) || !inside(x, y, z - 1) ||
      !inside(x, y + 1, z) || !inside(x, y - 1, z);
    if (!shell) { if (isFloor(y)) v.set(x, y, z, FLOOR); continue; }     // air behind the glass; slab per floor
    const attic = y >= 25;
    const N = !inside(x, y, z - 1), S = !inside(x, y, z + 1), W = !inside(x - 1, y, z), E = !inside(x + 1, y, z);
    const ns = N || S, ew = W || E;
    if (ns === ew) { v.set(x, y, z, attic ? ZINC : TRIM); continue; }        // base or cap (no face), or a corner quoin
    // a facade: along x for the north/south faces, along z for the east/west ones
    const cc = ns ? x : z, kind = rowKind(y, c.g), bay = cc % 4 === 1 || cc % 4 === 2;
    if (kind === "plinth" || kind === "string") { v.set(x, y, z, TRIM); continue; }
    if (N && DOOR_XS.includes(x) && (y === c.g + 1 || y === c.g + 2)) {
      v.set(x, y, z, "dark_oak_door", { facing: "north", half: y === c.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (kind === "win" && bay) {
      const state = ns ? { north: "false", south: "false", east: "true", west: "true" }
        : { north: "true", south: "true", east: "false", west: "false" };
      v.set(x, y, z, "glass_pane", state);
      panes.push([x, y, z, N ? 0 : S ? 0 : W ? 1 : -1, N ? 1 : S ? -1 : 0]);
      continue;
    }
    if (kind === "lintel" && bay) { v.set(x, y, z, attic ? ZINC : TRIM); continue; }
    v.set(x, y, z, attic ? ZINC : WALL);                                    // piers, and the mansard's face
  }
}

// warm light behind some glass: an air gap stays between the pane and the lamp (glowstone, shroomlight or a lantern on a floor)
for (const [x, y, z, dx, dz] of panes) {
  const h = (x * 31 + y * 17 + z * 13) % 7;
  if (h !== 0) continue;
  const tx = x + 2 * dx, tz = z + 2 * dz;
  if (!inside(tx, y, tz) || v.val(tx, y, tz)) continue;
  const block = h === 0 ? "glowstone" : (x + y + z) % 2 ? "shroomlight" : "lantern";
  if (block === "lantern" && !v.val(tx, y - 1, tz)) continue;
  v.set(tx, y, tz, block, block === "lantern" ? { hanging: "false" } : undefined);
}

// roof equipment: brick chimney stacks on the top mansard tier, lanterns on the low wings' terraces
for (const [x, z] of [[4, 5], [13, 5], [22, 5]]) {
  const c = col.get(`${x},${z}`);
  if (!c || c.r !== 29 || edge.get(`${x},${z}`) < 3) continue;
  v.set(x, 29, z, "bricks"); v.set(x, 30, z, "bricks");
  v.set(x, 31, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  if (c.r >= 25 || edge.get(k) < 2 || (x + 2 * z) % 11 !== 0) continue;
  v.set(x, c.r, z, "lantern", { hanging: "false", waterlogged: "false" });
}

const out = v.save(`${DIR}/FR245184467.nbt`);
console.log(`FR245184467: ${out.blocks} blocks, ${out.palette} palette entries`);

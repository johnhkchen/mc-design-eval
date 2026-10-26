// 1350 Connecticut Ave NW: a 1960s-70s Commercial-Office-Large in Washington's pale precast-and-glass idiom
// (white/quartz piers and spandrels, light-blue glazing, a granite plinth, a 5-high glazed shopfront). Massing from
// the lidar roof: lidar tiers snapped to flat setbacks (6 annex, 13, 16 podium wings, 19 ring, 20 tower core), the
// tower stands on the wings' columns, and every cell is solid from y 0 to its roof so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63890.cells.json", "utf8"));

// lidar roof -> flat tier (noise under 10 is a one-storey link; 15-17 is the podium; 18-19 a setback ring; 20 the crown)
const tier = (r) => (r < 10 ? 6 : r < 15 ? 13 : r < 18 ? 16 : r < 20 ? 19 : 20);

const C = new Map();
for (const [x, z, g, r] of cells) C.set(`${x},${z}`, { g, R: tier(r) });
const at = (x, z) => C.get(`${x},${z}`);

const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
// faces of (x, z) that are outside at height y: no neighbour in plan, or the neighbour's roof is below y
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.R; }).map(([f]) => f);

// storey lines from the cell's ground: a 5-high shopfront, then 4-high office storeys (floor, two glass rows, a band)
const STOREY = [0, 5, 9, 13, 17];
const band = (rel) => { let k = 0; while (k + 1 < STOREY.length && rel >= STOREY[k + 1]) k++; return { k, off: rel - STOREY[k] }; };
const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

const g3 = new Voxels([16, 32, 36]);
const put = (x, y, z, block, state) => g3.set(x, y, z, block, state);
const lantern = (hanging) => ({ hanging: hanging ? "true" : "false", waterlogged: "false" });

for (const [x, z, , ] of cells) {
  const { g, R } = at(x, z);
  for (let y = 0; y < R; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }          // foundation under the uphill cells
    const rel = y - g, faces = exposed(x, z, y);

    // the entrance on the west face: a canopy over the door at the shopfront's top, a pair of hanging lanterns below it
    if (x <= 1 && z >= 15 && z <= 18 && rel === 3) { put(x, y, z, "smooth_stone"); continue; }
    if (x === 1 && (z === 16 || z === 17) && rel === 2) { put(x, y, z, "lantern", lantern(true)); continue; }

    if (y === R - 1) {                                              // roof: a cornice where it is exposed, a deck inside
      put(x, y, z, faces.length ? "smooth_quartz" : "gray_concrete");
      continue;
    }

    if (!faces.length) {                                            // interior: a floor slab per storey, air between
      if (STOREY.includes(rel)) put(x, y, z, "smooth_stone");
      continue;
    }

    // exterior wall: the face is the first one out; piers every third bay, glass between
    const face = faces[0], idx = face === "W" || face === "E" ? z : x;
    const { k, off } = band(rel);
    let b;
    if (k === 0) b = off === 0 ? "polished_granite" : off === 4 ? "smooth_quartz" : "light_blue_stained_glass";
    else b = off === 0 ? "white_concrete" : off === 3 ? "smooth_quartz" : "light_blue_stained_glass";
    if (b === "light_blue_stained_glass" && idx % 3 === 0) b = "smooth_quartz";
    put(x, y, z, b);

    // a warm light behind some panes: a shroomlight in the air gap one cell inside the glass
    if (b === "light_blue_stained_glass" && (idx * 7 + y) % 13 === 0) {
      const [dx, dz] = inward[face], ix = x + dx, iz = z + dz;
      if (at(ix, iz) && !exposed(ix, iz, y).length && !STOREY.includes(rel)) put(ix, y, iz, "shroomlight");
    }
  }
}

// roof plant: a few 2-long light-grey boxes on the podium and ring decks, standing on the roof deck
for (const [x, z] of cells) {
  const { R } = at(x, z);
  if (R !== 16 && R !== 13) continue;
  if ((x * 5 + z * 3) % 17 !== 0 || exposed(x, z, R - 1).length || !at(x + 1, z) || exposed(x + 1, z, R - 1).length) continue;
  put(x, R, z, "light_gray_concrete"); put(x + 1, R, z, "light_gray_concrete");
}

const stats = g3.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63890.nbt");
console.log(JSON.stringify(stats));

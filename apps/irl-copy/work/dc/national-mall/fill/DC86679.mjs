// 1130 17th St NW: a Commercial-Office-Large block, a 1920s-30s limestone-faced office (pale calcite piers, granite
// base and shopfront, smoked glass in steel-looking frames, a stone cornice) with a stepped massing from the lidar:
// a 15-block core on the west, 13-block wings on the east and the south, a 3-block entrance pavilion at the north end.
// Every footprint cell is solid from y 0 up to its roof, except the air behind the glass on the window rows; the
// storeys run on a 2-block rhythm (window row on odd rows, floor slab on even rows), so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86679.cells.json`, "utf8"));

const W = 6, H = 27, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });

// ---- massing: 3x3 median of the lidar roof, snapped to flat tiers (the lidar here is already in clean steps) ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tier = (m) => (m >= 14 ? 15 : m >= 12 ? 13 : 3);
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  top.set(key(x, z), tier(median(near)));
}
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint
const G = (x, z) => raw.get(key(x, z))?.gr ?? 0;

// Directions in which a cell at row y faces open air: the neighbour is outside the footprint or stands no higher than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const LIME = "calcite", GRANITE = "polished_andesite", CORNICE = "stone_bricks", SLAB = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane", DECK = "smooth_stone";
const panes = new Map();                       // "x,y,z" -> the exposed sides, for the pane connections and lights
const pk = (x, y, z) => `${x},${y},${z}`;

// ---- main pass: foundation and base course, window rows on odd rows, floor slabs on even rows, cornice on the top ----
for (const [x, z] of [...top.keys()].map((k) => k.split(",").map(Number))) {
  const t = T(x, z), gr = G(x, z);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y);
    const ext = sides.length > 0;
    const ew = sides.some((s) => s === "E" || s === "W");
    const ns = sides.some((s) => s === "N" || s === "S");
    if (y < gr) {                                                // foundation below the lowest ground
      g.set(x, y, z, ext ? GRANITE : "stone");
    } else if (y === t - 1) {                                    // cornice / roof deck
      g.set(x, y, z, ext ? CORNICE : DECK);
    } else if (y === 0) {                                        // base course on the lowest cells
      g.set(x, y, z, ext ? GRANITE : "stone");
    } else if (y % 2 === 0) {                                    // floor slab: a smooth string course on the street faces
      g.set(x, y, z, ext ? SLAB : "stone");
    } else if (ext) {                                            // window row
      const ground = y === 1;                                    // the shopfront row
      if (ew && ns) g.set(x, y, z, ground ? GRANITE : LIME);     // corners
      else if (ew) {                                             // long faces: a pier every third cell, glass between
        if (z % 3 === 0) g.set(x, y, z, ground ? GRANITE : LIME);
        else { g.set(x, y, z, GLASS); panes.set(pk(x, y, z), sides); }
      } else {                                                   // the ends: a pier every other cell
        if (x % 2 === 0) { g.set(x, y, z, GLASS); panes.set(pk(x, y, z), sides); }
        else g.set(x, y, z, ground ? GRANITE : LIME);
      }
    }
    // else: an interior window-row cell stays air (no interiors, just the gap behind the glass)
  }
}

// ---- a parapet course on the street-facing edge of each roof tier: a half-block stone slab on the cornice, so the
// cornice throws a shadow line at dusk instead of ending flush with the wall ----
for (const [k] of top) {
  const [x, z] = k.split(",").map(Number), t = T(x, z);
  if (openSides(x, z, t - 1).length) g.set(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- the north entrance pavilion (x 2..5, z 0, 3 blocks): a dark-oak-framed door in a granite surround, a
// stone canopy band over it; the door's top half takes the pavilion's cap cell ----
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(3, 1, 0, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(3, 2, 0, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(2, 1, 0, GRANITE); g.set(4, 1, 0, GRANITE);
for (const x of [2, 3, 4, 5]) g.set(x, 3, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
g.set(3, 3, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
panes.delete(pk(3, 1, 0)); panes.delete(pk(2, 1, 0)); panes.delete(pk(4, 1, 0));

// ---- glass panes: connect to any neighbour that is built (panes and piers both), so each window is a framed grid ----
const built = (x, y, z) => g.get(x, y, z) !== null;
for (const [k] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, GLASS, {
    north: String(built(x, y, z - 1)), south: String(built(x, y, z + 1)),
    east: String(built(x + 1, y, z)), west: String(built(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- warm light: glowstone set just inside some panes, in the free air behind the glass ----
let lights = 0;
for (const [k, sides] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const [ix, iz] = sides.includes("W") ? [x + 1, z] : sides.includes("E") ? [x - 1, z]
    : sides.includes("N") ? [x, z + 1] : [x, z - 1];
  if (T(ix, iz) <= y || built(ix, y, iz)) continue;            // only a free interior cell
  if ((x * 3 + y * 5 + z) % 4 === 1) { g.set(ix, y, iz, "glowstone"); lights++; }
}

// ---- roof plant: HVAC boxes on the 13-block roof, standing on its deck ----
for (const [x, z] of [[3, 4], [4, 10], [4, 6]]) {
  if (T(x, z) === 13) g.set(x, 13, z, "light_gray_concrete");
}

const counts = g.save(`${DIR}/DC86679.nbt`);
console.log("saved DC86679.nbt", counts, "panes", panes.size, "lights", lights);

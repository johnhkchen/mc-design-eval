// 443 New York Ave NW: a c. 1960s pale-concrete elevator apartment block on a falling site (2 blocks from the north
// edge down to the south). A 16-high podium (four storeys over a plinth, then a cornice course) carries a sixth storey
// on the lidar's 18-block core, set in from the podium edge, with an elevator overrun on top. Piers and spandrels are
// pale concrete, the panes sit in them as a grid, and every floor line is a light-grey string course. The uphill
// (north) face has a recessed-looking double entrance under a stone hood with hanging lanterns. Some windows show warm
// light from glowstone just inside the glass. Rooftop HVAC units stand on the podium. No interiors: the window rows are
// air behind the glass, with a solid floor slab at every storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61501.cells.json`, "utf8"));

const W = 16, H = 21, D = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const pk = (x, y, z) => `${x},${y},${z}`;
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

// ---- massing: 3x3 median of the lidar roof; the core reads 18, everything else the 16 podium ----
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const top = new Map(), gnd = new Map();
for (const [x, z, gr] of cells) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  top.set(key(x, z), median(near) >= 17.5 ? 18 : 16);
  gnd.set(key(x, z), gr);
}
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint
const G = (x, z) => gnd.get(key(x, z));

// Faces at row y that look onto open air: the neighbour is outside the footprint or stands lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

// Row kinds, the same for every column so the storey lines line up: plinth at rows 0 (and 1 over the uphill ground),
// a string course on the rows 2, 5, 8, 11, 14, 17, window rows between, a parapet on the top row.
const kindOf = (x, z, y) => {
  const t = T(x, z), gr = G(x, z);
  if (y === t - 1) return "parapet";
  if (y === 0) return "plinth";
  if (y === 1) return gr >= 2 ? "plinth" : "win";
  if (y % 3 === 2) return "string";
  return "win";
};

// Entrance on the uphill face (z 0): double doors at x 5-6, a stone hood over them, lanterns at the jambs.
const over = new Map();
over.set(pk(5, 3, 0), ["oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }]);
over.set(pk(5, 4, 0), ["oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }]);
over.set(pk(6, 3, 0), ["oak_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" }]);
over.set(pk(6, 4, 0), ["oak_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" }]);
for (const x of [4, 5, 6, 7]) over.set(pk(x, 5, 0), ["polished_andesite", null]);
over.set(pk(4, 4, 0), ["lantern", { hanging: "true", waterlogged: "false" }]);
over.set(pk(7, 4, 0), ["lantern", { hanging: "true", waterlogged: "false" }]);

const PLINTH = "polished_andesite", STONE = "stone", STRING = "light_gray_concrete", PIER = "white_concrete";
const CORNER = "quartz_block", ROOF = "smooth_stone", GLASS = "gray_stained_glass_pane";

// ---- main pass: solid core, floor slabs, pier/pane grid on the exposed faces, air behind the glass ----
const panes = new Map();   // "x,y,z" -> the axis the pane runs along ('z' on the east/west faces, 'x' on north/south)
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const o = over.get(pk(x, y, z));
    if (o) { g.set(x, y, z, o[0], o[1] ?? undefined); continue; }
    const sides = exposed(x, z, y);
    const out = sides.length > 0;
    const kind = kindOf(x, z, y);
    if (kind === "parapet") g.set(x, y, z, ROOF);
    else if (kind === "plinth") g.set(x, y, z, out ? PLINTH : STONE);
    else if (kind === "string") g.set(x, y, z, out ? STRING : STONE);
    else if (out) {                                              // window row on the exposed faces
      const ew = sides.some((s) => s === "E" || s === "W");
      const ns = sides.some((s) => s === "N" || s === "S");
      if (ew && ns) g.set(x, y, z, CORNER);
      else if (ew) {                                             // east/west faces run along z: a pier every third cell
        if (z % 3 === 0) g.set(x, y, z, PIER);
        else panes.set(pk(x, y, z), "z");
      } else {                                                   // north/south faces run along x
        if (x % 3 === 0) g.set(x, y, z, PIER);
        else panes.set(pk(x, y, z), "x");
      }
    }
    // else: an interior window-row cell stays air (no interiors)
  }
}

// ---- glass panes: each connects to its neighbours in its own face, so every window reads as a framed grid ----
for (const [p, axis] of panes) {
  const [x, y, z] = p.split(",").map(Number);
  const has = (dx, dz) => panes.has(pk(x + dx, y, z + dz));
  const s = axis === "z"
    ? { north: String(has(0, -1)), south: String(has(0, 1)), east: "false", west: "false" }
    : { north: "false", south: "false", east: String(has(1, 0)), west: String(has(-1, 0)) };
  g.set(x, y, z, GLASS, { ...s, waterlogged: "false" });
}

// ---- warm light: glowstone just inside some panes (a window-row cell with a pane beside it, every few cells) ----
let lights = 0;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z);
  for (let y = 3; y < t - 1; y++) {
    if (kindOf(x, z, y) !== "win" || exposed(x, z, y).length > 0) continue;
    const behindPane = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => panes.has(pk(x + dx, y, z + dz)));
    if (behindPane && (x + 2 * z + y) % 4 === 0) { g.set(x, y, z, "glowstone"); lights++; }
  }
}

// ---- rooftop: HVAC units on the podium roof, and an elevator overrun set in from the tower's edge ----
const podiumRoof = cells.filter(([x, z]) => T(x, z) === 16 && exposed(x, z, 15).length === 0)
  .filter(([x, z]) => (x * 5 + z * 3) % 11 === 2).slice(0, 4);
for (const [x, z] of podiumRoof) g.set(x, 16, z, "iron_block");

const tower = cells.filter(([x, z]) => T(x, z) === 18);
const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
let best = null;
for (const [x, z] of tower) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([qx, qz]) => T(qx, qz) === 18 && exposed(qx, qz, 17).length === 0)) continue;
  const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
  if (!best || d < best.d) best = { x, z, d, quad };
}
if (best) {
  for (const [qx, qz] of best.quad) { g.set(qx, 18, qz, PIER); g.set(qx, 19, qz, ROOF); }
}

const info = g.save(`${DIR}/DC61501.nbt`);
console.log(JSON.stringify({ podium: cells.filter(([x, z]) => T(x, z) === 16).length, tower: tower.length, panes: panes.size, lights, hvac: podiumRoof.length, penthouse: best ? [best.x, best.z] : null, ...info }));

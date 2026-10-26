// DC54028: a 1930s Federal-style limestone office block on a diagonal street edge (Federal Triangle era, 6-storey
// massing at 0.42 blocks/m). Shell + floor slabs + air gaps; no interiors. Tiers from the lidar roof heights:
// 11 = main body, 12 = corner pavilion, 6 = setback notch, 3 = lower wing (roof 0-1 is ground-level noise, so a
// one-storey wing). Storey lines at y 4 and y 8; cornice at y 10; parapet at y 11 on the main body.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54028.cells.json`, "utf8"));

// footprint lookup: "x,z" -> { ground, roof }
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const at = (x, z) => fp.get(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// snap each lidar roof height to a clean tier; anything under one storey is a 3-block lower wing
const tierOf = (roof) => (roof >= 12 ? 12 : roof >= 11 ? 11 : roof >= 6 ? 6 : 3);

// the kind of each y band, bottom up, for each tier (the tier is its roof height)
const LAYOUT = {
  3: ["base", "win", "cornice"],
  6: ["base", "win", "win", "win", "belt", "cornice"],
  11: ["base", "win", "win", "win", "belt", "win", "win", "win", "belt", "win", "cornice"],
};
LAYOUT[12] = [...LAYOUT[11], "cap"];

const outward = (x, z) => Object.keys(DIRS).filter((f) => { const [dx, dz] = DIRS[f]; return !at(x + dx, z + dz); });
const isEdge = (x, z) => outward(x, z).length > 0;

// glass panes connect to solid neighbours along the face (piers), not to open ends or lower tiers
const paneState = (x, z, face, y) => {
  const solid = (dx, dz) => { const nb = at(x + dx, z + dz); return nb && y < tierOf(nb.roof) ? "true" : "false"; };
  const ns = face === "N" || face === "S";
  return ns
    ? { north: "false", south: "false", east: solid(1, 0), west: solid(-1, 0), waterlogged: "false" }
    : { north: solid(0, -1), south: solid(0, 1), east: "false", west: "false", waterlogged: "false" };
};

const g = new Voxels([10, 24, 17]);
const DOOR = [1, 16];   // the south tip: a corner cell, the entrance (stands on the granite base)
const glowAt = [];      // [x, y, z] lamps set in the interior behind window bays

for (const [x, z, ground, roof] of cells) {
  const tier = tierOf(roof);
  const faces = outward(x, z);
  const edge = faces.length > 0;
  const layout = LAYOUT[tier];

  // foundation under the cell (ground 0 everywhere here, kept for the rule)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < tier; y++) {
    const kind = layout[y];
    if (!edge) {
      // interior: floor slabs at the base and storey lines, the roof deck on top, air in the storeys
      if (kind === "base" || kind === "belt") g.set(x, y, z, "smooth_stone");
      else if (kind === "cornice" || kind === "cap") g.set(x, y, z, "stone");
      continue;
    }
    if (kind === "base") g.set(x, y, z, "polished_granite");
    else if (kind === "belt" || kind === "cornice" || kind === "cap") g.set(x, y, z, "smooth_quartz");
    else if (kind === "win") {
      // windows on a single outward face, two bays to a pier; corners are piers
      const face = faces.length === 1 ? faces[0] : null;
      const idx = face === "N" || face === "S" ? x : z;
      const isWin = face && idx % 3 !== 0;
      if (x === DOOR[0] && z === DOOR[1] && y <= 2) {
        g.set(x, y, z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (x === DOOR[0] && z === DOOR[1] && y === 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (isWin) {
        g.set(x, y, z, "glass_pane", paneState(x, z, face, y));
        // a lamp on the floor behind the bottom pane of some bays
        const lowest = y === 1 || y === 5 || y === 9;
        if (lowest && (x + z) % 3 === 0) {
          const [dx, dz] = DIRS[face];
          const ix = x - dx, iz = z - dz;
          if (at(ix, iz) && !isEdge(ix, iz) && y < tierOf(at(ix, iz).roof)) glowAt.push([ix, y, iz]);
        }
      } else g.set(x, y, z, "calcite");
    } else if (kind === "belt" || kind === "cornice") g.set(x, y, z, "smooth_quartz");
  }

  // main body's parapet: one slab course above the cornice on the outer edge
  if (edge && tier === 11) g.set(x, 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

for (const [x, y, z] of glowAt) g.set(x, y, z, "glowstone");

// roof equipment: a 2x2 plant room on the main roof, nearest the middle of the footprint (interior tier-11 cells)
const main = (x, z) => at(x, z) && tierOf(at(x, z).roof) === 11 && !isEdge(x, z);
let best = null;
for (const [x, z] of [...fp.keys()].map((k) => k.split(",").map(Number))) {
  if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => main(x + dx, z + dz))) continue;
  const d = Math.hypot(x + 0.5 - 4.5, z + 0.5 - 8);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    g.set(best.x + dx, 11, best.z + dz, "calcite");
    g.set(best.x + dx, 12, best.z + dz, "calcite");
    g.set(best.x + dx, 13, best.z + dz, "smooth_quartz");
  }
}

const out = `${DIR}/DC54028.nbt`;
const stats = g.save(out);
console.log(`DC54028: ${stats.blocks} blocks, ${stats.palette} palette entries, ${glowAt.length} lamps, roof plant ${best ? "placed" : "none"} -> ${out}`);

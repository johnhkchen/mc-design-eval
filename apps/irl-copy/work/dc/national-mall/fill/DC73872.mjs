import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// An 11 x 11 Federal-style office block of the 1930s: a two-storey limestone-faced (smooth quartz) block over a
// stone base, string courses at the storey lines, a flat stone roof behind a cornice and parapet, and a central
// plant pavilion one block higher (the lidar's 12s). The front (north) notch carries the entrance: a dark oak door
// under a stone lintel. Walls are one block thick, so every interior cell is air behind the glass, with a floor slab
// at each storey line. Some windows hold glowstone behind clear glass; the rest are light-blue tinted panes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73872.cells.json`, "utf8"));

const g = new Voxels([11, 24, 11]);

const key = (x, z) => `${x},${z}`;
const FP = new Map();
for (const [x, z, ground, roof] of cells) FP.set(key(x, z), { ground, roof });
const at = (x, z) => FP.get(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Exterior wall cells: on the footprint's edge, or beside a cell of a different roof height (a setback's face)
const isWall = (x, z) => {
  const c = at(x, z);
  return !!c && Object.values(DIRS).some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.roof !== c.roof; });
};
// The faces of a cell that look out of the footprint (the street or the sky-free outside)
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !at(x + DIRS[d][0], z + DIRS[d][1]));

const STRING = [4, 8];        // storey lines (floor slabs)
const WINDOW_ROWS = [[2, 3], [5, 6]];   // storey 1 and 2 window bands; the attic takes the rows under its deck

// 1. Solid massing: foundation to the ground, base course, walls, storey floors, cornice and deck
for (const [x, z, ground, roof] of cells) {
  const wall = isWall(x, z), deck = roof - 1;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");          // foundation
  g.set(x, ground, z, "stone_bricks");                                       // base course / ground floor slab
  for (let y = ground + 1; y <= deck; y++) {
    if (y === deck) g.set(x, y, z, wall ? "smooth_quartz" : "stone");        // cornice or flat roof deck
    else if (STRING.includes(y)) g.set(x, y, z, wall ? "chiseled_quartz_block" : "stone_bricks");
    else if (wall) g.set(x, y, z, "smooth_quartz");
  }
}

// 2. Articulation on the exterior: parapet, quoins, the door, window grids and warm lights
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(4, 2, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(4, 3, 0, "dark_oak_door", { ...door, half: "upper" });

const lit = (x, y, z) => (x * 3 + z * 5 + y) % 5 === 0;

for (const [x, z, ground, roof] of cells) {
  if (!isWall(x, z)) continue;
  const faces = exposed(x, z);
  if (!faces.length) continue;                       // a setback's face, not the street front
  const top = roof - 1;
  // Parapet: a half-block coping on the outer roof edge
  g.set(x, roof, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  const ns = faces.some((f) => f === "north" || f === "south");
  const ew = faces.some((f) => f === "east" || f === "west");
  if (ns && ew) {                                   // quoins at the corners
    for (let y = ground + 1; y < top; y++) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    continue;
  }
  for (const f of faces) {
    const along = f === "north" || f === "south" ? x : z;
    if (along % 2 === 0) {                          // the piers between the bays: fluted quartz columns, the door aside
      if (!(x === 4 && z === 0 && f === "north"))
        for (let y = ground + 1; y < top; y++) if (!STRING.includes(y)) g.set(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }                                               // the bays between: windows
    const [dx, dz] = DIRS[f];
    const rows = [...WINDOW_ROWS, [9, top - 1]].filter(([a, b]) => b >= a);
    for (const band of rows) {
      const [lo, hi] = band;
      for (let y = Math.max(lo, ground + 1); y <= Math.min(hi, top - 1); y++) {
        if (x === 4 && z === 0 && f === "north") continue; // the entrance
        const state = ns
          ? { east: "true", west: "true", north: "false", south: "false" }
          : { north: "true", south: "true", east: "false", west: "false" };
        const lamp = lit(x, y, z);
        g.set(x, y, z, lamp ? "glass_pane" : "light_blue_stained_glass_pane", state);
        if (lamp) {                                // glowstone in the room behind the glass
          const ix = x - dx, iz = z - dz;
          const inner = at(ix, iz);
          if (inner && !isWall(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// 3. Roof plant: copper ventilation boxes on the central pavilion
for (const [x, z] of [[3, 4], [4, 4], [3, 5], [4, 5]]) g.set(x, 12, z, "oxidized_copper");

const out = `${DIR}/DC73872.nbt`;
const r = g.save(out);
console.log(JSON.stringify(r));

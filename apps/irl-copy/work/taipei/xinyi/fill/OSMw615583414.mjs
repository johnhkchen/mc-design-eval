import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial block, c. 1990s: white tile facade, quartz piers
// and bands, light-blue glass bays, a recessed street entrance, a plain parapet
// and a small roof plant room. Roof line sits at y = 11 from the lidar record.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw615583414";
const W = 22, H = 23, D = 18;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .map(([x, z, gr]) => [x, z, Math.round(gr)]);

const g = new Voxels([W, H, D]);

const GR = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inside = (x, z) => GR.has(`${x},${z}`);

const DIRS = [
  { n: "north", dx: 0, dz: -1, axis: "x" },
  { n: "south", dx: 0, dz: 1, axis: "x" },
  { n: "west", dx: -1, dz: 0, axis: "z" },
  { n: "east", dx: 1, dz: 0, axis: "z" },
];
const outs = (x, z) => DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
const isPerim = (x, z) => inside(x, z) && outs(x, z).length > 0;

const M = {
  found: "stone_bricks",
  base: "polished_andesite",
  wall: "white_terracotta",
  trim: "smooth_quartz",
  cap: "smooth_quartz_slab",
  glass: "light_blue_stained_glass",
  floor: "smooth_stone",
  roof: "light_gray_concrete",
  ac: "iron_block",
};

// Street entrance: middle cell of the north (or south) face.
let ent = null;
for (const face of ["north", "south"]) {
  const list = cells
    .filter(([x, z]) => {
      const o = outs(x, z);
      return o.length === 1 && o[0].n === face;
    })
    .sort((a, b) => a[0] - b[0]);
  if (list.length) {
    const [ex, ez] = list[Math.floor(list.length / 2)];
    ent = { x: ex, z: ez, n: face };
    break;
  }
}

// Storey zones: floor 1 glazing above the base, floor 2 glazing below the cornice.
const inZone = (y, gr) => (y > gr && y <= 3) || (y >= 6 && y <= 9);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, M.found);

  // Nothing is built above the roof line; cells this high get foundation only.
  if (gr >= ROOF) continue;

  const o = outs(x, z);

  if (o.length === 0) {
    // Interior: floor slabs only, air between them (no interiors).
    g.set(x, gr, z, M.floor);
    if (5 > gr) g.set(x, 5, z, M.floor);
    g.set(x, ROOF - 1, z, M.roof);
    continue;
  }

  const corner = o.length >= 2;
  const d = o[0];
  const u = d.axis === "x" ? x : z;
  const pier = corner || u % 3 === 0;
  const isEnt = ent && ent.x === x && ent.z === z && o.some((f) => f.n === ent.n);

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      g.set(x, y, z, M.base);
    } else if (isEnt && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: ent.n,
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (y === ROOF) {
      if (corner) g.set(x, y, z, M.trim);
      else g.set(x, y, z, M.cap, { type: "bottom", waterlogged: "false" });
    } else if (y === 10 || y === 5 || y === 4) {
      g.set(x, y, z, M.trim);
    } else if (corner) {
      g.set(x, y, z, M.trim);
    } else if (inZone(y, gr)) {
      g.set(x, y, z, pier ? M.trim : M.glass);
    } else {
      g.set(x, y, z, M.wall);
    }
  }

  // Warm lights standing just inside the glazing (only where the cell behind is interior).
  if (!corner && !pier && !isEnt) {
    const ix = x - d.dx, iz = z - d.dz;
    if (inside(ix, iz) && !isPerim(ix, iz)) {
      const igr = GR.get(`${ix},${iz}`);
      if (u % 6 === 1 && igr < 7) g.set(ix, 7, iz, "glowstone");
      if (u % 6 === 4 && gr + 1 <= 3 && igr < gr + 1) {
        g.set(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// Roof plant room: a low block with AC units, set back from the parapet.
for (let x = 8; x <= 12; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!inside(x, z) || isPerim(x, z)) continue;
    const gr = GR.get(`${x},${z}`);
    if (gr > ROOF - 2) continue;
    g.set(x, 11, z, M.roof);
    g.set(x, 12, z, M.roof);
    if ((x + z) % 2 === 0) g.set(x, 13, z, M.ac);
  }
}

g.save(`${DIR}/${ID}.nbt`);

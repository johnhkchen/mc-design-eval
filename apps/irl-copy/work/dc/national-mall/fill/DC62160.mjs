import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC62160";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 44, D = 29, H = 31;
const g = new Voxels([W, H, D]);

// Footprint map: key -> { g: ground, r: roof top (blocks occupy y < r) }
const key = (x, z) => x + "," + z;
const S = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gg = Math.round(gr);
  const rr = Math.min(Math.max(Math.round(rf), gg + 3), H - 2);
  S.set(key(x, z), { g: gg, r: rr });
}
const has = (x, z) => S.has(key(x, z));

// Outward faces: dx,dz point outward (neighbour direction)
const FACES = [
  { n: "N", dx: 0, dz: -1 },
  { n: "S", dx: 0, dz: 1 },
  { n: "W", dx: -1, dz: 0 },
  { n: "E", dx: 1, dz: 0 },
];

// Facade classification per edge cell. Pillars (corners and every third bay)
// are stone pilasters; the remaining bays are glazed.
const facade = new Map();
for (const [k] of S) {
  const [x, z] = k.split(",").map(Number);
  const missing = FACES.filter(f => !has(x + f.dx, z + f.dz));
  if (!missing.length) { facade.set(k, null); continue; }
  const winFaces = [];
  let pillarAny = false;
  for (const f of missing) {
    const along = f.dx === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    const corner = along.some(([ax, az]) => !has(x + ax, z + az));
    const i = f.dx === 0 ? x : z;
    const pillar = corner || (i % 3 === 0);
    if (pillar) pillarAny = true; else winFaces.push(f);
  }
  facade.set(k, { missing, winFaces, pillarAny });
}

// Entrance: on a north-facing edge (missing z-1), nearest the centroid of that run
const northCells = [];
for (const [k] of S) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1)) northCells.push([x, z]);
}
let door = null;
if (northCells.length) {
  const mx = northCells.reduce((a, c) => a + c[0], 0) / northCells.length;
  northCells.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx));
  door = northCells[0];
}

// Tallest roof level, used for the mechanical penthouse
let rMax = 0;
for (const [, v] of S) rMax = Math.max(rMax, v.r);

// ---- Foundations and body ----
for (const [k, { g: gg, r: rr }] of S) {
  const [x, z] = k.split(",").map(Number);
  const fac = facade.get(k);
  const isEdge = !!fac;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone_bricks");

  const isDoorCell = door && door[0] === x && door[1] === z;

  for (let y = gg; y < rr; y++) {
    const rel = (y - gg) % 3;

    if (isDoorCell && (y === gg + 1 || y === gg + 2)) continue; // set below

    if (!isEdge) {
      // hollow interior: floor slab each storey and closed roof
      if (rel === 0 || y === rr - 1) g.set(x, y, z, "stone");
      continue;
    }

    if (y === rr - 1) {
      // parapet cap
      g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else if (rel === 0) {
      // storey string course
      g.set(x, y, z, "calcite");
    } else if (fac.winFaces.length && !fac.pillarAny) {
      const f = fac.winFaces[0];
      const ew = f.dz !== 0; // window on N/S face connects east-west
      g.set(x, y, z, "glass_pane", {
        north: ew ? "false" : "true",
        south: ew ? "false" : "true",
        east: ew ? "true" : "false",
        west: ew ? "true" : "false",
        waterlogged: "false",
      });
      // warm light behind some windows (in the air gap, inside the footprint)
      if (rel === 1 && (x + z) % 4 === 0) {
        const ix = x - f.dx, iz = z - f.dz;
        if (has(ix, iz)) {
          const id = (x * 3 + z) % 8 === 0 ? "shroomlight" : "glowstone";
          g.set(ix, y, iz, id);
        }
      }
    } else if (fac.pillarAny && !fac.winFaces.length) {
      // pilaster / corner quoin in cut stone
      g.set(x, y, z, "stone_bricks");
    } else if (fac.pillarAny) {
      // pilaster at a bay line, next to a window bay: stone for spandrel reads, brick elsewhere
      g.set(x, y, z, rel === 2 ? "stone_bricks" : "bricks");
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// ---- Entrance: stone surround, calcite lintel, two-high door ----
if (door) {
  const [x, z] = door;
  const gg = S.get(key(x, z)).g;
  const rrDoor = S.get(key(x, z)).r;
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  // jambs and lintel across door bay and its neighbours (stay on footprint)
  for (const dx of [-1, 0, 1]) {
    if (!has(x + dx, z)) continue;
    if (dx !== 0) {
      g.set(x + dx, gg + 1, z, "stone_bricks");
      g.set(x + dx, gg + 2, z, "stone_bricks");
    }
    if (gg + 3 < rrDoor) g.set(x + dx, gg + 3, z, "calcite");
  }
  g.set(x, gg + 1, z, "oak_door", { ...base, half: "lower" });
  g.set(x, gg + 2, z, "oak_door", { ...base, half: "upper" });
  // lit lantern on the entrance bay's jamb wall, mounted on the lintel line
  if (has(x, z + 1)) g.set(x, gg + 1, z + 1, "air");
}

// ---- Rooftop mechanical penthouse on the tallest interior roof ----
if (rMax + 3 <= H - 1) {
  const tops = [];
  for (const [k, v] of S) {
    const [x, z] = k.split(",").map(Number);
    const isEdge = !!facade.get(k);
    if (!isEdge && v.r === rMax) tops.push([x, z]);
  }
  if (tops.length) {
    const xs = tops.map(c => c[0]), zs = tops.map(c => c[1]);
    const x0 = Math.min(...xs) + 2, x1 = Math.max(...xs) - 2;
    const z0 = Math.min(...zs) + 2, z1 = Math.max(...zs) - 2;
    if (x1 - x0 >= 2 && z1 - z0 >= 2) {
      for (let x = x0; x <= x1; x++) {
        for (let z = z0; z <= z1; z++) {
          if (!has(x, z)) continue;
          const onRim = x === x0 || x === x1 || z === z0 || z === z1;
          for (let y = rMax; y < rMax + 3; y++) {
            if (y === rMax + 2) g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
            else if (onRim) g.set(x, y, z, "stone_bricks");
            else if (y === rMax + 1 && (x + z) % 3 === 0) g.set(x, y, z, "glass_pane", {
              north: "true", south: "true", east: "true", west: "true", waterlogged: "false",
            });
            else g.set(x, y, z, "stone_bricks");
          }
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

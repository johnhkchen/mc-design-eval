// Mt Eden / Eden Terrace: a two-storey brick commercial block (1920s-30s) on a basalt base. Shopfront ground floor under a
// dark awning, cream pilasters, string courses and cornice, a parapet, and a plant room on the roof. Lidar's roof steps
// (8-11 above ground) are kept as tiers; the lower wings get one storey less. Shell cells (a face onto air or onto a lower
// roof) carry the facade; the rest is air with a floor slab per storey, so nothing floats on the foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020964.cells.json", "utf8"));

const FOUND = "stone_bricks", BRICK = "bricks", CREAM = "smooth_sandstone", FLOOR = "smooth_stone", ROOF = "stone";
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const cell = (x, z) => at.get(`${x},${z}`);
// outward faces: a neighbour that is missing or lower is a wall (a riser on a tier is a wall too)
const faces = (x, z) => Object.keys(DIRS).filter(f => { const [dx, dz] = DIRS[f]; const n = cell(x + dx, z + dz); return !n || n.r < cell(x, z).r; });
const along = (f, x, z) => (f === "north" || f === "south" ? x : z);
const shell = (x, z) => faces(x, z).length > 0;
const pane = (f) => (f === "north" || f === "south" ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const v = new Voxels([30, 24, 25]);

// The entrance: the face with the most wall, at a window bay's middle, nearest the middle of that face's run.
const counts = Object.fromEntries(Object.keys(DIRS).map(f => [f, cells.filter(([x, z]) => faces(x, z).includes(f)).length]));
const F = Object.keys(DIRS).reduce((a, b) => (counts[b] > counts[a] ? b : a));
const onF = cells.filter(([x, z]) => faces(x, z).includes(F)).sort((a, b) => along(F, a[0], a[1]) - along(F, b[0], b[1]));
const bays = onF.filter(([x, z]) => faces(x, z).length === 1 && along(F, x, z) % 4 === 2);
const [dx0, dz0] = (bays.length ? bays : onF)[Math.floor((bays.length ? bays : onF).length / 2)];
const doorAlong = along(F, dx0, dz0);

for (const [x, z, g, r] of cells) {
  const fs = faces(x, z), sh = fs.length > 0, prim = fs[0];
  const pier = sh && along(prim, x, z) % 4 === 0;   // every fourth bay of the primary face is a brick pier between the windows
  const outside = fs.some(f => !cell(x + DIRS[f][0], z + DIRS[f][1]));   // a real exterior edge, not a tier riser
  const glassFace = sh && !pier ? pane(prim) : null;
  // foundation (ground under the cell), then the base course or floor at its ground
  for (let y = 0; y < g; y++) v.set(x, y, z, FOUND);
  v.set(x, g, z, sh ? FOUND : FLOOR);

  if (sh) {
    const door = x === dx0 && z === dz0;
    const canopy = fs.includes(F) && Math.abs(along(F, x, z) - doorAlong) <= 1;
    // shopfront: door in the entry bay, glass between brick piers, a dark awning over the entry bay
    if (door) {
      const ds = (half) => ({ facing: F, half, hinge: "left", open: "false", powered: "false" });
      v.set(x, g + 1, z, "oak_door", ds("lower"));
      v.set(x, g + 2, z, "oak_door", ds("upper"));
    } else {
      for (const y of [g + 1, g + 2, g + 3]) {
        if (pier) v.set(x, y, z, BRICK);
        else v.set(x, y, z, "glass_pane", pane(prim));
      }
    }
    if (canopy) v.set(x, g + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    // storey line, then the upper storey: cream sill course, windows between brick piers, cornice over
    v.set(x, g + 4, z, CREAM);
    v.set(x, g + 5, z, CREAM);
    for (let y = g + 6; y <= r - 3; y++) {
      if (pier) v.set(x, y, z, BRICK);
      else v.set(x, y, z, "glass_pane", pane(prim));
    }
    v.set(x, r - 2, z, CREAM);
    // parapet on the exterior edge: alternating full and half cream blocks (dentils), the half one bottom-set on the cornice
    if (outside) {
      if (along(prim, x, z) % 2 === 0) v.set(x, r - 1, z, CREAM);
      else v.set(x, r - 1, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
    }
  } else {
    // interior: a floor slab per storey, air between, roof deck over all
    v.set(x, g + 4, z, FLOOR);
    v.set(x, r - 2, z, ROOF);
  }
}

// Warm light behind some windows: glowstone in the ground shopfront, shroomlight up top, on the inside cell behind the glass.
for (const [x, z, g, r] of cells) {
  const fs = faces(x, z); if (!fs.length || along(fs[0], x, z) % 4 === 0) continue;
  const [dx, dz] = DIRS[fs[0]], ix = x - dx, iz = z - dz;
  if (!cell(ix, iz) || shell(ix, iz)) continue;
  for (let y = g + 1; y <= r - 3; y++) {
    if (y === g + 4 || y === g + 5 || (x * 3 + z * 5 + y) % 5 !== 0) continue;
    v.set(ix, y, iz, y <= g + 3 ? "glowstone" : "shroomlight");
  }
}

// Plant room on the top tier, centred on the interior of the tallest roof.
const top = Math.max(...cells.map(([, , , r]) => r));
const roofTop = cells.filter(([x, z, , r]) => r === top && !shell(x, z));
const cx = Math.round(roofTop.reduce((s, c) => s + c[0], 0) / roofTop.length), cz = Math.round(roofTop.reduce((s, c) => s + c[1], 0) / roofTop.length);
for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) {
  const c = cell(x, z); if (!c || c.r !== top || shell(x, z)) continue;
  v.set(x, top - 1, z, "stone_bricks");
  v.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020964.nbt");
console.log(JSON.stringify({ footprint: cells.length, entry: { face: F, cell: [dx0, dz0] }, ...out }));

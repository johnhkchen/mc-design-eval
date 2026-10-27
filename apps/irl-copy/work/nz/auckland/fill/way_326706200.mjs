// Way 326706200: a 1920s-30s reinforced-brick commercial block, Auckland (stripped-Classical with early Deco).
// Brick walls, cream plaster piers and string courses, a black glazed fascia over granite shopfronts, timber-and-glass
// entrances, a stepped parapet. Massing follows the lidar roof: each cell's roof is smoothed (mean over a 5x5 of the
// footprint), taken down to whole 4-block storeys with a 1-3 block parapet, so the tiers are flat and step with the
// wings. Every column is solid from y 0 up to its top: the foundation, then the shell, so nothing floats. The inside is
// air between slabs (one slab per storey), with glass set in the outer wall over an air gap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326706200.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326706200.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell
const X = 35, H = 28, Z = 100;
const g = new Voxels([X, H, Z]);

const key = (x, z) => x + "," + z;
const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(key(x, z), { x, z, ground, roof });
const inside = (x, z) => C.has(key(x, z));
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// The lidar roof, averaged over the footprint within 2 cells: flat tiers, not facets.
function smoothRoof(x, z) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const c = C.get(key(x + dx, z + dz)); if (c) { s += c.roof; n++; }
  }
  return Math.round(s / n);
}

// Per cell: the top of the storeys (T, a multiple of 4), the ground-floor band top (L1), the parapet (p), and the
// exterior faces. A cell is on the shell if one of its four neighbours is outside the footprint.
for (const c of C.values()) {
  const R = smoothRoof(c.x, c.z);
  const n = Math.floor(R / 4);
  c.p = Math.min(3, Math.max(1, R - 4 * n));
  c.T = Math.max(4 * n, 4 * Math.ceil((c.ground + 4) / 4));          // at least one storey clear of the ground
  c.L1 = Math.min(c.T, 4 * Math.ceil((c.ground + 5) / 4));          // the ground-floor band (shopfronts) tops here
  c.faces = DIRS.filter(([dx, dz]) => !inside(c.x + dx, c.z + dz));
  c.ring = c.faces.length > 0;
  if (c.ring) { const [dx, dz, name] = c.faces[0]; c.dx = dx; c.dz = dz; c.face = name; c.along = dx !== 0 ? c.z : c.x; }
}

const isSlab = (y, c) => y >= c.L1 - 1 && y % 4 === 3 && y <= c.T - 1;   // a floor slab (ceiling of the storey below)
const glass = [];                                                          // window and shopfront panes, for the lamps

for (const c of C.values()) {
  const { x, z, ground: gr, T, L1, p } = c;
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");            // foundation, up to the ground
  if (!c.ring) {
    // Interior: air between slabs; the roof slab closes the top.
    for (let y = gr + 1; y <= T - 1; y++) if (isSlab(y, c)) g.set(x, y, z, y === T - 1 ? "stone" : "smooth_quartz");
    continue;
  }
  // The shell: brick walls with cream piers and string courses. Piers sit every third cell along a face.
  const pier = c.along % 3 === 0;
  const door = c.along % 13 === 6 && c.face !== undefined;                 // one entrance per run of about 13 cells
  for (let y = gr + 1; y <= T + p - 1; y++) {
    if (y === gr + 1) { if (door) continue; g.set(x, y, z, "polished_granite"); continue; }      // plinth
    if (y >= T) { g.set(x, y, z, y === T + p - 1 ? "smooth_quartz" : "bricks"); continue; }        // parapet, capped
    if (isSlab(y, c)) { g.set(x, y, z, y === L1 - 1 ? "black_glazed_terracotta" : "smooth_quartz"); continue; }
    if (y < L1 - 1) {                                                       // shopfront
      if (door && (y === gr + 2)) continue;                                 // door's upper half, set below
      if (pier) g.set(x, y, z, "polished_granite");
      else { g.set(x, y, z, "glass_pane"); glass.push({ x, y, z, c, kind: "shop" }); }
      continue;
    }
    // upper storeys: glass in the 3 air rows of each storey, cream piers between
    if (pier) g.set(x, y, z, "smooth_quartz");
    else { g.set(x, y, z, "glass_pane"); glass.push({ x, y, z, c, kind: "win" }); }
  }
  if (door) {
    const facing = c.face;
    g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    glass.push({ x, y: gr + 3, z, c, kind: "transom" });
  }
}

// Roof plant: a few boxes on the highest interior roofs, standing on the roof slab.
for (const c of C.values()) {
  if (c.ring || c.T < 12 || c.x % 8 !== 3 || c.z % 8 !== 3) continue;
  for (let y = c.T; y <= c.T + 1; y++) g.set(c.x, y, c.z, "light_gray_concrete");
}

// Warm lights behind the glass, on the inside cell: lanterns on the storey floor, glowstone mid-storey, shopfront glow.
for (const s of glass) {
  const inX = s.x - s.c.dx, inZ = s.z - s.c.dz;
  if (!inside(inX, inZ) || C.get(key(inX, inZ)).ring) continue;
  const h = (s.x * 31 + s.z * 17 + s.y * 7) % 12;
  if (s.kind === "win" && s.y % 4 === 0 && h % 3 === 0) g.set(inX, s.y, inZ, "lantern", { hanging: "false", waterlogged: "false" });
  else if (s.kind === "win" && s.y % 4 === 1 && h % 4 === 0) g.set(inX, s.y, inZ, "glowstone");
  else if (s.kind === "shop" && s.y === s.c.ground + 3 && h % 2 === 0) g.set(inX, s.y, inZ, "glowstone");
}

const info = g.save(OUT);
console.log(`saved ${OUT}: ${info.blocks} blocks, palette ${info.palette}`);

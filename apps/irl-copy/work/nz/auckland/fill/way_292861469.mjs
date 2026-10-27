// Dingwall Building, Queen Street fringe, Auckland CBD. Read from the lidar record: a 1930s reinforced-concrete commercial
// block, rendered in cream plaster with dark stone at the base and steel-framed glazing, eight storeys over a shop front,
// a penthouse core, and stepped wings down to the edges. Storey lines sit on one datum (y 5, the uphill ground), so the
// downhill side (ground y 0) shows its extra rusticated storey. The lidar roofs are smoothed into flat tiers, and every
// column stands solid from y 0 to its top, so nothing floats. Interiors are only the air gap behind the glass, with a floor
// slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861469.cells.json", "utf8"));

const X = 50, Y = 53, Z = 30;
const D = 5;                   // the storey datum: the ground floor's slab, at the uphill ground
const BAY = 3;                 // one pier per three blocks along a face
const FACING = { n: "north", s: "south", w: "west", e: "east" };
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };

const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const has = (x, z) => fp.has(`${x},${z}`);
const ground = (x, z) => fp.get(`${x},${z}`).g;

// Lidar roofs smoothed into flat tiers: the body at 39, a penthouse core at 40, wings at 35, 29, 21, and the low annex at 13.
function tierOf(r) {
  if (r >= 40) return 40;
  if (r >= 37) return 39;
  if (r >= 33) return 35;
  if (r >= 27) return 29;
  if (r >= 19) return 21;
  return 13;
}

const outward = (x, z) => Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));
const boundary = new Set();
for (const [x, z] of cells.map(c => [c[0], c[1]])) if (outward(x, z).length) boundary.add(`${x},${z}`);
const isBoundary = (x, z) => boundary.has(`${x},${z}`);

// The entrance: a north-facing street cell that stands as high as possible above the lowest ground (less of a step), then nearest x 9.
let entrance = null;
for (const [x, z, g, r] of cells) {
  const out = outward(x, z);
  if (out.length !== 1 || out[0] !== "n" || tierOf(r) < 35) continue;
  if (!entrance || g > entrance.g || (g === entrance.g && Math.abs(x - 9) < Math.abs(entrance.x - 9))) entrance = { x, z, g };
}

const v = new Voxels([X, Y, Z]);
const set = (x, y, z, b, s) => v.set(x, y, z, b, s);
const DOOR = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

// Floor slabs: every storey starts with a slab at D + 4k, and the slab stays under the roof at top-1.
const isFloor = (y) => y >= D && (y - D) % 4 === 0;

for (const [x, z, g, r] of cells) {
  const top = tierOf(r);
  const out = outward(x, z);
  const edge = out.length > 0;
  const face = out[0];
  const u = face === "n" || face === "s" ? x : z;   // position along the face, for the bay rhythm
  const pier = u % BAY === 0;
  // The lit window's interior cell: inward from the face, one step (glowstone behind the glass on some windows).
  const inward = edge ? [x - DIRS[face][0], z - DIRS[face][1]] : null;

  for (let y = 0; y < top; y++) {
    let b = null, s = null;
    if (y < g) b = "stone_bricks";                                   // foundation up to the lowest-to-highest ground
    else if (!edge) {                                                // interior: solid base, floor slabs, roof; air between
      if (y < D) b = "stone_bricks";
      else if (isFloor(y) || y === top - 1) b = "smooth_quartz";
    } else if (y < D) {                                              // downhill basement: rusticated stone with piers
      b = pier && y > g ? "chiseled_stone_bricks" : "stone_bricks";
    } else if (y >= top - 2) {                                       // cornice and parapet
      b = y === top - 2 ? "polished_andesite" : "smooth_quartz";
    } else {
      const F = D + 4 * Math.floor((y - D) / 4), off = (y - D) % 4;  // storey floor line and the row within the storey
      const groundFloor = F === D;
      if (off === 0) b = "polished_andesite";                        // storey string course
      else if (off === 3) b = groundFloor ? "polished_andesite" : "smooth_quartz";  // spandrel, or the shop fascia
      else {                                                         // windows: glass with piers between bays
        const winOk = F + 2 < top - 2 && y > g;
        if (!winOk) b = pier ? "quartz_pillar" : "smooth_quartz";
        else if (pier) b = "quartz_pillar";
        else {
          b = "light_blue_stained_glass";
          // Warm light behind some upper windows: a glowstone in the air gap, one step in, on the lower row
          if (off === 1 && !groundFloor && (u + F) % 4 === 1 && inward && has(...inward) && !isBoundary(...inward)) {
            set(inward[0], y, inward[1], "glowstone");
          }
        }
      }
    }
    if (entrance && x === entrance.x && z === entrance.z && y >= D && y <= D + 1) {
      b = "dark_oak_door"; s = DOOR(FACING.n, y === D ? "lower" : "upper");
    } else if (entrance && x === entrance.x && z === entrance.z && y === D + 2) {
      b = "polished_andesite";                                        // the lintel over the door
    }
    if (b) set(x, y, z, b, s);
  }
}

// A lantern on the floor just inside the entrance, lighting the porch.
if (entrance) {
  const ix = entrance.x, iz = entrance.z + 1;
  if (has(ix, iz) && !isBoundary(ix, iz)) set(ix, D + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant on the body: three small boxes on the flat roof, two blocks high, kept off the edges.
const plant = [[9, 7, 12, 9], [30, 17, 33, 20], [36, 11, 38, 13]];
for (const [x0, z0, x1, z1] of plant) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z) || isBoundary(x, z) || tierOf(fp.get(`${x},${z}`).r) !== 39) continue;
    set(x, 39, z, "stone_bricks"); set(x, 40, z, "stone_bricks");
  }
}

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861469.nbt");
console.log(`way_292861469: ${v.count()} blocks, entrance at (${entrance?.x},${entrance?.z}), ${cells.length} footprint cells`);

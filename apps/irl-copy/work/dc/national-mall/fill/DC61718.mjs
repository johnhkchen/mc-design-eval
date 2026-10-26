import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC61718: a 1930s Federal-Triangle-style Beaux-Arts office block. Limestone walls on a granite base, a
// two-storey piano nobile band with tall glazed bays, a plain frieze and parapet, and a central pavilion
// (the lidar's 11-block core) rising off the off-centre block. The north (front) face has the entrance.
// Massing from the lidar, snapped to three clean tiers: core 11, main body 10, lower wings 9.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61718.cells.json`, "utf8"));

const W = 13, D = 11, H = 11;
const g = new Voxels([W, H, D]);

const FLOOR = ["smooth_stone"];
const GRANITE = ["stone_bricks"];              // the base course; reads as grey stone, not brick
const LIMESTONE = ["calcite"];
const SILL = ["smooth_stone"];
const ROOF = ["stone"];
const PANE = "light_blue_stained_glass_pane";
const LANTERN = ["lantern", { hanging: "true", waterlogged: "false" }];

const key = (x, z) => `${x},${z}`;
const has = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const exposed = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });

// Tiers from the lidar: the core (lidar 11) is the pavilion; the wings (lidar 9) are the south and east
// parts; everything else is the main body (lidar 10).
const core = (x, z) => x >= 2 && x <= 4 && z >= 2 && z <= 4;
const wing = (x, z) => z >= 5 || (x >= 5 && z >= 2);
const tierTop = (x, z) => (core(x, z) ? 11 : wing(x, z) ? 9 : 10);

const DOOR = [6, 0];   // north face, centred on the 13-wide front; a pier column so the door sits in the framing

// What block (name, state) a cell holds at height y, or null for air.
function cellBlock(x, z, y) {
  const h = tierTop(x, z);
  if (y >= h) return null;
  const e = exposed(x, z);
  const faces = [e.n, e.s, e.w, e.e].filter(Boolean).length;
  const ring = faces > 0;
  const corner = faces >= 2;
  const top = y === h - 1;

  // pavilion: the 3x3 core above y 8 (its floor is the body's FLOOR at y 8)
  if (core(x, z) && y >= 9) {
    const edge = x === 2 || x === 4 || z === 2 || z === 4;
    if (y === 10) return edge ? LIMESTONE : ROOF;
    if (!edge) return null;                       // the pavilion's room; the lantern goes in below
    const side = (x === 3) !== (z === 3);         // middle of a side, not a corner
    if (!side) return LIMESTONE;
    const ew = z === 2 || z === 4;                // a north/south side: pane runs east-west
    return [PANE, ew ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
                     : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
  }

  if (y === 0) return ring ? GRANITE : FLOOR;     // plinth and ground floor slab
  if (y === 4) return FLOOR;                      // belt course and the second-floor slab
  if (top) return ring ? LIMESTONE : ROOF;        // frieze / parapet over the roof deck
  if (y === 8) return FLOOR;                      // attic floor slab under the body's roof
  if (!ring) return null;                         // interior air

  // the facade: piers on odd/even columns, panes between; corners stay solid
  const alongX = e.n || e.s;
  const idx = alongX ? x : z;
  const pane = !corner && idx % 2 === 1;
  const paneState = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  if (y === 1) {
    if (e.n && x === DOOR[0] && z === DOOR[1]) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    return GRANITE;                               // base course
  }
  if (y === 2 && e.n && x === DOOR[0] && z === DOOR[1]) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
  if (y === 3 && e.n && x === DOOR[0] && z === DOOR[1]) return LANTERN;   // lamp over the door, hung from the belt
  if (y === 5) return pane ? SILL : LIMESTONE;   // sill band under the second-storey glazing
  return pane ? [PANE, paneState] : LIMESTONE;   // y 2, 3, 6, 7: glazing between limestone piers
}

for (const [x, z] of cells) {
  for (let y = 0; y < H; y++) {
    const b = cellBlock(x, z, y);
    if (!b) continue;
    g.set(x, y, z, b[0], b[1]);
  }
}

// Warm light behind some glazed bays: a lantern hung from the floor above, in the room behind the pane.
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
for (const [x, z] of cells) {
  const e = exposed(x, z);
  const faces = [e.n, e.s, e.w, e.e].filter(Boolean).length;
  if (faces !== 1) continue;
  const side = e.n ? "n" : e.s ? "s" : e.w ? "w" : "e";
  const idx = side === "n" || side === "s" ? x : z;
  const [dx, dz] = INWARD[side];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  const ie = exposed(ix, iz);
  if (ie.n || ie.s || ie.w || ie.e) continue;   // room behind must be interior
  if (idx % 3 === 1 && !(x === DOOR[0] && z === DOOR[1])) g.set(ix, 3, iz, LANTERN[0], LANTERN[1]);
  if (idx % 3 === 2) g.set(ix, 7, iz, LANTERN[0], LANTERN[1]);
}

// Pavilion room lamp, hung from the pavilion roof.
g.set(3, 9, 3, LANTERN[0], LANTERN[1]);

// Roof plant: a 2x2 air-handling box on the south-east wing.
for (const [x, z] of [[8, 3], [9, 3], [8, 4], [9, 4]]) g.set(x, 9, z, "iron_block");

const info = g.save(`${DIR}/DC61718.nbt`);
console.log(JSON.stringify(info));

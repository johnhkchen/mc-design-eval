// 28 West 47th Street, 1920 mixed residential and commercial building: a six-storey brick loft-apartment block with a
// limestone base course, belts and cornice, on a 6 x 24 midblock lot (about 6.7 m front on 47th Street, low z = north =
// the street frontage). Ground floor: granite base, a dark-wood shopfront with glass bays and an entrance door under a
// dark fascia canopy (x 2). Upper floors: four storeys of sash windows in white-painted frames, two glass panes wide
// per bay between brick piers. Side walls are blank party walls. A rear wing (lidar 6-7) and a 10- and 13-block step
// sit at the back; a lightwell (lidar 1) is paved at y 0 and walled by the body. Lidar roof is read as flat tiers
// (14-17 -> 17, 8-11 -> 10, 12-13 -> 13, 3-8 -> 7, 1-2 -> paving), not followed cell by cell. Massing is solid except
// one block of air behind each street and rear pane, with a floor slab per storey (no interiors). Warm glowstone sits
// behind some panes, and a roof tank stands on an iron platform.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034343.cells.json`, "utf8"));
const X = 6, Z = 24, Y = 29;

// Tops (block rows built, 0..T-1) per footprint cell, from the lidar roof.
const tops = new Array(X * Z).fill(0);
for (const [x, z, , R] of cells) {
  tops[z * X + x] = R <= 2 ? 1 : R <= 8 ? 7 : R <= 11 ? 10 : R <= 13 ? 13 : 17;
}
const T = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : tops[z * X + x]);
const solid = (x, y, z) => y >= 0 && y < T(x, z);

// Storey datums: y 0 is the foundation / plinth, storey lines at y 4, 7, 10, 13 (belts), windows on the rows between,
// the cornice on the top row. Every other row is shopfront (street, y 2-3) or window or brick.
const isBelt = (y) => y >= 4 && y % 3 === 1;
const isWin = (y) => y >= 2 && y % 3 !== 1;

const D = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const RANK = { street: 4, rear: 3, court: 2, party: 1 };
function roleOf(x, z, d) {
  if (d === "north" && z === 0) return "street";
  if (d === "south" && z === Z - 1) return "rear";
  if ((d === "west" || d === "east") && T(x + D[d][0], z + D[d][1]) === 0) return "party";
  return "court";
}

const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// Block (and state) for one solid cell on an exposed face (or the core where role is null).
function pick(x, y, z, t, role, d) {
  const top = t - 1;
  if (t === 1) return ["smooth_stone"];                       // lightwell paving
  if (y === 0) return ["polished_granite"];                   // foundation
  if (y === top) return role ? ["calcite"] : ["black_concrete"]; // cornice and parapet; roof membrane inside
  if (!role) return ["bricks"];
  if (y === 1) return ["polished_granite"];                   // base course
  if (isBelt(y)) return role === "street" && y === 4 && x > 0 && x < X - 1 ? ["black_concrete"] : ["calcite"];
  if (role === "party" || !isWin(y)) return ["bricks"];
  if (role === "street" && y <= 3) {                          // shopfront: piers, glass bays, entrance at x 2
    if (x === 0 || x === X - 1) return ["dark_oak_planks"];
    if (x === 2) return ["dark_oak_door", DOOR(y === 2 ? "lower" : "upper")];
    return ["glass"];
  }
  if (role === "court") return (d === "north" || d === "south" ? x : z) % 3 === 0 ? ["bricks"] : ["glass"];  // two-pane bays between brick piers
  if (x === 0 || x === X - 1) return ["bricks"];
  return x === 1 || x === X - 2 ? ["white_concrete"] : ["glass"];
}

const g = new Voxels([X, Y, Z]);
const glass = [];                                             // street and rear panes, to carve their air gaps
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = T(x, z); if (!t) continue;
  for (let y = 0; y < t; y++) {
    const exposed = Object.entries(D).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz));
    let role = null, face = null;
    for (const [d] of exposed) {
      const r = roleOf(x, z, d);
      if (!role || RANK[r] > RANK[role]) { role = r; face = d; }
    }
    const [block, state] = pick(x, y, z, t, role, face);
    g.set(x, y, z, block, state);
    if (block === "glass" && (role === "street" || role === "rear")) glass.push({ x, y, z, dz: role === "street" ? 1 : -1 });
  }
}

// Air one block behind each pane (a room), a glowstone in some of them (warm light), and the air kept to the floor
// slab below and above it.
for (const { x, y, z, dz } of glass) {
  if (!solid(x, y, z + dz)) continue;
  g.set(x, y, z + dz, "air");
  if ((x * 3 + y) % 5 === 0) g.set(x, y, z + dz, "glowstone");
}

// Roof tank on an iron platform over the front of the main roof (2 x 3 blocks, the top at y 21).
for (let z = 2; z <= 4; z++) for (let x = 2; x <= 3; x++) {
  g.set(x, 17, z, "iron_bars");
  for (let y = 18; y <= 20; y++) g.set(x, y, z, "oak_planks");
  g.set(x, 21, z, "spruce_slab", { type: "top", waterlogged: "false" });
}

const out = `${DIR}/NYC1034343.nbt`;
const { blocks, palette } = g.save(out);
console.log(`NYC1034343: ${blocks} blocks, ${palette} palette entries -> ${out}`);

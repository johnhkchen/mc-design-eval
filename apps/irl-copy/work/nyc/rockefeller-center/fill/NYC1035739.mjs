// 7 East 53 Street (1940, commercial & office): a Moderne street block, 3-block storeys, a limestone-coloured skin on a
// granite plinth, a shopfront ground storey, window bays with chiseled piers, a 4-storey east edge and a mechanical box.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035739.cells.json`, "utf8"));   // [x, z, ground, roof]

const FOUNDATION = "stone_bricks", FLOOR = "smooth_stone", PLINTH = "polished_andesite", WALL = "smooth_quartz";
const PIER = "chiseled_quartz_block", WINDOW = "light_blue_stained_glass", SHOP_GLASS = "glass";
const CORNICE = "polished_andesite", ROOF = "smooth_stone", LIGHT = "glowstone";
const STRING = ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }];
const CANOPY = ["dark_oak_slab", { type: "bottom", waterlogged: "false" }];

const info = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const bld = (x, z) => (info.get(`${x},${z}`)?.r ?? 0) > 1;      // lidar roof above 1: a building; 0 and 1 are open ground
const ring = (x, z) => !bld(x - 1, z) || !bld(x + 1, z) || !bld(x, z - 1) || !bld(x, z + 1);
const top = (r) => Math.max(3, Math.round(r / 3) * 3);          // roof snapped to whole 3-block storeys: 9 or 12

const v = new Voxels([6, 24, 27]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const lights = [];

for (const [x, z, g, r] of cells) {
  for (let y = 0; y < g; y++) put(x, y, z, FOUNDATION);
  if (!bld(x, z)) { put(x, g, z, FLOOR); continue; }              // open ground: a paved surface at its ground

  const R = top(r) - 1;                                           // roof layer; the cornice sits on it
  const exX = !bld(x - 1, z) || !bld(x + 1, z);
  const exZ = !bld(x, z - 1) || !bld(x, z + 1);
  const corner = exX && exZ;
  const u = exX ? z : x;                                          // position along the face it stands on

  if (!ring(x, z)) {                                              // interior: air gap, floor slab per storey, roof
    for (let y = g; y <= R; y++) {
      if (y === R) put(x, y, z, ROOF);
      else if (y === g || y % 3 === 0) put(x, y, z, FLOOR);
    }
    continue;
  }

  for (let y = g; y <= R; y++) {
    let block, state;
    if (y === R) block = CORNICE;
    else if (y === g) block = PLINTH;
    else if (y % 3 === 0) [block, state] = STRING;
    else {
      const pier = corner || u % 3 === 0;
      block = y < 3 ? (pier ? PLINTH : SHOP_GLASS) : (pier ? PIER : WINDOW);
      if (!pier && (y % 3 === 1 || y === g + 1)) {                // a glowstone behind the glass, standing on a floor
        const ix = exX ? (bld(x - 1, z) ? x - 1 : x + 1) : x;
        const iz = exX ? z : (bld(x, z - 1) ? z - 1 : z + 1);
        if (bld(ix, iz) && !ring(ix, iz) && (u + 2 * y) % 6 === 0) lights.push([ix, y, iz]);
      }
    }
    put(x, y, z, block, state);
  }
}

for (const [x, y, z] of lights) put(x, y, z, LIGHT);

// Mechanical penthouse on the roof of the middle of the west block
for (const [x, z] of [[1, 12], [2, 12], [1, 13], [2, 13]]) {
  put(x, 9, z, WALL);
  put(x, 10, z, PLINTH);
}

// Main entrance on the north face: iron doors, a dark canopy on two posts over the terrace, a hanging lantern
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
put(2, 2, 10, "iron_door", { ...door, half: "lower" });
put(2, 3, 10, "iron_door", { ...door, half: "upper" });
for (const y of [2, 3]) for (const x of [1, 3]) put(x, y, 8, PLINTH);
for (const z of [8, 9]) for (const x of [1, 2, 3]) put(x, 4, z, ...CANOPY);
put(2, 3, 8, "lantern", { hanging: "true", waterlogged: "false" });

const { blocks, palette } = v.save(`${dir}/NYC1035739.nbt`);
console.log(`NYC1035739.nbt: ${blocks} blocks, ${palette} palette entries, ${lights.length} lights`);

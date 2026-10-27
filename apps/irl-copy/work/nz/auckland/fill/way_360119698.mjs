// Way 360119698: a four-storey brick commercial block (c. 1920s Queen Street / Karangahape Road type) on a stone base,
// with a timber-framed glass shopfront and a door on the south (street) face, a flat parapeted roof at the lidar's 17
// blocks, and two lower wings on the south edge. Ring walls one cell thick, hollow inside with a floor slab per storey and
// an air gap behind every window; a few windows get a light set just inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_360119698.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_360119698.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..9

const SIZE = [10, 29, 10];
const g = new Voxels(SIZE);

// Materials: brick walls, polished andesite for the base, storey lines and cornice, stone-brick foundation and parapet,
// dark oak for the shopfront fascia, smooth stone for floors and the roof.
const FOUNDATION = "stone_bricks", WALL = "bricks", PARAPET = "stone_bricks";
const TRIM = "polished_andesite", FLOOR = "smooth_stone", FASCIA = "dark_oak_planks", SHOP = "glass";
const STOREY_LINES = [4, 8, 12];                           // sill-and-lintel courses between the four storeys
const LIGHTS = [[5, "glowstone"], [9, "shroomlight"], [13, "glowstone"]];   // lit window band (its lower row) and block

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };      // outward normal of each face
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFoot(x + DIRS[d][0], z + DIRS[d][1]));

// The main block's lidar roof is 16 or 17: one flat 17. The two low cells (roof 2 and 7) are wings, kept at their height.
const topOf = (roof) => (roof >= 14 ? 17 : roof);

// A glass pane runs along the wall it sits in: east-west on a north or south face, north-south on an east or west face.
const paneState = (face) => {
  const along = face === "N" || face === "S";
  return { north: String(!along), south: String(!along), east: String(along), west: String(along), waterlogged: "false" };
};

// What stands at x, y, z: [block, state?] or null for air. A cell is a ring (wall) if any side is off the footprint.
function spec(x, z, y, ground, T, out) {
  if (y < ground) return [FOUNDATION];
  if (out.length === 0) {                                  // interior: floor slabs, roof cap, air otherwise
    return y === ground || STOREY_LINES.includes(y) || y === T - 1 ? [FLOOR] : null;
  }
  const corner = out.length > 1, face = out[0];
  const along = face === "N" || face === "S" ? x : z;     // position along the wall, for the window rhythm
  if (y === T - 1) return [PARAPET];
  if (y === T - 2) return [TRIM];                          // cornice
  if (y === ground || STOREY_LINES.includes(y)) return [TRIM];
  if (corner) return [WALL];                               // the stepped outline makes many corners: keep them brick, no windows
  if (face === "S" && y > ground && y <= 3) {              // shopfront: door in the middle, glass between dark oak piers
    if (x === 6 && y <= ground + 2) {
      return ["dark_oak_door", { facing: "south", half: y === ground + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (y === 3) return [FASCIA];
    return [along % 2 ? SHOP : FASCIA];
  }
  const inWindowBand = (y > ground && y <= 2) || (y >= 5 && y <= 7) || (y >= 9 && y <= 11) || (y >= 13 && y <= 14);
  if (inWindowBand && along % 2) return ["glass_pane", paneState(face)];
  return [WALL];
}

for (const [x, z, ground] of cells) {
  const T = topOf(foot.get(`${x},${z}`).roof), out = exposed(x, z);
  for (let y = 0; y < T; y++) {
    const s = spec(x, z, y, ground, T, out);
    if (s) g.set(x, y, z, s[0], s[1]);
  }
}

// Warm lights just inside some windows, on the storey floor under each lit band.
for (const [x, z] of cells) {
  const out = exposed(x, z);
  if (out.length !== 1) continue;
  const face = out[0], along = face === "N" || face === "S" ? x : z;
  if (along % 4 !== 1) continue;
  const ix = x - DIRS[face][0], iz = z - DIRS[face][1];
  if (!inFoot(ix, iz) || exposed(ix, iz).length) continue;
  for (const [y, block] of LIGHTS) g.set(ix, y, iz, block);
}

// A lantern on the floor just inside the entrance.
{
  const { ground } = foot.get("6,8");
  g.set(6, ground + 1, 8, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: two air-handling units on the roof cap.
g.set(4, 17, 4, "light_gray_concrete");
g.set(7, 17, 5, "light_gray_concrete");

const { blocks, palette } = g.save(OUT);
console.log(`way_360119698: ${blocks} blocks, ${palette} palette entries`);

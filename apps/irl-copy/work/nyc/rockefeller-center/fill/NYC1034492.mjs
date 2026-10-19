// 28 West 48th Street (NYC1034492), 1915 mixed residential and commercial building.
// A narrow midtown lot: a three-storey street front on 48th Street (z 0..1), a five-storey red-brick body behind it
// (z 2..19) with a party wall on the east side that stands three blocks proud of the roof, a stepped wing and a
// one-and-a-half-storey rear wing with a roof garden. Limestone spandrels and cornice, granite plinth and piers,
// a storefront with a central door, a water tower and a chimney on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034492.cells.json`, "utf8"));
const FOOT = new Set(cells.map(([x, z]) => `${x},${z}`));

// Lidar roof heights read as flat tiers (blocks above y 0). Zero roof on the rear is an open yard.
const YARD = new Set(["0,20", "1,20", "1,21", "2,21", "3,21", "4,21"]);
function tier(x, z) {
  if (YARD.has(`${x},${z}`)) return 0;
  if (z <= 1) return 11;                              // street front: three storeys (lidar 9-11)
  if (z <= 19) return 16;                             // body: five storeys under a cornice (lidar 16-17)
  if (z === 20) return x >= 2 && x <= 4 ? 10 : 16;    // stepped wing; the east party wall runs on
  return 6;                                           // rear wing: one and a half storeys (lidar 4-7)
}
const H = (x, z) => (FOOT.has(`${x},${z}`) ? tier(x, z) : 0);
const fin = (x, z) => x === 5 && z >= 2 && z <= 20;                       // east party wall, 3 blocks proud
const S = (x, z) => H(x, z) + (fin(x, z) ? 3 : H(x, z) >= 10 ? 1 : 0);   // solid top, exclusive (parapet included)

// Outward faces: N is the street side (z 0, 48th Street), W and E are the side walls.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function faceOf(x, y, z) {
  for (const [f, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (H(nx, nz) === 0 || y >= S(nx, nz)) return f;
  }
  return null;
}

// Storey lines per cell height: spandrels (limestone sill bands) every 3 blocks, windows in the two rows above each.
function levels(h) {
  if (h === 6) return { spand: new Set([3]), win: new Set([1, 2, 4]) };
  const spand = new Set([4, 7, 10, 13].filter((s) => s < h - 1));
  const win = new Set([1, 2]);
  for (const s of spand) for (const w of [s + 1, s + 2]) if (w < h - 1) win.add(w);
  return { spand, win };
}

const BRICK = "bricks", TRIM = "calcite", GRANITE = "polished_granite", ROOF = "stone";
const PANE = { north: "true", south: "true", east: "true", west: "true" };
const LANTERN = { block: "lantern", state: { hanging: "true", waterlogged: "false" } };

// A shell voxel: the street front has a shopfront; the upper bays are a 6-wide rhythm of two windows.
function wall(x, y, z, f, h, s, lv) {
  if (y >= h) return { block: y === s - 1 ? TRIM : BRICK };          // parapet and its coping
  if (y === h - 1 || lv.spand.has(y)) return { block: TRIM };        // cornice and floor lines
  if (f === "N" && z === 0 && h >= 10 && y <= 3) {                   // street shopfront
    if (x === 0 || x === 5) return { block: GRANITE };
    if (x === 2) {
      if (y === 3) return LANTERN;                                    // lantern under the transom
      return { block: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    }
    return { block: "glass_pane", state: PANE, face: f };
  }
  if (lv.win.has(y)) {
    const bay = f === "N" || f === "S" ? x === 1 || x === 4 : z % 3 === 1;
    return bay ? { block: "glass_pane", state: PANE, face: f } : { block: BRICK };
  }
  return { block: BRICK };
}

// The air behind a window is the room: an interior cell, not roof, not floor, so a light there is seen through the glass.
function behind(x, y, z, f) {
  const [bx, bz] = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[f];
  return [bx, y, bz];
}
function isRoom(x, y, z) {
  const h = H(x, z);
  return h > 0 && y >= 1 && y < h - 1 && !levels(h).spand.has(y) && faceOf(x, y, z) === null;
}

const g = new Voxels([6, 31, 27]);
for (const [x, z] of cells) {
  const h = H(x, z), s = S(x, z), lv = h ? levels(h) : null;
  g.set(x, 0, z, h ? GRANITE : "stone_bricks");                       // plinth; the yards are paved
  if (!h) continue;
  for (let y = 1; y < s; y++) {
    const f = faceOf(x, y, z);
    if (f) {
      const w = wall(x, y, z, f, h, s, lv);
      g.set(x, y, z, w.block, w.state);
      if (w.face && (x * 7 + y * 3 + z * 5) % 9 === 0) {               // some windows are lit from inside
        const [bx, by, bz] = behind(x, y, z, w.face);
        if (isRoom(bx, by, bz)) g.set(bx, by, bz, "glowstone");
      } else if (w.face && (x * 7 + y * 3 + z * 5) % 9 === 4) {
        const [bx, by, bz] = behind(x, y, z, w.face);
        if (isRoom(bx, by, bz)) g.set(bx, by, bz, "shroomlight");
      }
    } else if (y === h - 1) {                                          // interior roof; the rear wing is a roof garden
      g.set(x, y, z, h === 6 && (x + z) % 3 ? "moss_block" : ROOF);
    } else if (lv.spand.has(y)) {                                      // floor slab
      g.set(x, y, z, "smooth_stone");
    }
  }
}

// Roof plant: a penthouse on the body, a chimney, and a wood water tower on brick legs.
for (let y = 16; y <= 17; y++) for (const x of [1, 2]) for (const z of [16, 17]) g.set(x, y, z, BRICK);
for (const x of [1, 2]) for (const z of [16, 17]) g.set(x, 18, z, TRIM);
for (let y = 16; y <= 18; y++) g.set(4, y, 10, BRICK);
g.set(4, 19, 10, TRIM);
for (const x of [3, 4]) for (const z of [6, 7]) {
  g.set(x, 16, z, BRICK); g.set(x, 17, z, BRICK);
  g.set(x, 18, z, "spruce_planks"); g.set(x, 19, z, "spruce_planks");
}

const counts = g.save(`${DIR}/NYC1034492.nbt`);
console.log(`NYC1034492.nbt: ${counts.blocks} blocks, ${counts.palette} palette entries`);

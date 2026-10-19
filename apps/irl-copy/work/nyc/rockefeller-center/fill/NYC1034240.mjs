// 1156 Avenue of the Americas, 1911: a ten-storey brick commercial block on a granite base, stone belt courses every
// storey, a stone cornice and parapet, recessed windows with iron mullions, a centre door on the avenue face, and one
// setback storey where the lidar reads above 32 blocks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034240.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const X = 33, Z = 17, Y = 40;
const g = new Voxels([X, Y, Z]);
const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;
const outer = (x, z) => x === 0 || z === 0 || x === X - 1 || z === Z - 1;
const corner = (x, z) => (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);

// Lidar roof per cell (no reading = 31), then a 3x3 median so the noise goes and the two tiers come out flat.
const raw = Array.from({ length: Z }, () => Array(X).fill(31));
for (const [x, z, , r] of cells) raw[z][x] = r > 0 ? r : 31;
const med = new Array(X * Z);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(raw[z + dz][x + dx]);
  v.sort((a, b) => a - b); med[z * X + x] = v[v.length >> 1];
}
const tower = (x, z) => med[z * X + x] >= 32;

// Facade rhythm: piers on a 4-block module along the streets (north and south faces), and along the avenue face
// (east, x = 32, with the entrance centred at z = 8) on the pattern below. Windows fill the runs between piers.
const isPier = (u, ns) => (ns ? u % 4 === 0 : [0, 4, 5, 11, 12, 16].includes(u));
const runOf = (u, ns) => { let lo = u, hi = u; while (!isPier(lo - 1, ns)) lo--; while (!isPier(hi + 1, ns)) hi++; return { lo, hi }; };

// 1. Base course, floor slabs every storey (y = 3, 6 ... 30), tower floor and roof deck.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  g.set(x, 0, z, outer(x, z) ? "polished_granite" : "stone_bricks");
  for (let k = 1; k <= 10; k++) g.set(x, 3 * k, z, "smooth_stone");
  if (tower(x, z)) { g.set(x, 31, z, "smooth_stone"); g.set(x, 32, z, "smooth_stone"); }
}

// 2. Setback storey: its inner edges (where it meets the main roof) are brick walls with a stone cap.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!tower(x, z) || outer(x, z)) continue;
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !tower(x + dx, z + dz));
  if (edge) { g.set(x, 31, z, "bricks"); g.set(x, 32, z, "smooth_stone"); }
}

// 3. Outer walls: the facade, storey by storey. Main body tops out at a parapet (y 31); the setback at its cornice (y 32).
const ENTRANCE = [X - 1, 8];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!outer(x, z)) continue;
  const ns = z === 0 || z === Z - 1;
  const dx = x === 0 ? 1 : x === X - 1 ? -1 : 0;           // inward, towards the building
  const dz = z === 0 ? 1 : z === Z - 1 ? -1 : 0;
  const u = ns ? x : z;
  const tall = tower(x, z), hgt = tall ? 33 : 32;
  const { lo, hi } = corner(x, z) ? { lo: u, hi: u } : runOf(u, ns);
  const mid = (lo + hi) >> 1;
  for (let y = 1; y < hgt; y++) {
    const k = Math.floor(y / 3), r = y % 3;
    if (corner(x, z)) { g.set(x, y, z, "smooth_stone"); continue; }     // quoins
    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }          // storey belt course
    if (!tall && y === 31) { g.set(x, y, z, "stone_brick_wall"); continue; }   // parapet
    if (tall && y === 32) { g.set(x, y, z, "smooth_stone"); continue; }        // setback cornice
    if (isPier(u, ns)) { g.set(x, y, z, k === 0 ? "polished_granite" : "bricks"); continue; }
    if (!ns && x === ENTRANCE[0] && z === ENTRANCE[1]) {                       // the centre door
      if (y === 1 || y === 2) {
        g.set(x, y, z, "dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        if (y === 2) g.set(x + dx, 2, z, "lantern", { hanging: "true", waterlogged: "false" });   // hangs from the storey floor
        continue;
      }
    }
    // A recessed window: the opening is air in the wall, the glass sits one block in, lit rooms have a glowstone behind it.
    g.set(x, y, z, "air");
    if (!(!ns && x === ENTRANCE[0] && z === ENTRANCE[1] && k === 0)) {
      g.set(x + dx, y, z + dz, u === mid ? "iron_bars" : "gray_stained_glass_pane");
    }
    if (r === 1 && u === lo && (x * 3 + z * 5 + k * 7) % 4 === 0) g.set(x + 2 * dx, y, z + 2 * dz, "glowstone");
  }
}

// 4. Main roof: two chimney stacks and a penthouse, kept off the setback and in from the parapet.
const box = (x0, z0, w, d, y0, h, block) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
    if (!inFoot(x, z) || tower(x, z) || x < 2 || z < 2 || x > X - 3 || z > Z - 3) continue;
    for (let y = y0; y < y0 + h; y++) g.set(x, y, z, block);
  }
};
box(5, 5, 2, 2, 31, 4, "bricks");
box(24, 11, 2, 2, 31, 4, "bricks");
box(10, 12, 4, 3, 31, 2, "smooth_stone");

const { blocks, palette } = g.save(`${DIR}/NYC1034240.nbt`);
const tw = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => (tower(x, z) ? "#" : ".")).join(""));
console.log(`saved NYC1034240.nbt: ${blocks} blocks, ${palette} palette entries`);
console.log(`setback footprint (#):\n${tw.join("\n")}`);

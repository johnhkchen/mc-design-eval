// OSMw1071343845: low-rise 2-storey commercial block (c. 1970s-80s Taipei).
// White-concrete shell, light-grey piers and storey bands, shopfront glazing at
// street level, and window grids above. Flat roof with a parapet at y=11 above
// the lowest ground. Glowstone sits behind some glazing for dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343845";

const W = 8, H = 23, D = 51;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const key = (x, z) => `${x},${z}`;
const inF = (x, z) => ground.has(key(x, z));

const NORMAL = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const FACING = { E: "east", W: "west", N: "north", S: "south" };
const PREF = ["E", "W", "S", "N"];

const exposed = (x, z) =>
  Object.keys(NORMAL).filter((f) => {
    const [dx, dz] = NORMAL[f];
    return !inF(x + dx, z + dz);
  });

const setb = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const pane = (f) =>
  f === "E" || f === "W"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Facade on one exposed face of a perimeter cell.
function facade(f, x, z, g0) {
  const ew = f === "E" || f === "W";
  const i = ew ? z : x;
  const L = ew ? D : W;
  const mid = Math.floor(L / 2);
  const [nx, nz] = NORMAL[f];
  const ix = x - nx, iz = z - nz;
  const inner = inF(ix, iz) && exposed(ix, iz).length === 0;
  const pier = i % 4 === 0 || i === L - 1 || Math.abs(i - mid) === 1;
  const door = i === mid;

  // Storey 1: shopfront (stall board, glass, fascia band).
  const s1 = g0 + 1;
  if (door) {
    const dp = (half) => ({ facing: FACING[f], half, hinge: "left", open: "false", powered: "false" });
    setb(x, s1, z, "dark_oak_door", dp("lower"));
    setb(x, s1 + 1, z, "dark_oak_door", dp("upper"));
    setb(x, s1 + 2, z, "glass_pane", pane(f));
    setb(x, s1 + 3, z, "light_gray_concrete");
  } else if (pier) {
    for (let y = s1; y <= s1 + 3; y++) setb(x, y, z, "light_gray_concrete");
  } else {
    setb(x, s1, z, "smooth_stone");
    setb(x, s1 + 1, z, "glass");
    setb(x, s1 + 2, z, "glass");
    setb(x, s1 + 3, z, "light_gray_concrete");
    if (inner && i % 8 === 2) setb(ix, g0 + 2, iz, "glowstone");
  }

  // Storey 2: window grid with sills and heads.
  if (pier) {
    for (let y = g0 + 6; y <= g0 + 9; y++) setb(x, y, z, "light_gray_concrete");
  } else {
    setb(x, g0 + 6, z, "smooth_stone");
    setb(x, g0 + 7, z, "glass_pane", pane(f));
    setb(x, g0 + 8, z, "glass_pane", pane(f));
    setb(x, g0 + 9, z, "white_concrete");
    if (inner && i % 8 === 6) setb(ix, g0 + 7, iz, "glowstone");
  }
}

for (const [x, z, g0] of cells) {
  // Foundation to cell ground, then base course / floor slab.
  for (let y = 0; y < g0; y++) setb(x, y, z, "stone_bricks");
  setb(x, g0, z, "polished_andesite");
  // Storey line between the two storeys (floor slab).
  setb(x, g0 + 5, z, "light_gray_concrete");
  // Roof slab.
  setb(x, g0 + 10, z, "stone");

  const ex = exposed(x, z);
  if (ex.length === 0) continue; // interior: air behind the shell

  // Perimeter wall: storeys 1 and 2, cornice, parapet.
  for (let y = g0 + 1; y <= g0 + 9; y++) setb(x, y, z, "white_concrete");
  setb(x, g0 + 10, z, "light_gray_concrete");
  setb(x, g0 + 11, z, "light_gray_concrete");

  const f = PREF.find((p) => ex.includes(p));
  facade(f, x, z, g0);
}

// Roof plant on the central roof area.
for (const [x, z, g0] of cells) {
  if (x >= 2 && x <= 5 && z >= 22 && z <= 28 && exposed(x, z).length === 0) {
    setb(x, g0 + 11, z, "gray_concrete");
    if (x >= 3 && x <= 4) setb(x, g0 + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

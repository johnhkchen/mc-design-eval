// P6 glazing, signs, lights and sidewalk (plan.md PARTS 6). Every write goes into air only, so the earlier parts' frames,
// sills, lintels and walls stay as they are; a cell an earlier part filled is skipped. Paving is the one direct write:
// it replaces the ground's top block at its own ground height.
import { B, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { groundAt, onFootprint, shop_board, lozenge_banner, awning_lantern, dusk_glow, door_step, pavilion_door, STONE_BRICKS } from "../vocab.mjs";

// Panes in a wall running along z connect north and south.
const PANE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const put = (g, x, y, z, block, state = {}) => { if (g.isAir(x, y, z)) g.set(x, y, z, block, state); };

// Soames-Dunn street front (west). The shell carved every opening to air and that air is locked, so the glazing, doors,
// transoms, sills and lintels of the openings (x2..3, x6..7) cannot be placed here: only what stands outside them is.
function soamesFront(g) {
  for (let k = 0; k <= 10; k++) {
    const z0 = 9 * k;
    dusk_glow(g, { x: 4, y: 9, z: z0 + 3, kind: "ceiling" });
    // The upper windows' glows are the shell's (it glazes them), hung just behind the glass.
    awning_lantern(g, { x: 0, y: 8, z: z0 + 5, chain: true });
    if (k <= 9) door_step(g, { x: 1, z: z0 + 6, y: groundAt(1, z0 + 6) + 1 });
  }
  // Shop-name boards: the Starbucks board and the Bavarian Meats board, and the lozenge under the canopy.
  shop_board(g, { x: 1, y0: 10, y1: 11, z0: 38, z1: 53, mat: "brown_concrete", text: "STARBUCKS", letter: "white", base: "brown", face: "west" });
  shop_board(g, { x: 1, y0: 10, y1: 11, z0: 56, z1: 71, mat: "blue_concrete", text: "BAVARIAN MEATS", letter: "white", base: "light_blue", face: "west" });
  lozenge_banner(g, { x: 0, y: 8, z: 62, face: "west" });
}

// Soames-Dunn shops on the C range (x6 plane, shop floor y3). Its openings are the shell's, as on the A front.
function soamesC(g) {
  for (let j = 0; j <= 5; j++) {
    const z0 = 100 + 9 * j;
    dusk_glow(g, { x: 8, y: 9, z: z0 + 3, kind: "ceiling" });
    awning_lantern(g, { x: 4, y: 8, z: z0 + 5, chain: true });
    door_step(g, { x: 5, z: z0 + 6, y: groundAt(5, z0 + 6) + 1 });
  }
}

// Soames-Dunn B west face: the upper windows over A's roof, on the same 9-bay grid. The sills (x28 y19) and lintels
// (x28 y23) lie outside the shell's carved openings and are placed; the glass at x29 is the shell's and is not.
function soamesBWest(g) {
  for (let k = 0; k <= 10; k++)
    for (const z0 of [9 * k + 3, 9 * k + 6])
      for (const dz of [0, 1]) {
        put(g, 27, 18, z0 + dz, ...B.slab("stone_brick", "top"));
      }
}

// Butterworth east front (1st Avenue, glass x113, pavilion glass x115). Shops sit between the piers; the upper windows
// are every 6 along z, bays 23 and 25 left as brick.
const BUTTER_PIER = (z) => z <= 1 || z >= 138 || [11, 12, 23, 24, 35, 36, 47, 48, 59, 60, 71, 72, 83, 84, 95, 96, 107, 108, 119, 120, 131, 132].includes(z);
const shopFloor = (z) => (z <= 35 ? 11 : z <= 83 ? 10 : z <= 139 ? 9 : 8);

function butterShops(g) {
  let start = null;
  const spans = [];
  for (let z = 2; z <= 138; z++) {
    const shop = z < 138 && !BUTTER_PIER(z);
    if (shop && start === null) start = z;
    if (!shop && start !== null) { spans.push([start, z - 1]); start = null; }
  }
  for (const [a, b] of spans) {
    const F = shopFloor(a);
    // Doors first (the glass then skips their cells), a pair at the centre of each shop with room for one.
    if (b - a >= 3) {
      const zd = a + Math.floor((b - a + 1) / 2) - 1;
      [zd, zd + 1].forEach((z, i) => {
        put(g, 113, F + 1, z, ...B.door("dark_oak", "east", "lower", i ? "right" : "left"));
        put(g, 113, F + 2, z, ...B.door("dark_oak", "east", "upper", i ? "right" : "left"));
      });
    }
    for (let z = a; z <= b; z++) for (let y = F + 2; y <= 15; y++) put(g, 113, y, z, "glass_pane", PANE);
    for (let z = a + 1; z <= b; z += 3) dusk_glow(g, { x: 111, y: 16, z, kind: "shop" });
  }
}

function butterWindows(g) {
  for (let k = 0; k <= 25; k++) {
    if (k === 23 || k === 25) continue;
    const z0 = 6 * k + 1;
    for (let z = z0; z <= z0 + 2; z++) {
      for (let y = 20; y <= 22; y++) put(g, 113, y, z, "glass_pane", PANE);
      for (let y = 26; y <= 29; y++) put(g, 113, y, z, "glass_pane", PANE);
      for (let y = 31; y <= 34; y++) put(g, 113, y, z, "glass_pane", PANE);
    }
    dusk_glow(g, { x: 111, y: 21, z: z0 + 1, kind: "upper" });
  }
  // Pavilion glazing above the doorway (face x116, glass x115), the same three heights.
  for (const [z0, z1] of [[143, 145], [146, 148]])
    for (let z = z0; z <= z1; z++) {
      for (let y = 20; y <= 22; y++) put(g, 115, y, z, "glass_pane", PANE);
      for (let y = 26; y <= 29; y++) put(g, 115, y, z, "glass_pane", PANE);
      for (let y = 31; y <= 34; y++) put(g, 115, y, z, "glass_pane", PANE);
    }
  pavilion_door(g, { x: 116, z: 144, y: 9, face: "east" });
  bannerWord(g, "BUTTERWORTH", { center: [117, 38, 146], face: "east", letter: "black", base: "white" });
}

// The Kells pub on the x64 projection (face west): glass between the posts of the frame (kells_front in P5 writes frame,
// doors, fascia and lanterns), and the KELLS letters on the fascia.
function kells(g) {
  const posts = [90, 94, 97, 101];
  for (let z = 91; z <= 100; z++) {
    if (posts.includes(z) || z === 95 || z === 96) continue;
    for (let y = 4; y <= 7; y++) put(g, 64, y, z, "glass_pane", PANE);
  }
  for (const z of [95, 96]) for (let y = 5; y <= 7; y++) put(g, 64, y, z, "glass_pane", PANE);
  bannerWord(g, "KELLS", { center: [63, 8, 95], face: "west", letter: "white", base: "black" });
}

// Sidewalk paving at each cell's ground height, under the awnings of A (x0..1) and C (x4..5).
function sidewalk(g) {
  for (let z = 0; z <= 99; z++) for (let x = 0; x <= 1; x++) paveCell(g, x, z);
  for (let z = 100; z <= 158; z++) for (let x = 4; x <= 5; x++) paveCell(g, x, z);
}
function paveCell(g, x, z) {
  if (!onFootprint(x, z)) return;
  const gy = groundAt(x, z);
  if (gy == null) return;
  g.set(x, gy, z, STONE_BRICKS, {});
}

export function build(g) {
  soamesFront(g);
  soamesC(g);
  soamesBWest(g);
  butterShops(g);
  butterWindows(g);
  kells(g);
  sidewalk(g);
}

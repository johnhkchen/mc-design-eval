import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two storeys of quartz-clad walls,
// shopfront glazing at street level, a stone coping and a rooftop plant group.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339263128";
const W = 92, H = 23, D = 120;
const DECK_BASE = 10;   // roof deck top block (roof reads ~11 above lowest ground)
const STOREY = 5;       // storey height in blocks

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const faces = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
};
// inward offset from each outward face
const IN = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: centred on the south facade
const southX = cells.filter(([x, z]) => faces(x, z).includes("S")).map(([x]) => x);
const cx = southX.length ? Math.round(southX.reduce((a, b) => a + b, 0) / southX.length) : -99;

for (const [x, z, gr0] of cells) {
  const gg = Math.min(Math.max(0, Math.round(gr0)), 16);
  const fs = faces(x, z);
  const perim = fs.length > 0;
  const deck = Math.max(DECK_BASE, gg + 1);

  // Foundation and ground floor level
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");
  put(x, gg, z, perim ? "stone_bricks" : "smooth_quartz");

  if (!perim) {
    // Interior: floor slab per storey, air between, roof deck on top
    if (STOREY > gg) put(x, STOREY, z, "smooth_quartz");
    put(x, deck, z, "smooth_stone");
    continue;
  }

  const isDoor = fs.includes("S") && Math.abs(x - cx) <= 1;
  const pier = (x + z) % 4 === 0;

  for (let y = gg + 1; y < deck; y++) {
    if (y === STOREY) {
      put(x, y, z, "smooth_quartz");               // storey line
    } else if (y < STOREY) {
      // Ground floor: shopfront
      if (isDoor && y <= 3) continue;              // doorway opening
      if (pier) put(x, y, z, "quartz_block");
      else if (y === 4) put(x, y, z, "dark_oak_planks"); // lintel
      else put(x, y, z, "glass_pane");
    } else {
      // Upper storey: window grid
      if (pier) {
        put(x, y, z, "quartz_block");
      } else if (y === deck - 1) {
        put(x, y, z, "smooth_quartz");             // spandrel
      } else {
        put(x, y, z, "glass_pane");
        // warm light behind some upper windows
        const f = fs[0];
        const [dx, dz] = IN[f];
        const ix = x + dx, iz = z + dz;
        if (y === STOREY + 1 && (x + z) % 12 === 1 && has(ix, iz) && faces(ix, iz).length === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Door lamp inside the entrance
  if (isDoor) {
    const [dx, dz] = IN.S;
    if (has(x + dx, z + dz) && faces(x + dx, z + dz).length === 0) {
      put(x + dx, gg + 1, z + dz, "shroomlight");
    }
  }

  // Cornice on the wall top, coping above it
  put(x, deck, z, "smooth_quartz");
  put(x, deck + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop plant: sparse cooling boxes and one central mast
const interior = cells.filter(([x, z]) => faces(x, z).length === 0);
for (const [x, z, gr0] of interior) {
  const gg = Math.min(Math.max(0, Math.round(gr0)), 16);
  const deck = Math.max(DECK_BASE, gg + 1);
  if ((x * 7 + z * 3) % 37 === 0 && x % 5 !== 0) {
    put(x, deck + 1, z, "light_gray_concrete");
    put(x, deck + 2, z, "light_gray_concrete");
  }
}
if (interior.length) {
  const mx = Math.round(interior.reduce((a, c) => a + c[0], 0) / interior.length);
  const mz = Math.round(interior.reduce((a, c) => a + c[1], 0) / interior.length);
  let best = null, bd = Infinity;
  for (const [x, z, gr0] of interior) {
    const d = (x - mx) ** 2 + (z - mz) ** 2;
    if (d < bd) { bd = d; best = [x, z, gr0]; }
  }
  const [bx, bz, bgr] = best;
  const bgg = Math.min(Math.max(0, Math.round(bgr)), 16);
  const bdeck = Math.max(DECK_BASE, bgg + 1);
  put(bx, bdeck + 1, bz, "iron_bars");
  put(bx, bdeck + 2, bz, "iron_bars");
  put(bx, bdeck + 3, bz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);

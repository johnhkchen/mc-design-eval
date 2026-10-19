// NYC1035407: 575 Fifth Avenue, a 1962 commercial and office building. A slab tower of 41 to 42 storeys in a
// light-blue glass curtain wall with aluminium mullions and light-grey spandrels, standing on a stone podium of
// 11 to 12 storeys that wraps the north, south and avenue sides. The east half steps up one storey. Street level
// is a stone shopfront with warm lamps behind the glass; the lobby is on the avenue face (x 0). A roof box and a
// mast sit on the roof. Every storey is a 3-block module: floor slab on the line 1 + 3k, then two glass rows. The
// footprint is solid from y 0 (the plinth), so nothing floats; interiors are air with floor slabs only.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const X = 54, Z = 27, Y = 140;
const PODIUM_MAX = 13;                                          // storeys at or below this are the stone podium
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035407.cells.json`, "utf8"));

const raw = Array.from({ length: Z }, () => Array(X).fill(null));   // lidar roof per footprint cell
for (const [x, z, , r] of cells) raw[z][x] = r;
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && raw[z][x] !== null;

// Storeys per cell: the lidar roof over 3 blocks a storey, then the most common count in the 5 x 5 around it, so the
// lidar's noise becomes flat tiers and the east-half step stays a clean line. Dropouts (roof 0) take their neighbours.
const rawN = raw.map((row) => row.map((r) => (r && r > 0 ? Math.round((r - 1) / 3) : null)));
const storeys = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => {
  if (!inside(x, z)) return null;
  const count = new Map();
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const n = rawN[z + dz]?.[x + dx];
    if (n != null) count.set(n, (count.get(n) ?? 0) + 1);
  }
  let best = null, most = -1;
  for (const [n, k] of count) if (k > most || (k === most && n > best)) { best = n; most = k; }
  return best;
}));
const top = (x, z) => (inside(x, z) ? 1 + 3 * storeys[z][x] : -1);   // top block row = the roof slab
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) < y);   // faces with air outside at row y

const STYLE = {
  podium: { spandrel: "calcite", mullion: "polished_andesite", glass: "light_blue_stained_glass" },
  tower: { spandrel: "light_gray_concrete", mullion: "iron_block", glass: "light_blue_stained_glass" },
};
const SHOP = { glass: "light_blue_stained_glass", frame: "black_concrete" };
const lit = (x, y, z, n) => (x * 7919 + y * 104729 + z * 1299709) % 97 < n;   // a fixed scatter of warm windows

const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  const T = top(x, z), style = STYLE[storeys[z][x] <= PODIUM_MAX ? "podium" : "tower"];
  g.set(x, 0, z, "polished_granite");                             // plinth: the foundation, solid under every cell
  for (let y = 1; y <= T; y++) {
    const slab = (y - 1) % 3 === 0, k = Math.floor((y - 1) / 3);
    if (y === T) { g.set(x, y, z, "gray_concrete"); continue; }     // roof surface
    const faces = exposed(x, z, y);
    if (!faces.length) { if (slab) g.set(x, y, z, "smooth_stone"); continue; }   // interior: floor slab only, else air
    const [dx, dz] = faces[0];
    const corner = faces.length > 1;
    const along = dx !== 0 ? z : x;                               // position along the face: mullions every 3 blocks
    const mullion = corner || along % 3 === 0;
    let block;
    if (k === 0) {                                                // street level
      if (slab) block = "polished_granite";
      else if (y === 2) block = mullion ? SHOP.frame : SHOP.glass;
      else block = "calcite";                                     // transom band over the shops
    } else if (slab) block = style.spandrel;
    else block = mullion ? style.mullion : style.glass;
    g.set(x, y, z, block);
    // A warm lamp on the floor just behind the glass (never above air, so nothing hangs).
    if (!slab && !mullion && (y - 1) % 3 === 1) {
      const ix = x - dx, iz = z - dz;
      const shop = k === 0, on = shop ? lit(x, y, z, 60) : lit(x, y, z, 9);
      if (on && inside(ix, iz) && top(ix, iz) >= y && !exposed(ix, iz, y).length) g.set(ix, y, iz, "glowstone");
    }
  }
  // Roof edge: a calcite coping on the cells with air beside them at the roof line.
  if (exposed(x, z, T + 1).length) g.set(x, T + 1, z, "calcite");
}

// Lobby on the avenue face (x 0): two dark-oak doors in a granite surround, a hanging lantern inside.
for (const z of [11, 14]) for (const y of [2, 3]) g.set(0, y, z, "polished_granite");
g.set(0, 2, 12, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 3, 12, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, 13, "dark_oak_door", { facing: "east", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(0, 3, 13, "dark_oak_door", { facing: "east", half: "upper", hinge: "right", open: "false", powered: "false" });
g.set(1, 3, 12, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant on the east half: a stone-clad box with a coping, standing on the roof slab.
const TB = top(44, 12);
for (let y = TB + 1; y <= TB + 3; y++) for (let z = 8; z <= 16; z++) for (let x = 40; x <= 48; x++)
  g.set(x, y, z, z === 8 || z === 16 || x === 40 || x === 48 ? "light_gray_concrete" : "smooth_stone");
for (let z = 8; z <= 16; z++) for (let x = 40; x <= 48; x++) g.set(x, TB + 4, z, "calcite");

// A mast on the core roof, the silhouette from the air and the street at dusk.
const TM = top(20, 13);
for (let y = TM + 1; y <= TM + 12; y++) g.set(20, y, 13, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = `${DIR}/NYC1035407.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, palette ${palette}, roof ${TB} (east) and ${top(20, 13)} (core)`);

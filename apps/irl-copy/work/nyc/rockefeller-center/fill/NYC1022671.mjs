// 150 West 47th Street, 1979: a mixed residential and commercial tower on a 19 x 26 lot. Lidar gives a 40 to 45 block body with
// a 41 parapet ring on its open edges, a 43 and 44 mass across the middle and south, 45 crown cells with a plant cluster, and
// a 6-block commercial podium on the west and east ends. Precast-look smooth quartz piers and light-grey spandrel bands frame
// bronze-tinted glass panes; the ground storey is shopfront glass on granite piers, with a lobby door and a canopy on the
// south (47th Street) face. Each column is solid from y 0 to its roof, so every tier stands on the one below. Interiors are
// air behind the glass with a smooth stone floor at each storey line; a few residential windows hold glowstone behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1022671.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const NB = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Smooth the lidar into flat tiers. Roof 0 is open ground, 1 a plinth, 6-8 the podium, 40-42 the north block (41 on its
// open edge as a parapet), 43, 44 and 45 the tower mass and crown.
const TIER = new Map();
for (const [k, { roof }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const edge = Object.values(NB).some(([dx, dz]) => { const n = raw.get(key(x + dx, z + dz)); return !n || n.roof < 40; });
  const R = roof === 0 ? 0 : roof === 1 ? 1 : roof <= 8 ? 6 : roof <= 42 ? (edge ? 41 : 40) : roof === 43 ? 43 : roof === 44 ? 44 : 45;
  TIER.set(k, R);
}
const H = (x, z) => TIER.get(key(x, z)) ?? 0;

// A cell's exposed faces at height y: the neighbour is outside the lot (height 0) or stands no higher than y.
const faces = (x, z, y) => Object.keys(NB).filter((d) => { const [dx, dz] = NB[d]; return H(x + dx, z + dz) <= y; });

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const v = new Voxels([19, 57, 26]);
const warm = [];   // windows that get a light behind them, placed after the shell

for (const k of TIER.keys()) {
  const [x, z] = k.split(",").map(Number);
  const h = H(x, z);
  if (!h) { if (raw.get(k).ground >= 1) v.set(x, 0, z, "polished_granite"); continue; }   // open ground: foundation only
  for (let y = 0; y < h; y++) {
    const f = faces(x, z, y), top = y === h - 1;
    if (y === 0) { v.set(x, y, z, "polished_granite"); continue; }                        // base course
    if (top) {
      if (f.length) v.set(x, y, z, "smooth_quartz");                                      // parapet / cornice
      else v.set(x, y, z, h === 6 ? "moss_block" : "black_concrete");                    // podium terrace or tar roof
      continue;
    }
    if (!f.length) { if (y % 3 === 0) v.set(x, y, z, "smooth_stone"); continue; }         // interior: floor slab per storey
    if (f.length > 1) { v.set(x, y, z, "smooth_quartz"); continue; }                     // corner quoin
    const d = f[0], along = d === "N" || d === "S" ? x : z, pier = along % 3 === 0;
    if (y <= 2) { v.set(x, y, z, pier ? "polished_granite" : "light_blue_stained_glass"); continue; }   // shopfront
    if (y % 3 === 0) { v.set(x, y, z, "light_gray_concrete"); continue; }                // spandrel band at each storey line
    if (pier) { v.set(x, y, z, "smooth_quartz"); continue; }
    v.set(x, y, z, "gray_stained_glass_pane", d === "N" || d === "S" ? PANE_NS : PANE_EW);
    if ((x * 5 + z * 3 + y * 7) % 6 === 0) warm.push([x, y, z, d]);
  }
}

// Warm residential light: glowstone one cell inside a pane (the cell behind the glass is air, so it reads as a lit room).
for (const [x, y, z, d] of warm) {
  const [dx, dz] = NB[d], ix = x - dx, iz = z - dz;
  if (H(ix, iz) > y && !faces(ix, iz, y).length) v.set(ix, y, iz, "glowstone");
}

// Lobby on 47th Street (south face): a door in the ground-floor shopfront and a canopy on the spandrel line above it.
v.set(10, 1, 22, "dark_oak_door", { facing: "south", half: "lower", hinge: "right", open: "false", powered: "false" });
v.set(10, 2, 22, "dark_oak_door", { facing: "south", half: "upper", hinge: "right", open: "false", powered: "false" });
for (let x = 9; x <= 11; x++) for (let z = 23; z <= 24; z++) v.set(x, 3, z, "black_concrete");

// Roof plant on the crown: a checker of plant boxes, and an antenna mast.
for (const [k, h] of TIER) {
  if (h !== 45) continue;
  const [x, z] = k.split(",").map(Number);
  if ((x + z) % 2 === 0) v.set(x, 45, z, "gray_concrete");
}
for (let y = 46; y <= 50; y++) v.set(7, y, 9, "iron_bars");

const { blocks, palette } = v.save(`${dir}/NYC1022671.nbt`);
console.log(`NYC1022671.nbt: ${blocks} blocks, ${palette} palette entries`);

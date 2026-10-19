// Thompson Seattle Hotel & Sequel Apartments, 110 Stewart St (2015): a midrise hotel and apartment block of eleven
// storeys over a podium. Pale concrete piers with tinted glass between them, white floor bands, a granite base and a
// shopfront under a dark canopy, a lobby door on the largest face, and a set-back penthouse with rooftop plant.
// The ground falls three blocks across the footprint; foundations run down to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270126970.cells.json`, "utf8"));

const SIZE = [41, 76, 76];
const PODIUM_TOP = 8;                                        // first tower floor band
const BANDS = [8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58];   // eleven storeys: band, three glass rows, cladding
const CORNICE = 63;                                          // roof edge course
const PARAPET = 64;                                          // parapet cap, roof about 64 blocks above lowest ground
const PENT = 12;                                             // penthouse core set back this many cells from the edge

const WALL = "light_gray_concrete", BAND = "white_concrete", STONE = "polished_granite", ROOF = "gray_concrete";
const CANOPY = "black_concrete", FOUND = "stone_bricks", FLOOR = "smooth_stone", PLANT = "stone";

const NORM = { "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] };
const FACING = { "+x": "east", "-x": "west", "+z": "south", "-z": "north" };
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const has = (x, z) => ground.has(key(x, z));
const exposed = (x, z) => Object.keys(NORM).filter((n) => !has(x + NORM[n][0], z + NORM[n][1]));
const alongOf = (n, x, z) => (n.endsWith("x") ? z : x);     // a face normal ±x runs along z
const paneOf = (n) => (n.endsWith("x")
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const doorOf = (n, half) => ({ facing: FACING[n], half, hinge: "left", open: "false", powered: "false" });
const glassOf = (bay, k) => ((bay + k) % 4 === 0 ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane");

// Interior depth (cells in from the nearest exposed face): the penthouse sits PENT cells in.
const depth = new Map();
let frontier = cells.filter(([x, z]) => exposed(x, z).length).map(([x, z]) => key(x, z));
for (const k of frontier) depth.set(k, 0);
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const k of frontier) {
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of Object.values(NORM)) {
      const nk = key(x + dx, z + dz);
      if (has(x + dx, z + dz) && !depth.has(nk)) { depth.set(nk, d); next.push(nk); }
    }
  }
  frontier = next;
}
const dOf = (x, z) => depth.get(key(x, z)) ?? 0;

// The lobby is on the face with the most exposed cells, at the middle of its run.
const faces = {};
for (const [x, z] of cells) for (const n of exposed(x, z)) faces[n] = (faces[n] || 0) + 1;
const entN = Object.keys(faces).sort((p, q) => faces[q] - faces[p])[0];
const alongs = cells.filter(([x, z]) => exposed(x, z).includes(entN)).map(([x, z]) => alongOf(entN, x, z)).sort((p, q) => p - q);
const entM = alongs[Math.floor(alongs.length / 2)];

const V = new Voxels(SIZE);
const put = (x, y, z, block, state) => V.set(x, y, z, block, state);

for (const [x, z, g] of cells) {
  for (let y = 0; y < g; y++) put(x, y, z, FOUND);
  const ex = exposed(x, z);
  const dh = dOf(x, z);

  // Interior: floor slabs and the roof deck; the air between is the room. The penthouse and the plant sit on the deck.
  if (!ex.length) {
    for (const f of [g, ...BANDS]) put(x, f, z, FLOOR);
    put(x, CORNICE, z, ROOF);
    if (dh >= PENT) {
      put(x, PARAPET, z, FLOOR);
      put(x, 68, z, ROOF);
      if (dh === PENT) {
        const outs = Object.keys(NORM).filter((n) => has(x + NORM[n][0], z + NORM[n][1]) && dOf(x + NORM[n][0], z + NORM[n][1]) === dh - 1);
        const n = outs[0], corner = outs.length > 1, a = alongOf(n, x, z), bay = Math.floor(a / 4);
        const pier = corner || a % 4 === 0;
        put(x, PARAPET, z, WALL);
        put(x, 68, z, BAND);
        for (let y = PARAPET + 1; y <= 67; y++) {
          if (pier) put(x, y, z, WALL);
          else put(x, y, z, glassOf(bay, 1), paneOf(n));
        }
      }
      continue;
    }
    if ((x * 3 + z * 5) % 11 === 0) { put(x, PARAPET, z, PLANT); put(x, PARAPET + 1, z, PLANT); }
    continue;
  }

  // Shell: a cell is one facade block. Corners and every fourth column are piers; the rest are glass.
  const n = ex[0], corner = ex.length > 1, a = alongOf(n, x, z), bay = Math.floor(a / 4);
  const pier = corner || a % 4 === 0;
  const door = n === entN && a === entM;
  const entry = n === entN && Math.abs(a - entM) <= 1;
  const [ox, oz] = NORM[n];
  // A light two cells in, behind the glass and the air gap (interior cells only).
  const lit = (y, block) => {
    const ix = x - 2 * ox, iz = z - 2 * oz;
    if (has(ix, iz) && !exposed(ix, iz).length) put(ix, y, iz, block);
  };

  // Ground storey: granite base, shopfront glass and piers, a dark canopy, then podium windows.
  put(x, g, z, STONE);
  for (let y = g + 1; y < PODIUM_TOP; y++) {
    if (y === g + 4) put(x, y, z, CANOPY);
    else if (door && y <= g + 2) put(x, y, z, "dark_oak_door", doorOf(n, y === g + 1 ? "lower" : "upper"));
    else if (y <= g + 3) {
      if (pier && !entry) put(x, y, z, STONE);
      else put(x, y, z, glassOf(bay, 0), paneOf(n));
    } else if (pier) put(x, y, z, WALL);
    else put(x, y, z, glassOf(bay, 0), paneOf(n));
  }
  if (door) lit(g + 2, "shroomlight");
  if (!pier && g + 6 < PODIUM_TOP && (bay + 2) % 5 === 0) lit(g + 6, "glowstone");

  // Tower: a white band per storey, three glass rows between piers, and cladding under the next band.
  BANDS.forEach((b, k) => {
    put(x, b, z, BAND);
    for (let y = b + 1; y <= b + 3; y++) {
      if (pier) put(x, y, z, WALL);
      else put(x, y, z, glassOf(bay, k), paneOf(n));
    }
    if (!pier && (bay + k) % 5 === 2) lit(b + 2, "glowstone");
    put(x, b + 4, z, WALL);
  });
  put(x, CORNICE, z, BAND);
  put(x, PARAPET, z, WALL);
}

const out = V.save(`${DIR}/SEA1270126970.nbt`);
console.log(`blocks ${out.blocks}, palette ${out.palette}, lobby face ${entN} at ${entM}, max depth ${Math.max(...depth.values())}`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 萬善堂: two-storey Taiwanese folk-temple hall, c. 1960s–80s. White-rendered
// masonry walls with stone-brick pilasters, red storey bands and a red-framed
// entrance under a red lintel, stone-brick base and cornice, and a stepped
// dark-tile hip roof with a lantern on the flat top.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw333599236";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 7;
const g = new Voxels([W, H, D]);

const BASE_Y = 0;
const FLOOR2_Y = 5;     // storey line
const CORNICE_Y = 10;   // top of second storey, ceiling/cornice course
const ROOF_BODY_Y = 11; // roof solid starts here
const WIN_LO = [2, 3];  // storey 1 window rows (absolute)
const WIN_HI = [7, 8];  // storey 2 window rows (absolute)

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), Math.max(0, Math.min(Math.round(gr), 6)));
const inF = (x, z) => foot.has(key(x, z));

const NB = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const outward = (x, z) => Object.keys(NB).filter(n => !inF(x + NB[n][0], z + NB[n][1]));

// distance from the perimeter (perimeter cells = 0), capped at 3 for the roof
const dist = new Map();
let frontier = [];
for (const [x, z] of cells) {
  if (outward(x, z).length > 0) { dist.set(key(x, z), 0); frontier.push([x, z]); }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = dist.get(key(x, z));
    for (const n of Object.keys(NB)) {
      const nx = x + NB[n][0], nz = z + NB[n][1];
      if (inF(nx, nz) && !dist.has(key(nx, nz))) {
        dist.set(key(nx, nz), d + 1);
        next.push([nx, nz]);
      }
    }
  }
  frontier = next;
}
const dOf = (x, z) => dist.get(key(x, z)) ?? 0;

// entrance: south-facing perimeter cell nearest the middle of the front
const southSingles = cells.filter(([x, z]) => {
  const o = outward(x, z);
  return o.length === 1 && o[0] === "south";
});
let doorCell = null;
if (southSingles.length) {
  doorCell = southSingles.reduce((best, c) =>
    Math.abs(c[0] - 4.5) < Math.abs(best[0] - 4.5) ? c : best);
}
const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

const stairFacing = (x, z, d) => {
  if (d === 0) return outward(x, z)[0];
  for (const n of Object.keys(NB)) {
    const nx = x + NB[n][0], nz = z + NB[n][1];
    if (inF(nx, nz) && dOf(nx, nz) === d - 1) return n;
  }
  return "north";
};

// ---- pass 1: foundations, floors, walls, ceilings ----
for (const [x, z] of cells) {
  const G = foot.get(key(x, z));
  const d = dOf(x, z);
  const out = outward(x, z);

  // foundation up to and including ground height
  for (let y = BASE_Y; y <= G; y++) g.set(x, y, z, "stone_bricks");

  // storey-2 floor slab (interior); perimeter overwritten by walls below
  if (G < FLOOR2_Y) g.set(x, FLOOR2_Y, z, "smooth_stone");

  if (d === 0) {
    const corner = out.length > 1;
    const single = !corner && out.length === 1;
    const along = single
      ? ((out[0] === "north" || out[0] === "south") ? x : z)
      : 0;
    const isPilaster = single && along % 3 === 0;

    for (let y = G + 1; y <= 9; y++) {
      let id = "white_concrete";
      if (y === G + 1) id = "stone_bricks";                 // base course
      else if (y === FLOOR2_Y) id = "red_concrete";         // storey band
      else if (y === CORNICE_Y) id = "stone_bricks";
      else if (corner || isPilaster) id = "stone_bricks";   // corners and pilasters

      if (single && y > G + 1 && y !== FLOOR2_Y) {
        const isWinRow = WIN_LO.includes(y) || WIN_HI.includes(y);
        if (isWinRow && along % 2 === 1 && !isPilaster && !isDoor(x, z)) {
          const horiz = (out[0] === "north" || out[0] === "south")
            ? { east: "true", west: "true", north: "false", south: "false" }
            : { north: "true", south: "true", east: "false", west: "false" };
          g.set(x, y, z, "glass_pane", horiz);
          continue;
        }
      }
      g.set(x, y, z, id);
    }
    // cornice course at top of storey 2
    g.set(x, CORNICE_Y, z, "stone_bricks");
  } else {
    // interior: ceiling of storey 2 at cornice level
    g.set(x, CORNICE_Y, z, "smooth_stone");
  }
}

// ---- pass 2: entrance door, red frame, lintel, and warm interior lights ----
if (doorCell) {
  const [dx, dz] = doorCell;
  const G = foot.get(key(dx, dz));
  const doorProps = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });

  // red-brick jambs flanking the door, one cell either side
  for (const ox of [-1, 1]) {
    const nx = dx + ox;
    if (inF(nx, dz) && outward(nx, dz).includes("south")) {
      g.set(nx, G + 1, dz, "red_nether_bricks");
      g.set(nx, G + 2, dz, "red_nether_bricks");
    }
  }

  g.set(dx, G + 1, dz, "dark_oak_door", doorProps("lower"));
  g.set(dx, G + 2, dz, "dark_oak_door", doorProps("upper"));

  // red lintel canopy over the door and its jambs
  for (const ox of [-2, -1, 0, 1, 2]) {
    const nx = dx + ox;
    if (inF(nx, dz) && outward(nx, dz).includes("south")) {
      g.set(nx, G + 3, dz, "red_concrete");
    }
  }
  // warm lantern under the canopy beside the door
  for (const ox of [-1, 1]) {
    const nx = dx + ox;
    if (inF(nx, dz) && outward(nx, dz).includes("south")) {
      g.set(nx, G + 2, dz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

for (const [x, z] of cells) {
  const d = dOf(x, z);
  const G = foot.get(key(x, z));
  if (d >= 1 && (x + 2 * z) % 5 === 0) {
    // glowstone set back behind the glass, in the air gap
    if (G + 1 < FLOOR2_Y) g.set(x, 3, z, "glowstone");
    g.set(x, 7, z, "glowstone");
  }
}

// ---- pass 3: stepped hip roof with dark tiles and a ridge lantern ----
for (const [x, z] of cells) {
  const d = dOf(x, z);
  const top = 12 + Math.min(d, 3);
  // solid roof body up to just below the surface
  for (let y = ROOF_BODY_Y; y < top; y++) g.set(x, y, z, "stone_bricks");

  if (d >= 3) {
    g.set(x, top, z, "deepslate_tiles");
  } else {
    const facing = stairFacing(x, z, d);
    g.set(x, top, z, "deepslate_tile_stairs", {
      facing, half: "bottom", shape: "straight", waterlogged: "false",
    });
  }
}

// ridge lantern on the flat top, centred on the footprint
let ridge = null;
for (const [x, z] of cells) {
  if (dOf(x, z) >= 3) {
    if (!ridge || Math.abs(x - 4.5) + Math.abs(z - 3) < Math.abs(ridge[0] - 4.5) + Math.abs(ridge[1] - 3)) {
      ridge = [x, z];
    }
  }
}
if (ridge) {
  g.set(ridge[0], 16, ridge[1], "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

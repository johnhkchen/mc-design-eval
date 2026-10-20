// Era and form (decided from the record): a 1980s Taipei two-storey commercial block, the kind that
// filled Xinyi before the towers. Roof about 11 blocks above the lowest ground, so two storeys of ~5
// blocks each: ground-floor shopfront with stone plinth, white-tile pilasters and a red terracotta
// cornice, upper storey with a grid of glass panes and white mullions, a flat roof deck with a small
// plant room, and a few warm glowstone lights set behind the upper windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967579699";
const W = 22, H = 23, D = 28;
const ROOF = 11;          // top of parapet
const DECK = 10;          // roof deck / cornice course
const SLAB = 5;           // storey line between ground and upper floor

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const G = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  G.set(key(x, z), gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = (minX + maxX) / 2;
const midZ = (minZ + maxZ) / 2;

const NB = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
// Outward face of an edge cell (first neighbour missing from the footprint), or null for interior cells.
function outward(x, z) {
  for (const n of ["north", "south", "west", "east"]) {
    const [dx, dz] = NB[n];
    if (!G.has(key(x + dx, z + dz))) return n;
  }
  return null;
}

// Pick the entrance: the exterior cell nearest the middle of the preferred face.
const ext = cells.filter(([x, z]) => outward(x, z));
let doorKey = null;
for (const pref of ["south", "north", "east", "west"]) {
  const cand = ext.filter(([x, z]) => outward(x, z) === pref);
  if (!cand.length) continue;
  const horiz = pref === "north" || pref === "south";
  cand.sort((a, b) =>
    horiz ? Math.abs(a[0] - midX) - Math.abs(b[0] - midX)
          : Math.abs(a[1] - midZ) - Math.abs(b[1] - midZ));
  doorKey = key(cand[0][0], cand[0][1]);
  break;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const doorP = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const paneP = (out) =>
  out === "north" || out === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade block for an exterior cell at height y. i = index along the face (for rhythm).
function facade(y, i, out, isDoor, gr) {
  if (y === ROOF) return ["white_concrete"];
  if (y === DECK) return ["red_terracotta"];
  if (y === SLAB) return ["light_gray_concrete"];
  if (y < SLAB) {
    if (isDoor) {
      if (y === gr + 1) return ["oak_door", doorP(out, "lower")];
      if (y === gr + 2) return ["oak_door", doorP(out, "upper")];
      if (y === gr + 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
    }
    if (y === gr + 1) return i % 4 === 0 ? ["white_concrete"] : ["smooth_stone"];
    if (i % 4 === 0) return ["white_concrete"];
    if (y === 4) return ["light_gray_concrete"];
    return ["glass_pane", paneP(out)];
  }
  // upper storey, y 6..9
  if (i % 3 === 0) return ["white_concrete"];
  if (y === 9) return ["light_gray_concrete"];
  return ["glass_pane", paneP(out)];
}

const glows = [];

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to the cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const i = out === "north" || out === "south" ? x - minX : z - minZ;
  const isDoor = out && key(x, z) === doorKey;

  for (let y = gr + 1; y <= ROOF; y++) {
    if (!out) {
      // interior: no air-filled rooms beyond the storey slab and roof deck
      if (y === SLAB || y === DECK) put(x, y, z, "light_gray_concrete");
      continue;
    }
    const f = facade(y, i, out, isDoor, gr);
    if (f) put(x, y, z, f[0], f[1]);
  }

  // warm light behind some upper-storey windows (inside, one cell in from the glass)
  if (out && !isDoor && i % 6 === 4) {
    const [dx, dz] = NB[out];
    const ix = x - dx, iz = z - dz;
    if (G.has(key(ix, iz)) && !outward(ix, iz) && G.get(key(ix, iz)) < 7) {
      glows.push([ix, 7, iz]);
    }
  }
}

// Roof plant room on the deck, centred on the footprint.
for (const [x, z] of cells) {
  if (outward(x, z)) continue;
  if (x >= midX - 3 && x <= midX + 3 && z >= midZ - 4 && z <= midZ + 4) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

for (const [x, y, z] of glows) put(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);

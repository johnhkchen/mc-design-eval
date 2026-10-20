import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326022";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 26, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const FP = new Set(cells.map(([x, z]) => key(x, z)));
const inF = (x, z) => FP.has(key(x, z));
const perim = (x, z) => !inF(x + 1, z) || !inF(x - 1, z) || !inF(x, z + 1) || !inF(x, z - 1);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Street level: lowest ground under the footprint; floor lines are counted from here.
const base = Math.min(...cells.map((c) => c[2]));
const ENTRY_X = 9; // centred entrance on both street-facing (z) walls

const paneProps = (axis) =>
  axis === "z"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function faceOf(x, z) {
  if (!inF(x, z - 1)) return { dir: "zn", axis: "z", s: x, len: W - 1, ix: 0, iz: 1 };
  if (!inF(x, z + 1)) return { dir: "zp", axis: "z", s: x, len: W - 1, ix: 0, iz: -1 };
  if (!inF(x - 1, z)) return { dir: "xn", axis: "x", s: z, len: D - 1, ix: 1, iz: 0 };
  return { dir: "xp", axis: "x", s: z, len: D - 1, ix: -1, iz: 0 };
}

for (const [x, z, gr, rf] of cells) {
  const ground = clamp(gr, 0, H - 1);
  const roof = Math.min(Math.max(rf, ground + 4), H - 2);
  const isPerim = perim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  if (!isPerim) {
    // Interior: floor slabs per storey, air between, flat roof deck.
    for (let y = ground; y <= roof - 2; y++) {
      const rel = y - base;
      if (rel >= 2 && rel % 2 === 0) put(x, y, z, "stone");
    }
    put(x, roof - 1, z, "light_gray_concrete");

    // Stair/mechanical bulkhead on the roof of the central cells.
    if (x >= 12 && x <= 14 && z >= 3 && z <= 6 && roof <= H - 3) {
      put(x, roof, z, "bricks");
      put(x, roof + 1, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter: street wall with storey rhythm.
  const f = faceOf(x, z);
  const maxS = f.len;
  // Pilasters every third bay, corners always solid.
  const windowed = (s) => s % 3 !== 0 && s !== 0 && s !== maxS;
  const streetFace = f.dir === "zn" || f.dir === "zp";

  for (let y = ground; y <= roof - 2; y++) {
    const rel = y - base;
    const isEntry = streetFace && x === ENTRY_X && (y === ground || y === ground + 1);

    if (isEntry) {
      const facing = f.dir === "zn" ? "north" : "south";
      const half = y === ground ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (rel === 0) {
      put(x, y, z, "stone_bricks"); // base course
      continue;
    }

    if (rel % 2 === 0) {
      // Limestone string course at each storey line.
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Window row (odd rel): glass in openings, brick at piers.
    if (windowed(f.s)) {
      put(x, y, z, "glass_pane", paneProps(f.axis));
      // Warm light behind some panes.
      const ix = x + f.ix, iz = z + f.iz;
      if (inF(ix, iz) && rel >= 3 && (x * 7 + y * 3) % 5 === 0) {
        put(ix, y, iz, "glowstone");
      }
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Cornice and parapet.
  if (roof - 1 >= ground) put(x, roof - 1, z, "smooth_stone");
  put(x, roof, z, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);

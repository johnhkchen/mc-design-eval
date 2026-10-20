import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw309237299";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 31, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => fp.has(key(x, z));

function put(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const missX = (x, z) => (!inFp(x + 1, z) ? 1 : 0) + (!inFp(x - 1, z) ? 1 : 0);
const missZ = (x, z) => (!inFp(x, z + 1) ? 1 : 0) + (!inFp(x, z - 1) ? 1 : 0);

// Long facades (missing z-neighbours) get piers on an even x rhythm;
// end caps (missing x-neighbours) get piers on a z rhythm. Corners always piers.
function isPier(x, z) {
  const mx = missX(x, z), mz = missZ(x, z);
  if (mx > 0 && mz > 0) return true;
  if (mz > 0) return x % 4 === 0;
  if (mx > 0) return z % 3 === 0;
  return false;
}

// Outward direction for a facade cell (for door facing).
function outward(x, z) {
  if (!inFp(x, z - 1)) return "north";
  if (!inFp(x, z + 1)) return "south";
  if (!inFp(x - 1, z)) return "west";
  return "east";
}

// Pick one entrance cell on a pier-free front facade, nearest to x = 15.
let doorCell = null;
for (const [x, z] of cells) {
  const edge = missX(x, z) + missZ(x, z) > 0;
  if (!edge || isPier(x, z)) continue;
  if (missZ(x, z) === 0) continue; // entrance on a long facade only
  if (!doorCell || Math.abs(x - 15) < Math.abs(doorCell[0] - 15)) doorCell = [x, z];
}
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

for (const [x, z, gr0] of cells) {
  const base = Math.min(Math.max(0, gr0), H - 12);
  const mx = missX(x, z), mz = missZ(x, z);
  const edge = mx + mz > 0;
  const pier = edge && isPier(x, z);

  // Foundation.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Plinth / ground slab.
  put(x, base, z, edge ? "polished_andesite" : "smooth_stone");

  // Ground storey: shopfront glass between piers.
  for (let k = 1; k <= 3; k++) {
    if (!edge) continue;
    put(x, base + k, z, pier ? "polished_andesite" : "glass");
  }
  // Ground-storey lintel band.
  if (edge) put(x, base + 4, z, "white_terracotta");

  // Entrance door.
  if (doorKey === key(x, z)) {
    const f = outward(x, z);
    put(x, base + 1, z, "dark_oak_door",
      { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, base + 2, z, "dark_oak_door",
      { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, base + 3, z, "glass");
    put(x, base + 4, z, "lantern", { hanging: "true" });
  }

  // Interior warm lanterns behind shopfront.
  if (!edge && x % 7 === 3 && z === 4) {
    put(x, base + 4, z, "lantern", { hanging: "true" });
  }

  // Storey slab at rel 5 (spandrel band on facade).
  put(x, base + 5, z, edge ? "white_terracotta" : "smooth_stone");

  // Upper storey: windows between piers, spandrel band at rel 9.
  for (let k = 6; k <= 8; k++) {
    if (!edge) continue;
    put(x, base + k, z, pier ? "white_concrete" : "glass");
  }
  if (edge) put(x, base + 9, z, "white_terracotta");

  // Warm glow behind some upper windows.
  if (!edge && x % 8 === 2 && (z === 1 || z === 8)) {
    put(x, base + 7, z, "glowstone");
  }

  // Roof slab and parapet.
  put(x, base + 10, z, edge ? "white_concrete" : "light_gray_concrete");

  // Rooftop plant units on the roof slab.
  if (!edge && x % 9 === 4 && z === 4) {
    put(x, base + 11, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);

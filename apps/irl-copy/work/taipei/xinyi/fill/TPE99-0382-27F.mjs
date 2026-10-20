import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE99-0382-27F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 83, H = 228, D = 87;
const ROOF = 216;            // flat roof level above lowest ground (lidar)
const TIER_B = 120;          // first setback
const TIER_C = 216;          // roof of main shaft
const CROWN_D = 12;          // crown inset from edge
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const N8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

// ground per cell (clamped below roof)
const gr = new Map();
for (const [x, z, h] of cells) gr.set(key(x, z), Math.max(0, Math.min(ROOF - 1, Math.round(h))));

// depth from the outside edge (edge cells = 1, then growing inwards)
const dep = new Map();
const q = [];
for (const [x, z] of cells) {
  if (N8.some(([a, b]) => !gr.has(key(x + a, z + b)))) {
    dep.set(key(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dep.get(key(x, z));
  for (const [a, b] of N8) {
    const kk = key(x + a, z + b);
    if (gr.has(kk) && !dep.has(kk)) {
      dep.set(kk, d + 1);
      q.push([x + a, z + b]);
    }
  }
}
const maxD = Math.max(...dep.values());
const depAt = (x, z) => dep.get(key(x, z)) ?? 0;

// mullion test that follows the face: on an x-facing wall the columns sit on
// z multiples of 4, on a z-facing wall they sit on x multiples of 4
function mullion(x, z, d) {
  const xf = depAt(x - 1, z) < d || depAt(x + 1, z) < d;
  const zf = depAt(x, z - 1) < d || depAt(x, z + 1) < d;
  if (xf || zf) return (xf && z % 4 === 0) || (zf && x % 4 === 0);
  return (x + z) % 4 === 0;     // diagonal step in the outline
}

// entrance on the south (lowest z) edge, near the centre, off a mullion line
const edge = cells.filter(([x, z]) => dep.get(key(x, z)) === 1);
const minZ = Math.min(...edge.map(c => c[1]));
const cands = edge.filter(c => c[1] === minZ);
cands.sort((a, b) => {
  const pa = mullion(a[0], a[1], 1) ? 1 : 0, pb = mullion(b[0], b[1], 1) ? 1 : 0;
  return pa - pb || Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2);
});
const doorKey = cands.length ? key(cands[0][0], cands[0][1]) : null;

function block(x, y, z, d, g0) {
  if (y < g0) return "stone_bricks";                       // foundation to ground

  if (y < TIER_C) {
    const minD = y < TIER_B ? 1 : 5;
    if (y === TIER_B && d < 5) return d === 1 ? "white_concrete" : "light_gray_concrete"; // terrace
    if (d < minD) return null;
    if (y % 5 === 0) return d === minD ? "white_concrete" : "light_gray_concrete";     // storey line
    if (d === minD) {
      const mull = mullion(x, z, d);
      if (y < 5) return mull ? "polished_granite" : "gray_stained_glass";              // shopfront
      if (y < 25) return mull ? "white_concrete" : "light_blue_stained_glass";         // podium
      return mull ? "white_concrete" : "cyan_stained_glass";                           // tower
    }
    if (y % 5 === 1 && d === minD + 1 && (x + z) % 9 === 0) return "glowstone";        // lit office
    return null;
  }

  // roof of the main shaft
  if (y === TIER_C) {
    if (d === 5) return "white_concrete";
    if (d > 5) return "light_gray_concrete";
    return null;
  }

  // crown
  if (d < CROWN_D) {
    if (y >= 223 && y <= 226) return d >= maxD - 1 ? "white_concrete" : null;   // spire
    if (y === 227) return d === maxD ? "sea_lantern" : null;
    return null;
  }
  if (y === 217) return d === CROWN_D ? "white_concrete" : "light_gray_concrete";
  if (y === 222) return "light_gray_concrete";
  if (y >= 218 && y <= 221) {
    if (d === CROWN_D) {
      return mullion(x, z, d) ? "white_concrete" : "cyan_stained_glass";
    }
    return y === 218 && (x + z) % 9 === 0 ? "glowstone" : null;
  }
  if (y >= 223 && y <= 226) return d >= maxD - 1 ? "white_concrete" : null;
  if (y === 227) return d === maxD ? "sea_lantern" : null;
  return null;
}

for (const [x, z] of cells) {
  const k = key(x, z);
  const g0 = gr.get(k);
  const d = dep.get(k);
  for (let y = 0; y < H; y++) {
    if (k === doorKey && (y === g0 || y === g0 + 1)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === g0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    const id = block(x, y, z, d, g0);
    if (id) g.set(x, y, z, id);
  }
}

g.save(`${DIR}/${ID}.nbt`);

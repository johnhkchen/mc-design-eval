import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87128";
const W = 17, H = 28, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const cmap = new Map();
for (const [x, z, gr, rf] of cells) {
  cmap.set(k(x, z), {
    ground: Math.max(0, Math.min(H - 8, Math.round(gr))),
    rf: Math.round(rf),
  });
}
const has = (x, z) => cmap.has(k(x, z));

// ---- one parapet tier for the whole block (median of lidar roofs, even) ----
const rfs = [...cmap.values()].map(c => c.rf).sort((a, b) => a - b);
const medRf = rfs[Math.floor(rfs.length / 2)];
const T0 = Math.min(20, 2 * Math.round(medRf / 2));

// ---- facade faces and depth from the edge (BFS) ----
function miss(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("N");
  if (!has(x, z + 1)) m.push("S");
  if (!has(x - 1, z)) m.push("W");
  if (!has(x + 1, z)) m.push("E");
  return m;
}
const depth = new Map();
const queue = [];
for (const key of cmap.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (miss(x, z).length > 0) { depth.set(key, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(k(x, z));
  for (const [a, b] of [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]]) {
    if (has(a, b) && !depth.has(k(a, b))) { depth.set(k(a, b), d + 1); queue.push([a, b]); }
  }
}
const isFacade = (x, z) => miss(x, z).length > 0;
const isDepth1 = (x, z) =>
  !isFacade(x, z) &&
  [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]].some(([a, b]) => has(a, b) && isFacade(a, b));

function paneProps(m) {
  const alongEW = m.includes("N") || m.includes("S");
  return {
    north: alongEW ? "false" : "true",
    south: alongEW ? "false" : "true",
    east: alongEW ? "true" : "false",
    west: alongEW ? "true" : "false",
    waterlogged: "false",
  };
}

// ---- massing: one tier, with a setback core where lidar rises above it ----
for (const [key, { ground, rf }] of cmap) {
  const [x, z] = key.split(",").map(Number);
  const m = miss(x, z);
  const facade = m.length > 0;
  const depth1 = isDepth1(x, z);
  const core = (depth.get(key) || 0) >= 3 && rf >= T0 + 3;
  const top = Math.min(27, Math.max(core ? T0 + 4 : T0, ground + 4));

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    const r = y - ground;
    const isCornice = y >= top - 2;

    if (facade) {
      if (isCornice) {
        g.set(x, y, z, y === top - 1 ? "smooth_stone" : "stone_bricks");
        continue;
      }
      if (r === 0) { g.set(x, y, z, "polished_granite"); continue; }

      if (m.includes("N") && x === Math.floor(W / 2) && (r === 1 || r === 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      const idxAlong = m.includes("N") || m.includes("S") ? x : z;
      const pilaster = m.length >= 2 || idxAlong % 3 === 0;
      if (pilaster) { g.set(x, y, z, "polished_andesite"); continue; }

      const shopfront = r === 1 || r === 2;
      if (shopfront || r % 2 === 1) {
        g.set(x, y, z, "glass_pane", paneProps(m));
      } else {
        g.set(x, y, z, "calcite");
      }
    } else {
      if (depth1 && r % 2 === 1 && r >= 1 && !isCornice) {
        if ((x * 7 + z * 3 + y) % 5 === 0 && r >= 3) g.set(x, y, z, "glowstone");
        continue;
      }
      if (y === top - 1) { g.set(x, y, z, "gray_concrete"); continue; }
      g.set(x, y, z, "smooth_stone");
    }
  }

  // sparse, low rooftop units on the main roof, kept off the parapet ring
  if (!facade && !core && (depth.get(key) || 0) >= 2 && (x * 3 + z) % 7 === 0 && top + 1 <= 27) {
    g.set(x, top, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);

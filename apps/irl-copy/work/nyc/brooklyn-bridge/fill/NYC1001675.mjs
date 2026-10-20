import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001675";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 30, D = 22;
const g = new Voxels([W, H, D]);

// ---- massing from lidar -------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { x, z, gr, roof });

const roofs = [...cellMap.values()].map(c => c.roof).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const T = 2 * Math.round(med / 2); // main roof level (even, storey-aligned)

// one shared base line so the granite plinth is continuous around the building
const maxGround = Math.max(...[...cellMap.values()].map(c => c.gr));
const BASE = maxGround + 3;

for (const c of cellMap.values()) {
  let t = Math.max(T - 2, Math.min(T, 2 * Math.round(c.roof / 2)));
  const core = c.x >= 7 && c.x <= 17 && c.z >= 6 && c.z <= 15;
  if (core && c.roof >= T - 1) t = T + 4; // central setback crown
  c.top = t;
}

const cellAt = (x, z) => cellMap.get(`${x},${z}`);

function faces(x, z, y) {
  const out = [];
  const chk = (dx, dz, name) => {
    const n = cellAt(x + dx, z + dz);
    if (!n || n.top < y) out.push(name);
  };
  chk(0, -1, "n");
  chk(0, 1, "s");
  chk(-1, 0, "w");
  chk(1, 0, "e");
  return out;
}

function isEdge(c) {
  const f = faces(c.x, c.z, c.top);
  return f.some(d => {
    const dx = d === "e" ? 1 : d === "w" ? -1 : 0;
    const dz = d === "s" ? 1 : d === "n" ? -1 : 0;
    const n = cellAt(c.x + dx, c.z + dz);
    return !n || n.top < c.top;
  });
}

// ---- wall material -------------------------------------------------------
function wallBlock(c, x, y, z, f) {
  const { gr, top } = c;
  const hasNS = f.includes("n") || f.includes("s");
  const hasEW = f.includes("w") || f.includes("e");

  // entrance bay on the north face (z = 0)
  if (f.includes("n") && z === 0 && x >= 10 && x <= 14) {
    if (y <= gr + 2) {
      if (x === 12 && y === gr) return { id: "dark_oak_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (x === 12 && y === gr + 1) return { id: "dark_oak_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
      return { id: "glass" };
    }
    if (y === gr + 3) return { id: "polished_granite" }; // lintel band over the entrance
  }

  // cornice band just under the roof
  if (y === top - 1) return { id: "chiseled_sandstone" };

  // continuous granite base course at one shared level
  if (y < BASE) return { id: "polished_granite" };

  const pier = (hasNS && x % 3 === 0) || (hasEW && z % 3 === 0) || (hasNS && hasEW);
  if (pier) {
    // pilaster capital just below the cornice
    if (y === top - 2) return { id: "smooth_sandstone_slab", props: { type: "top" } };
    return { id: "smooth_sandstone" };
  }

  // brick spandrels and glass window rows
  return y % 2 === 1 ? { id: "glass" } : { id: "bricks" };
}

// ---- build ---------------------------------------------------------------
for (const c of cellMap.values()) {
  const { x, z, gr, top } = c;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= top; y++) {
    const f = faces(x, z, y);

    if (y === top) {
      g.set(x, y, z, f.length ? "smooth_sandstone" : "smooth_stone");
      continue;
    }

    if (f.length === 0) {
      // interior: floor slab per storey, air elsewhere, warm lamps behind some windows
      if (y === gr || y % 2 === 0) {
        g.set(x, y, z, "smooth_stone");
      } else if (y > BASE && x % 3 === 1 && z % 3 === 1 && y < top - 2) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    const w = wallBlock(c, x, y, z, f);
    g.set(x, y, z, w.id, w.props);
  }

  if (isEdge(c)) g.set(x, top + 1, z, "smooth_sandstone");
}

// roof equipment on the main roof
for (const c of cellMap.values()) {
  if (c.top !== T) continue;
  if (c.x >= 3 && c.x <= 4 && c.z >= 3 && c.z <= 4 && !isEdge(c)) {
    g.set(c.x, T + 1, c.z, "stone_bricks");
    g.set(c.x, T + 2, c.z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);

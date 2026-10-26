import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC87264.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

// Museum/Library/Gallery, 1610 H St NW: early-20th-century Classical commercial block.
// Pale stone base, quartz walls, pilaster bays, glazed street level, cornice and parapet.
const W = 7, H = 30, D = 15;
const S = 3; // storey height in blocks

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const m = new Map();
for (const c of list) {
  const [x, z, ground, roof] = c;
  m.set(`${x},${z}`, { x, z, ground, roof });
}
const has = (x, z) => m.has(`${x},${z}`);

// Lowest ground under the footprint = y0 for this building.
const y0 = Math.min(...list.map((c) => c[2]));

// One flat roof tier: median of lidar roofs, but never below ~18 blocks above y0
// (the recorded roof height), so the massing reads at full height.
const roofs = list.map((c) => c[3]).sort((a, b) => a - b);
let T = roofs[Math.floor(roofs.length / 2)];
T = Math.max(T, y0 + 18);
T = Math.min(T, H - 2);

// Foundation, walls and storeys per cell
for (const c of list) {
  const [x, z, gr] = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks"); // solid foundation

  const Hc = T - gr;
  if (Hc < S) {
    put(x, T - 1, z, "smooth_stone");
    continue;
  }

  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const zFace = !nN || !nS;   // facade runs along x
  const xFace = !nW || !nE;   // facade runs along z
  const ext = zFace || xFace;
  const corner = zFace && xFace;
  const p = zFace && !corner ? x : (xFace && !corner ? z : 0);

  for (let r = 0; r < Hc; r++) {
    const y = gr + r;
    const k = Math.floor(r / S);
    const rel = r % S;

    if (!ext) {
      // interior: air, with a floor slab per storey and a roof deck on top
      if (r === Hc - 1 || rel === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    if (r === Hc - 1) {
      put(x, y, z, "smooth_quartz"); // cornice course
      continue;
    }
    if (rel === 0) {
      // storey line: base course at street level, string courses above
      put(x, y, z, k === 0 ? "stone_bricks" : "smooth_quartz");
      continue;
    }
    if (corner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    if (p % 2 === 0) {
      put(x, y, z, "quartz_pillar", { axis: "y" }); // pilaster bays
    } else {
      put(x, y, z, "glass_pane"); // window / shopfront glazing
    }
  }

  // cornice overhang and parapet on the exterior edge
  if (ext) {
    put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Main entrance on the street face (z=0) at x=3, with a stepped stoop inside the footprint
if (has(3, 0)) {
  const gr = m.get("3,0").ground;
  put(3, gr, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(3, gr + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(3, gr + 2, 0, "glass_pane"); // transom
  // flanking lantern-lit pilasters read as an entrance surround
  put(2, gr + 1, 0, "quartz_pillar", { axis: "y" });
  put(4, gr + 1, 0, "quartz_pillar", { axis: "y" });
}

// Warm light behind some windows, in the interior cell just inside the glass
for (const c of list) {
  const [x, z, gr] = c;
  const Hc = T - gr;
  if (Hc < S * 2) continue;
  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const zFace = !nN || !nS;
  const xFace = !nW || !nE;
  if (!(zFace || xFace) || (zFace && xFace)) continue;
  const p = zFace ? x : z;
  if (p % 4 !== 1) continue;
  let ix = x, iz = z;
  if (zFace) iz = !nN ? z + 1 : z - 1;
  else ix = !nW ? x + 1 : x - 1;
  if (!has(ix, iz)) continue;
  const inner = { nN: has(ix, iz - 1), nS: has(ix, iz + 1), nW: has(ix - 1, iz), nE: has(ix + 1, iz) };
  if (inner.nN && inner.nS && inner.nW && inner.nE) {
    for (let k = 1; gr + k * S + 1 < T - 2; k += 1) {
      put(ix, gr + k * S + 1, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/DC87264.nbt`);

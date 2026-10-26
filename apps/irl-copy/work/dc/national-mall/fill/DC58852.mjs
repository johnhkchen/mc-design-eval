import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC58852";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 28, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup
const inFp = new Set();
for (const c of cells) inFp.add(`${c[0]},${c[1]}`);
const has = (x, z) => inFp.has(`${x},${z}`);

// Building-wide levels: base B = highest ground, roof T = median lidar roof, flattened
const grounds = cells.map((c) => c[2]);
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const B = Math.max(...grounds);
let T = roofs[Math.floor(roofs.length / 2)];
T = Math.max(T, B + 6);
T = Math.min(T, H - 3);
const n = Math.floor((T - B - 1) / 3); // full storeys (3 blocks each)

// Outward faces of a cell
function faces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  return f;
}

const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: massing, foundations, facades
for (const [x, z, gnd] of cells) {
  // foundation to lidar ground, then podium up to common base level
  for (let y = 0; y < B; y++) {
    if (y < gnd || y < B) g.set(x, y, z, "stone_bricks");
  }

  const f = faces(x, z);
  const perim = f.length > 0;

  if (!perim) {
    // interior: floor slabs per storey and roof deck; air between (no interiors)
    for (let k = 0; k < n; k++) g.set(x, B + 3 * k, z, "smooth_stone");
    g.set(x, T - 1, z, "light_gray_concrete");
    continue;
  }

  const xFace = f.includes("w") || f.includes("e");
  const zFace = f.includes("n") || f.includes("s");
  const corner = xFace && zFace;
  const westEntry = f.includes("w") && !corner && x === 0 && z === 6;

  for (let y = B; y <= T - 1; y++) {
    let id = "bricks";
    let props;
    if (y === T - 1) {
      id = "smooth_stone"; // roof cornice / parapet cap
    } else if (y < B + 3 * n) {
      const r = (y - B) % 3;
      if (r === 0) {
        id = "smooth_stone"; // spandrel / sill band
      } else {
        const window = !corner && (xFace ? z % 2 === 1 : (x === 1 || x === 2));
        if (window) {
          id = "light_blue_stained_glass_pane";
          props = xFace ? PANE_X : PANE_Z;
        } else {
          id = "bricks";
        }
      }
    }

    // Entrance on the west face at z=6: two-high dark oak door
    if (westEntry && (y === B || y === B + 1)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "west",
        half: y === B ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }
}

// Pass 2: warm lights behind selected windows (glowstone in the air gap)
for (const [x, z] of cells) {
  const f = faces(x, z);
  const xFace = f.includes("w") || f.includes("e");
  const zFace = f.includes("n") || f.includes("s");
  if (!xFace || zFace) continue;
  if (z % 4 !== 1) continue;
  const ix = x === 0 ? 1 : 2;
  if (!has(ix, z) || faces(ix, z).length > 0) continue;
  for (let k = 1; k < n; k += 1) {
    if (k === 2 || k === 4) g.set(ix, B + 3 * k + 1, z, "glowstone");
  }
}

// Roof equipment: stands one block up on the interior roof deck (T-1), so it sits at y = T
for (const [x, z] of cells) {
  if (faces(x, z).length > 0) continue;
  if (x === 1 && z === 5) g.set(x, T, z, "iron_block");
  if (x === 2 && z === 9) g.set(x, T, z, "chain");
}

g.save(`${DIR}/${ID}.nbt`);

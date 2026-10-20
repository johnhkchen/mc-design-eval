import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC3001599.cells.json`, "utf8"));

const W = 5, H = 26, D = 18;
const g = new Voxels([W, H, D]);

// Collect known cells, then fill every footprint cell (x 0..4, z 0..17),
// taking missing ones from the nearest known neighbour so no gaps remain.
const known = new Map();
for (const c of cells) {
  const [x, z, gy, ry] = c;
  known.set(`${x},${z}`, { gy: Math.max(0, Math.round(gy)), ry: Math.round(ry) });
}

const grid = new Map();
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const k = `${x},${z}`;
    if (known.has(k)) { grid.set(k, known.get(k)); continue; }
    let best = null, bd = Infinity;
    for (const [kk, v] of known) {
      const [kx, kz] = kk.split(",").map(Number);
      const d = Math.abs(kx - x) + Math.abs(kz - z);
      if (d < bd) { bd = d; best = v; }
    }
    grid.set(k, best ? { ...best } : { gy: 0, ry: 14 });
  }
}

// One flat roof level for the whole building (median lidar roof), so the
// massing reads as a clean rowhouse parapet instead of stepped cells.
const roofs = [...grid.values()].map(v => v.ry).sort((a, b) => a - b);
const TOP = Math.min(H - 1, roofs[Math.floor(roofs.length / 2)]);

const isPerim = (x, z) => x === 0 || x === 4 || z === 0 || z === 17;
const isFacade = (x) => x === 0 || x === 4;

function isWindow(x, z, y) {
  if (!isFacade(x)) return false;
  if (z < 2 || z > 15) return false;
  if (!(z % 4 === 2 || z % 4 === 3)) return false;
  const { gy } = grid.get(`${x},${z}`);
  const rel = y - gy;
  if (rel < 1 || y >= TOP - 2) return false;
  return rel % 3 !== 0;
}

// Pass 1: foundation, shell, facade articulation, solid interior.
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const { gy: gy0 } = grid.get(`${x},${z}`);
    const gy = Math.min(gy0, TOP - 4);
    const perim = isPerim(x, z);

    for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

    for (let y = gy; y < TOP; y++) {
      const rel = y - gy;
      let b;
      if (rel === 0) b = "stone_bricks";                 // base course
      else if (y === TOP - 1) b = perim ? "stone_bricks" : "smooth_stone"; // parapet / roof deck
      else if (perim && y === TOP - 2) b = "smooth_stone"; // cornice band
      else if (perim && rel % 3 === 0) b = "smooth_stone"; // storey string course
      else if (perim) b = "bricks";
      else b = "stone";

      if (isWindow(x, z, y)) b = "glass";

      // Entrance on the east street facade at z=8.
      if (x === 4 && z === 8 && (rel === 1 || rel === 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "west",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      g.set(x, y, z, b);
    }
  }
}

// Pass 2: air gaps and warm lights behind each glazed opening.
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const { gy: gy0 } = grid.get(`${x},${z}`);
    const gy = Math.min(gy0, TOP - 4);
    for (let y = gy; y < TOP; y++) {
      if (!isWindow(x, z, y)) continue;
      const ix = x === 0 ? 1 : 3;
      const rel = y - gy;
      if ((z + rel) % 4 === 0) g.set(ix, y, z, "shroomlight");
      else g.set(ix, y, z, "air");
    }
  }
}

g.save(`${dir}/NYC3001599.nbt`);

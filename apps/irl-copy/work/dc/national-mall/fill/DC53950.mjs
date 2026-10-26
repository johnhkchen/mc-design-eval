import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53950.cells.json`, "utf8"));

const W = 36, H = 24, D = 34;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { gr, roof });
const has = (x, z) => map.has(key(x, z));

function faces(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

// Smoothed roof: median of lidar roof heights in a 5x5 window, then snapped to
// whole 3-block storeys so the massing reads as flat tiers and setbacks.
function smoothRoof(x, z) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++)
    for (let dx = -2; dx <= 2; dx++) {
      const c = map.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  return Math.round(med / 3) * 3;
}

// Smoothed ground: median over the same window, kept per cell for the plinth
function smoothGround(x, z) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = map.get(key(x + dx, z + dz));
      if (c) vals.push(c.gr);
    }
  vals.sort((a, b) => a - b);
  return Math.round(vals[Math.floor(vals.length / 2)]);
}

// Entrance: a north-facing (street-side) facade cell nearest the centre line
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (!faces(x, z).n) continue;
    const d = Math.abs(x - (W - 1) / 2);
    if (d < best) { best = d; entrance = key(x, z); }
  }
  if (!entrance) {
    for (const [x, z] of cells.map(c => [c[0], c[1]])) {
      if (!faces(x, z).s) continue;
      const d = Math.abs(x - (W - 1) / 2);
      if (d < best) { best = d; entrance = key(x, z); }
    }
  }
}

// Precompute per-cell massing so neighbours can be compared
const plan = new Map();
for (const [x, z, gr0] of cells) {
  const gr = smoothGround(x, z);
  let top = Math.min(H - 4, Math.max(gr + 3, smoothRoof(x, z)));
  plan.set(key(x, z), { gr, top });
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr, top } = plan.get(key(x, z));
  const f = faces(x, z);
  const fac = f.n || f.s || f.w || f.e;
  const along = (f.n || f.s) ? x : z;
  const isEntrance = entrance === key(x, z);

  // Plinth / foundation from y 0 up to the ground of this cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    if (!fac) {
      g.set(x, y, z, "brick");
      continue;
    }
    const rel = (y - gr) % 3;
    let b = "brick";

    if (y === gr) {
      b = "smooth_quartz";                       // base course
    } else if (rel === 0) {
      b = "smooth_quartz";                       // storey belt course
    } else if (y === top - 1) {
      b = "smooth_quartz";                       // cornice band
    } else if (along % 4 === 1 || along % 4 === 2) {
      b = ((along * 3 + y) % 7 === 0) ? "glowstone" : "glass";
    }

    if (isEntrance && y === gr + 1) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isEntrance && y === gr + 2) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    g.set(x, y, z, b);
  }

  if (fac) {
    g.set(x, top, z, "smooth_quartz");           // parapet cap
  } else {
    g.set(x, top - 1, z, "stone");               // roof deck
    // Roof plant only on the higher tiers, a few blocks apart
    if (top >= 9 && (x * 5 + z * 7) % 13 === 0 && top + 2 <= H - 1) {
      g.set(x, top, z, "smooth_stone");
      g.set(x, top + 1, z, "smooth_stone");
    }
  }
}

// Entrance surround: chiseled trim over the door, on the ground storey line
if (entrance) {
  const [ex, ez] = entrance.split(",").map(Number);
  const { gr } = plan.get(entrance);
  for (const dx of [-1, 0, 1]) {
    const nx = ex + dx;
    if (has(nx, ez) && (dx === 0 || faces(nx, ez).n)) {
      g.set(nx, gr + 3, ez, "chiseled_stone_bricks");
    }
  }
}

g.save(`${DIR}/DC53950.nbt`);

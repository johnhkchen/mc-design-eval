// 萬世大樓 (Wanshi Building), Xinyi. Lidar: roof about 69 blocks above the lowest ground.
// Reading: a late-1980s / early-1990s speculative office tower of about 13 storeys
// (5 blocks each). Cream ceramic-tile piers ("smooth_quartz") frame tinted-glass bands,
// with a grey spandrel course at each floor line. A stone-brick plinth and a shopfront
// ground floor carry a central entrance on the south face. A setback at storey 9 leaves
// a railed terrace, and a boxy mechanical penthouse with louvres and a lightning-rod
// mast crowns the roof.

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw294785355";
const W = 56, H = 81, D = 58;

const STOREY = 5;
const ROOF = 69;            // absolute roof slab level
const SETBACK_STOREYS = 9;  // setback sits above storey 9
const SETBACK_INSET = 4;    // upper tier is inset at least 4 blocks from the outer edge
const PENT_INSET = 8;       // penthouse inset from the outer edge
const PENT_ROOF = 75;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const DIRS = [
  { n: "n", dx: 0, dz: -1 },
  { n: "s", dx: 0, dz: 1 },
  { n: "e", dx: 1, dz: 0 },
  { n: "w", dx: -1, dz: 0 },
];
const INWARD = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] };

// ---- footprint, grounds, inset distance -------------------------------------
const cmap = new Map();
for (const [x, z, gr] of cells) {
  cmap.set(key(x, z), { x, z, gr: Math.round(gr), d: -1 });
}
const list = [...cmap.values()];

const queue = [];
for (const c of list) {
  if (DIRS.some(({ dx, dz }) => !cmap.has(key(c.x + dx, c.z + dz)))) {
    c.d = 0;
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const { dx, dz } of DIRS) {
    const nb = cmap.get(key(c.x + dx, c.z + dz));
    if (nb && nb.d < 0) {
      nb.d = c.d + 1;
      queue.push(nb);
    }
  }
}

const B = Math.min(...list.map((c) => c.gr));   // lowest ground, datum for storey lines
const S = B + STOREY * SETBACK_STOREYS;         // setback level (a storey line)

const inTier = (x, z, y) => {
  const c = cmap.get(key(x, z));
  if (!c) return false;
  if (y <= S) return true;
  return c.d >= SETBACK_INSET;
};
const inPent = (x, z) => {
  const c = cmap.get(key(x, z));
  return !!c && c.d >= PENT_INSET;
};
const exposures = (x, z, pred) =>
  DIRS.filter(({ dx, dz }) => !pred(x + dx, z + dz)).map((d) => d.n);

// Bay rule: piers at corners and every third bay along each facade.
const isPier = (exp, x, z) => {
  if (exp.length >= 2) return true;
  const bay = exp[0] === "n" || exp[0] === "s" ? x : z;
  return bay % 3 === 0;
};

const paneProps = (exp) => {
  const ns = exp.includes("n") || exp.includes("s");
  return ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};
const barProps = (exp) => ({
  north: exp.includes("n") ? "true" : "false",
  south: exp.includes("s") ? "true" : "false",
  east: exp.includes("e") ? "true" : "false",
  west: exp.includes("w") ? "true" : "false",
  waterlogged: "false",
});

// ---- foundations: solid from y 0 up to each cell's ground --------------------
for (const c of list) {
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "stone_bricks");
}

// ---- storeys, setback, facades ----------------------------------------------
for (const c of list) {
  if (c.gr >= ROOF) continue;
  for (let y = c.gr; y < ROOF; y++) {
    if (y > S && c.d < SETBACK_INSET) continue; // terrace area: nothing above S

    const pred = (a, b) => inTier(a, b, y);
    const exp = exposures(c.x, c.z, pred);
    const rel = (y - B) % STOREY;
    const isGroundBand = y - B < STOREY;

    // floor line: slab across the whole tier, quartz on the face
    if (rel === 0) {
      g.set(c.x, y, c.z, exp.length ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!exp.length) continue; // interior air

    const pier = isPier(exp, c.x, c.z);

    if (isGroundBand) {
      if (rel === 4) g.set(c.x, y, c.z, "stone_bricks");            // plinth course
      else if (pier) g.set(c.x, y, c.z, "smooth_quartz");           // shopfront piers
      else g.set(c.x, y, c.z, "cyan_stained_glass");                 // shopfront glass
      continue;
    }

    if (rel === 4) {
      g.set(c.x, y, c.z, "light_gray_concrete");                     // spandrel band
      continue;
    }
    if (pier) {
      g.set(c.x, y, c.z, "smooth_quartz");
      continue;
    }

    g.set(c.x, y, c.z, "cyan_stained_glass_pane", paneProps(exp));

    // warm light behind some windows: one glowstone in the room behind the glass
    if (rel === 2 && exp.length === 1 && (c.x * 7 + c.z * 13 + y * 5) % 9 === 0) {
      const [ix, iz] = INWARD[exp[0]].map((v, i) => (i === 0 ? c.x + v : c.z + v));
      if (inTier(ix, iz, y) && exposures(ix, iz, pred).length === 0) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// ---- terrace railing around the lower tier at S + 1 -------------------------
for (const c of list) {
  if (c.d !== 0) continue;
  const exp = exposures(c.x, c.z, (a, b) => inTier(a, b, 0));
  if (exp.length) g.set(c.x, S + 1, c.z, "iron_bars", barProps(exp));
}

// ---- main entrance on the south face, nearest the middle --------------------
const meanX = list.reduce((s, c) => s + c.x, 0) / list.length;
const doorCands = list
  .filter((c) => c.d === 0 && !cmap.has(key(c.x, c.z + 1)) && c.gr <= B + 1)
  .sort((a, b) => Math.abs(a.x - meanX) - Math.abs(b.x - meanX));
if (doorCands.length) {
  const door = doorCands[0];

  // stone surround: flanking bays and a lintel over the door, so the entrance reads
  for (const dxSide of [-1, 1]) {
    const side = cmap.get(key(door.x + dxSide, door.z));
    if (!side || side.gr > B + 1) continue;
    for (let y = B + 1; y <= B + 3; y++) g.set(side.x, y, side.z, "stone_bricks");
  }
  g.set(door.x, B + 3, door.z, "stone_bricks");                         // lintel
  g.set(door.x, B + 1, door.z - 1, "stone_bricks");                     // threshold step inside line

  const doorProps = (half) => ({
    facing: "south",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(door.x, B + 1, door.z, "dark_oak_door", doorProps("lower"));
  g.set(door.x, B + 2, door.z, "dark_oak_door", doorProps("upper"));

  // warm lantern in the lobby behind the transom
  g.set(door.x, B + 2, door.z - 1, "glowstone");
}

// ---- roof of the upper tier: slab, cornice parapet ---------------------------
const upperPred = (a, b) => {
  const c = cmap.get(key(a, b));
  return !!c && c.d >= SETBACK_INSET;
};
for (const c of list) {
  if (c.d < SETBACK_INSET) continue;
  g.set(c.x, ROOF, c.z, "light_gray_concrete");
  const exp = exposures(c.x, c.z, upperPred);
  if (exp.length) {
    g.set(c.x, ROOF + 1, c.z, "smooth_quartz");
    g.set(c.x, ROOF + 2, c.z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else if (c.d === 5 && c.x % 12 === 6 && c.z % 12 === 6) {
    // small roof plant units
    g.set(c.x, ROOF + 1, c.z, "gray_concrete");
    g.set(c.x, ROOF + 2, c.z, "gray_concrete");
  }
}

// ---- mechanical penthouse: solid base, louvred band, cap, roof slab ----------
const pentCells = list.filter((c) => inPent(c.x, c.z));
for (const c of pentCells) {
  const exp = exposures(c.x, c.z, inPent);
  for (let y = ROOF + 1; y < PENT_ROOF; y++) {
    if (!exp.length) continue;
    if (y === ROOF + 1 || y === PENT_ROOF - 1) {
      g.set(c.x, y, c.z, "smooth_quartz");
    } else {
      g.set(c.x, y, c.z, "iron_bars", barProps(exp));
    }
  }
  g.set(c.x, PENT_ROOF, c.z, "light_gray_concrete");
}

// ---- lightning-rod mast on the penthouse roof --------------------------------
if (pentCells.length) {
  const mx = pentCells.reduce((s, c) => s + c.x, 0) / pentCells.length;
  const mz = pentCells.reduce((s, c) => s + c.z, 0) / pentCells.length;
  const core = pentCells.reduce((best, c) =>
    Math.hypot(c.x - mx, c.z - mz) < Math.hypot(best.x - mx, best.z - mz) ? c : best
  );
  for (let y = PENT_ROOF + 1; y <= 79; y++) {
    g.set(core.x, y, core.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

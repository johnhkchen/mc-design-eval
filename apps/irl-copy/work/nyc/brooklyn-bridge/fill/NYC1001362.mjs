import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001362";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 34, D = 29;
const g = new Voxels([W, H, D]);

const k = (x, z) => x + "," + z;
const DIRS = [
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
];

// Footprint map: [x, z, ground, roof]
const cm = new Map();
for (const [x, z, gr, r] of cells) cm.set(k(x, z), { x, z, gr, r });

const outOf = (x, z) => DIRS.filter((d) => !cm.has(k(x + d.dx, z + d.dz)));
const isPerim = (x, z) => outOf(x, z).length > 0;

// One flat roof for the whole block: median of lidar roofs, quantised to 3-block tiers
const sortedR = [...cm.values()].map((c) => c.r).sort((a, b) => a - b);
const medR = sortedR[Math.floor(sortedR.length / 2)];
const TOP = Math.min(30, Math.max(12, Math.round(medR / 3) * 3));

// Shared storey datum: median ground
const sortedG = [...cm.values()].map((c) => c.gr).sort((a, b) => a - b);
const DATUM = sortedG[Math.floor(sortedG.length / 2)];

// Door at the middle of each street-facing run of at least 5 cells
const groups = {};
for (const c of cm.values()) {
  const o = outOf(c.x, c.z);
  if (o.length === 1) {
    const f = o[0].f;
    (groups[f] ??= []).push({ c, idx: o[0].dx !== 0 ? c.z : c.x });
  }
}
const doors = new Set();
for (const f of Object.keys(groups)) {
  const arr = groups[f].sort((a, b) => a.idx - b.idx);
  if (arr.length >= 5) {
    const m = arr[Math.floor(arr.length / 2)].c;
    doors.add(k(m.x, m.z));
  }
}

// Two chimneys on the roof (interior cells)
const CHIM = new Set([k(4, 9), k(8, 20)]);

const paneProps = (out) =>
  out.dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const c of cm.values()) {
  const { x, z, gr } = c;
  const top = TOP;
  const outs = outOf(x, z);
  const perim = outs.length > 0;

  // Foundation from y0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Upper storey floors align to the shared datum, every 3 blocks
  const floors = [gr];
  for (let f = DATUM + 4; f < top - 1; f += 3) {
    if (f >= gr + 4) floors.push(f);
  }

  if (!perim) {
    for (const f of floors) g.set(x, f, z, "smooth_stone");
    g.set(x, top, z, "smooth_stone");
    if (CHIM.has(k(x, z))) {
      for (const y of [top + 1, top + 2]) g.set(x, y, z, "bricks");
    }
    continue;
  }

  const corner = outs.length > 1;
  const out = outs[0];
  const along = out.dx !== 0 ? z : x;
  const isPier = corner || along % 3 === 0;
  const isDoor = doors.has(k(x, z));

  // Base course and brick wall up to the cornice
  g.set(x, gr, z, "stone_bricks");
  for (let y = gr + 1; y <= top - 1; y++) g.set(x, y, z, "bricks");

  // Stone string courses at each upper floor line
  for (const f of floors) {
    if (f > gr && f <= top - 1) g.set(x, f, z, "stone_bricks");
  }

  // Corbelled cornice band with a projecting slab course beneath the parapet
  g.set(x, top - 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, top - 1, z, along % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks");

  // Parapet and coping
  g.set(x, top, z, "bricks");
  g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Ground floor shopfront: dark cast-iron piers, glazed bays, transom fascia
  if (isDoor) {
    const dp = { facing: out.f, hinge: "left", open: "false", powered: "false" };
    g.set(x, gr + 1, z, "dark_oak_door", { ...dp, half: "lower" });
    g.set(x, gr + 2, z, "dark_oak_door", { ...dp, half: "upper" });
    g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else if (isPier) {
    g.set(x, gr + 1, z, "dark_oak_planks");
    g.set(x, gr + 2, z, "dark_oak_planks");
  } else {
    g.set(x, gr + 1, z, "glass_pane", paneProps(out));
    g.set(x, gr + 2, z, "glass_pane", paneProps(out));
  }
  if (!isDoor) g.set(x, gr + 3, z, "dark_oak_planks"); // fascia board

  // Upper storey windows: two-high glazing between string courses
  for (let i = 1; i < floors.length; i++) {
    const f = floors[i];
    if (f + 2 > top - 3) continue;
    if (isPier) continue;
    g.set(x, f + 1, z, "glass_pane", paneProps(out));
    g.set(x, f + 2, z, "glass_pane", paneProps(out));

    // Warm light behind some glass on alternate storeys
    if (i % 2 === 0 && along % 6 === 1) {
      const ix = x - out.dx, iz = z - out.dz;
      if (cm.has(k(ix, iz)) && !isPerim(ix, iz)) {
        g.set(ix, f + 1, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

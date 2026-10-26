import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// B.F. Saul Building, 925 15th St NW (Commercial-Office-Large), 12 x 6 footprint.
// 1970s-80s Washington office block: pale concrete shell with quartz pilasters,
// granite plinth, framed street entrance, ribbon-glazed storeys with spandrel bands,
// smooth parapet, and a rooftop mechanical penthouse. One clean roof tier.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86595.cells.json`, "utf8"));

const W = 12, D = 6, H = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;

// Ground per cell is kept (it follows the slope). Roof is flattened to one
// median tier so the lidar noise does not become stray stepped blocks.
const rawRoofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofTier = Math.min(rawRoofs[Math.floor(rawRoofs.length / 2)], H - 5);

const cm = new Map();
for (const [x, z, gr] of cells) {
  const G = Math.max(0, Math.round(gr));
  cm.set(key(x, z), { G, R: Math.max(roofTier, G + 4) });
}

const put = (x, y, z, id, st) => {
  if (y < 0 || y >= H) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const floorLinesOf = (G, R) => {
  const out = [];
  for (let f = G + 3; f < R - 1; f += 2) out.push(f);
  return out;
};

const isPerimeter = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCore = (x, z) => x >= 2 && x <= W - 3 && z >= 2 && z <= D - 3;

const DOOR_X = 5;

// Pass 1: foundations, structural core, interior floor slabs and roof decks.
for (const [k, { G, R }] of cm) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < G; y++) put(x, y, z, "polished_granite");

  if (isCore(x, z)) {
    for (let y = G; y <= R - 1; y++) put(x, y, z, "light_gray_concrete");
  } else if (!isPerimeter(x, z)) {
    for (const f of floorLinesOf(G, R)) put(x, f, z, "smooth_stone");
    put(x, R - 1, z, "smooth_stone");
  }
}

// Pass 2: perimeter envelope.
const glowSpots = [];

for (const [k, { G, R }] of cm) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerimeter(x, z)) continue;

  const isCorner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const along = (z === 0 || z === D - 1) ? x : z;
  const floors = floorLinesOf(G, R);
  const frontFace = z === 0;
  // Pilasters: every even along-index is a quartz pilaster, odd cells are glazed bays.
  const pilaster = along % 2 === 0;

  for (let y = G; y <= R; y++) {
    // Corners and parapet.
    if (isCorner && y <= R - 1) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === R) { put(x, y, z, "smooth_stone"); continue; }
    if (y === R - 1) { put(x, y, z, "smooth_stone"); continue; }

    // Entrance on the street (north) face: framed door with quartz jambs.
    if (frontFace && Math.abs(x - DOOR_X) <= 1 && y <= G + 2) {
      if (x === DOOR_X && (y === G || y === G + 1)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === G ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (x === DOOR_X && y === G + 2) { put(x, y, z, "smooth_quartz"); continue; }
      put(x, y, z, "smooth_quartz");
      continue;
    }

    // Spandrel band at each floor line.
    if (floors.includes(y)) { put(x, y, z, "white_concrete"); continue; }

    if (y === G) {
      // Shopfront: dark frames and glass bays.
      put(x, y, z, pilaster ? "dark_oak_log" : "light_blue_stained_glass");
      continue;
    }

    if (pilaster) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, "light_blue_stained_glass");
      glowSpots.push({ x, z, y, along, G, R });
    }
  }
}

// Pass 3: warm lights in the air gap behind some windows.
const inward = (x, z) => {
  if (z === 0) return [x, 1];
  if (z === D - 1) return [x, D - 2];
  if (x === 0) return [1, z];
  if (x === W - 1) return [W - 2, z];
  return null;
};
for (const s of glowSpots) {
  if ((s.along + s.y) % 4 !== 1) continue;
  const ib = inward(s.x, s.z);
  if (!ib) continue;
  const [ix, iz] = ib;
  const cin = cm.get(key(ix, iz));
  if (!cin) continue;
  if (s.y < cin.G || s.y >= cin.R - 1) continue;
  if (floorLinesOf(cin.G, cin.R).includes(s.y)) continue;
  put(ix, s.y, iz, "glowstone");
}

// Pass 4: rooftop mechanical penthouse on the core, standing on the roof tier.
for (let x = 4; x <= 7; x++) {
  for (let z = 2; z <= 3; z++) {
    const c = cm.get(key(x, z));
    if (!c) continue;
    put(x, c.R, z, "light_gray_concrete");
    if (x === 4 || x === 7 || z === 2 || z === 3) {
      put(x, c.R + 1, z, "smooth_quartz");
    } else {
      put(x, c.R + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/DC86595.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001593";
const W = 11, H = 23, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;

// ---- footprint and massing -------------------------------------------------
const raw = new Map();
for (const [x, z, gr, roof] of cells) {
  raw.set(k2(x, z), { gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => raw.has(k2(x, z));

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const OFF = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Smooth lidar noise: one flat roof tier for the whole building (median roof,
// rounded to even), never below the tallest ground + 6 blocks.
const roofs = [...raw.values()].map(c => c.roof).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const maxGr = Math.min(Math.max(...[...raw.values()].map(c => c.gr)), H - 7);
const TIER = Math.min(H, Math.max(maxGr + 6, 2 * Math.round(medRoof / 2)));

const meta = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  const out = DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz)).map(d => d[0]);
  const gr = Math.min(c.gr, H - 7);
  meta.set(k2(x, z), { x, z, gr, T: TIER, out, perim: out.length > 0, corner: out.length >= 2 });
}
const all = [...meta.values()];

// Street frontage: the perimeter face carrying the most non-corner cells.
const perimList = all.filter(m => m.perim && !m.corner);
const counts = { N: 0, S: 0, W: 0, E: 0 };
for (const m of perimList) counts[m.out[0]]++;
let streetDir = "N";
for (const d of ["S", "W", "E"]) if (counts[d] > counts[streetDir]) streetDir = d;

const streetCells = perimList.filter(m => m.out[0] === streetDir);
const alongOf = (m, f) => (f === "N" || f === "S" ? m.x : m.z);
const sortedAlong = streetCells.map(m => alongOf(m, streetDir)).sort((a, b) => a - b);
const doorAlong = sortedAlong.length ? sortedAlong[Math.floor(sortedAlong.length / 2)] : -1;

// ---- build -----------------------------------------------------------------
const wins = [];
const winSet = new Set();

for (const m of all) {
  const { x, z, gr, T } = m;

  // rock-faced foundation up to the ground under this cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const hMax = T - gr - 1; // cornice course, common roof tier
  const f = m.corner ? null : m.out[0];
  const isStreet = f !== null && f === streetDir;
  const along = f ? alongOf(m, f) : 0;
  const isDoor = isStreet && along === doorAlong;

  for (let h = 0; h <= hMax; h++) {
    const y = gr + h;

    // interior: floor slabs each storey, ceiling slab under the roof, air elsewhere
    if (!m.perim) {
      if (h === hMax) g.set(x, y, z, "blackstone");
      else if (h % 2 === 0 || h >= hMax - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // perimeter top: cornice, then parapet course
    if (h === hMax) { g.set(x, y, z, "cut_sandstone"); continue; }
    if (h === hMax - 1) { g.set(x, y, z, "brown_terracotta"); continue; }

    // ground course and shopfront bulkhead / door
    if (h === 0) {
      if (isStreet) {
        if (isDoor) {
          g.set(x, y, z, "dark_oak_door", {
            facing: FACING[f], half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, "dark_oak_planks");
        }
      } else {
        g.set(x, y, z, "stone_bricks");
      }
      continue;
    }

    // shop glass with door upper half on the street
    if (isStreet && h === 1) {
      if (isDoor) {
        g.set(x, y, z, "dark_oak_door", {
          facing: FACING[f], half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else {
        wins.push({ x, y, z, f, along, h });
        winSet.add(k3(x, y, z));
      }
      continue;
    }

    // sandstone string courses on even heights (sills and lintels)
    if (h % 2 === 0) { g.set(x, y, z, "cut_sandstone"); continue; }

    // odd heights: windows on alternate columns, brownstone piers between
    if (!m.corner && along % 2 === 1) {
      wins.push({ x, y, z, f, along, h });
      winSet.add(k3(x, y, z));
    } else {
      g.set(x, y, z, "brown_terracotta");
    }
  }
}

// glass panes, connected along the run of their wall
for (const w of wins) {
  const horiz = w.f === "N" || w.f === "S";
  g.set(w.x, w.y, w.z, "glass_pane", {
    north: horiz ? "false" : "true",
    south: horiz ? "false" : "true",
    east: horiz ? "true" : "false",
    west: horiz ? "true" : "false",
    waterlogged: "false",
  });
}

// warm light just inside some windows
for (const w of wins) {
  if ((w.along + w.h) % 3 !== 0) continue;
  const [dx, dz] = OFF[w.f];
  const ix = w.x + dx, iz = w.z + dz;
  const im = meta.get(k2(ix, iz));
  if (!im || im.perim) continue;
  if (w.y < im.gr || w.y >= im.T - 1) continue;
  g.set(ix, w.y, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);

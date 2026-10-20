import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1085953";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 334 Pearl Street, 1973: mid-century civic/institutional block.
// Light-grey precast concrete mass, white pier columns, tinted glass ribbons,
// stone base course, belt course and a parapet, a stone-framed entrance under a canopy.
const W = 12, H = 21, D = 22;
const g = new Voxels([W, H, D]);

const FOUND = "stone_bricks";
const WALL = "light_gray_concrete";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass";
const BAND = "smooth_stone";
const BASE = "polished_andesite";
const FRAME = "stone_bricks";
const PLANT = "light_gray_concrete";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;
const outwardDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const facingOf = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const G = clamp(Math.round(gr), 0, H - 6);
  const R = clamp(Math.round(rf), G + 2, H - 5);
  map.set(key(x, z), { x, z, G, R, b: [] });
}
const inFp = (x, z) => map.has(key(x, z));
const outsOf = (x, z) => outwardDirs.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const cellsArr = [...map.values()];

// Storey boundaries per cell (about 2.5 blocks per storey).
for (const c of cellsArr) {
  const h = c.R - c.G;
  const n = Math.max(1, Math.round(h / 2.5));
  c.n = n;
  for (let k = 0; k <= n; k++) c.b[k] = c.G + Math.round((k * h) / n);
}

// Entrance: north-facing perimeter cell nearest the middle of the frontage.
let door = null;
let best = Infinity;
for (const c of cellsArr) {
  const o = outsOf(c.x, c.z);
  if (o.length === 0) continue;
  const isNorth = o.some(([dx, dz]) => dx === 0 && dz === -1);
  const score = Math.abs(c.x - Math.floor(W / 2)) + (isNorth ? 0 : 100);
  if (score < best) { best = score; door = { x: c.x, z: c.z, G: c.G, o }; }
}

// Cells that get the entrance surround and canopy: door cell and its two neighbours
// along the same frontage.
const doorZone = new Set();
if (door) {
  const [dx, dz] = door.o[0];
  for (const s of [-1, 0, 1]) {
    const cx = dx !== 0 ? door.x : door.x + s;
    const cz = dx !== 0 ? door.z + s : door.z;
    doorZone.add(key(cx, cz));
  }
}

for (const c of cellsArr) {
  const { x, z, G, R, b, n } = c;
  const o = outsOf(x, z);
  const perim = o.length > 0;

  // Foundation from y 0 up to the lowest ground under this cell.
  for (let y = 0; y < G; y++) g.set(x, y, z, FOUND);

  for (let y = G; y < R; y++) {
    let k = 0;
    while (k < n - 1 && y >= b[k + 1]) k++;
    const sH = b[k + 1] - b[k];
    const rel = y - b[k];

    if (!perim) {
      // Interior: air, with a floor slab per storey and a roof deck.
      if (y === R - 1) g.set(x, y, z, PLANT);
      else if (rel === 0 && k > 0) g.set(x, y, z, BAND);
      continue;
    }

    // Perimeter: solid facade shell.
    if (y === R - 1) { g.set(x, y, z, BAND); continue; } // belt course at roof line

    const [dx, dz] = o[0];
    const idx = dx !== 0 ? z : x;
    const pier = o.length > 1 || idx % 3 === 0;
    const inDoorZone = doorZone.has(key(x, z)) && door && door.o[0][0] === dx && door.o[0][1] === dz;

    // Entrance: canopy row over the door zone at storey 1 line
    if (inDoorZone && k === 0 && rel === 2) { g.set(x, y, z, BAND); continue; }

    if (k === 0 && rel === 0) { g.set(x, y, z, BASE); continue; } // base course

    if (door && x === door.x && z === door.z && k === 0 && rel < 2) {
      const props = {
        facing: facingOf[`${o[0][0]},${o[0][1]}`] ?? "north",
        half: rel === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
      g.set(x, y, z, "oak_door", props);
      continue;
    }

    // Stone frame beside the entrance at ground level.
    if (inDoorZone && k === 0 && rel < 2) { g.set(x, y, z, FRAME); continue; }

    if (k > 0 && rel === 0) { g.set(x, y, z, BAND); continue; } // storey line

    const win = !pier && rel >= 1 && rel <= Math.max(1, sH - 2);
    if (win) {
      g.set(x, y, z, GLASS);
      // Warm light behind some panes, in the interior air gap.
      const lit = ((x * 5 + z * 3 + y * 7) % 11) === 0;
      if (lit) {
        const ix = x - dx, iz = z - dz;
        const ic = map.get(key(ix, iz));
        if (ic && outsOf(ix, iz).length === 0 && y >= ic.G && y < ic.R - 1 && !ic.b.includes(y)) {
          g.set(ix, y, iz, "glowstone");
        }
      }
      continue;
    }

    g.set(x, y, z, pier ? PIER : WALL);
  }

  // Parapet: a one-block-high coping on the perimeter roof edge.
  if (perim && R + 1 <= H - 1) {
    g.set(x, R, z, BAND);
  }

  // Single set-back mechanical penthouse at the centre of the roof.
  if (!perim && x >= 4 && x <= 7 && z >= 7 && z <= 14 && R + 2 <= H - 1) {
    g.set(x, R, z, PLANT);
    g.set(x, R + 1, z, PLANT);
  }
}

// Canopy over the entrance: a projecting band row set just above the door.
// (Kept inside the footprint so it stays attached to the facade.)

g.save(`${DIR}/${ID}.nbt`);

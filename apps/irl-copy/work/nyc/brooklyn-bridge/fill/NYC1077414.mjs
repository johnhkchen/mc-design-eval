import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1077414";
const W = 30, H = 46, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---------- helpers ----------
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};
const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, rf] of cells) info.set(key(x, z), { x, z, gr, rf });
const has = (x, z) => info.has(key(x, z));

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const FACING_IN = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" };

// ring distance from the outer edge (1 = exposed perimeter)
const dist = new Map();
const queue = [];
for (const c of info.values()) {
  const edge = DIRS.some(([dx, dz]) => !has(c.x + dx, c.z + dz));
  if (edge) { dist.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const nx = c.x + dx, nz = c.z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push(info.get(key(nx, nz)));
    }
  }
}

// ---------- per-cell massing: 4-block tiers, two setbacks ----------
const plan = new Map();
for (const c of info.values()) {
  const gBase = Math.min(Math.ceil(c.gr / 2) * 2, H - 12);
  let topY = Math.round(c.rf / 4) * 4;
  topY = Math.max(gBase + 8, Math.min(topY, H - 2));
  const d = dist.get(key(c.x, c.z)) ?? 99;
  if (d === 1 && topY >= gBase + 16) topY -= 4;          // first setback on the perimeter
  if (d === 1 && topY >= gBase + 24) topY -= 4;          // second setback, stepping the crown
  if (d === 2 && topY >= gBase + 28) topY -= 4;          // soften the inner ring too
  plan.set(key(c.x, c.z), { gBase, topY, d });
}

// ---------- entrance: a single-face perimeter cell nearest the centre of the street front ----------
let cx = 0, cz = 0, n = 0;
for (const c of info.values()) { cx += c.x; cz += c.z; n++; }
cx /= n; cz /= n;
let door = null;
{
  let best = Infinity;
  for (const c of info.values()) {
    const faces = DIRS.filter(([dx, dz]) => !has(c.x + dx, c.z + dz));
    if (faces.length !== 1) continue;
    const p = plan.get(key(c.x, c.z));
    if (p.topY < p.gBase + 8) continue;
    // prefer the south-facing (high z) and low-z faces that are visible in the street view
    const dd = Math.hypot(c.x - cx, c.z - cz) + (faces[0][1] === 1 ? 0 : 1.5);
    if (dd < best) { best = dd; door = { x: c.x, z: c.z, face: faces[0], gBase: p.gBase }; }
  }
}

// ---------- build ----------
for (const c of info.values()) {
  const { x, z } = c;
  const { gBase, topY, d } = plan.get(key(x, z));
  const facades = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const edge = facades.length > 0;
  const corner = facades.length > 1;
  const column = !edge && x % 4 === 0 && z % 4 === 0;

  // base course / foundation: rusticated stone up to the first floor
  for (let y = 0; y < gBase; y++) put(x, y, z, "stone_bricks");

  for (let y = gBase; y < topY; y++) {
    const rel = y - gBase;

    // ---- floor / string-course rows ----
    if (rel % 2 === 0) {
      if (door && door.x === x && door.z === z && y === gBase + 2) {
        const f = FACING_IN[`${-door.face[0]},${-door.face[1]}`];
        put(x, y, z, "oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      // cornice course just under the roof, stone on the perimeter
      if (edge && y === topY - 2) { put(x, y, z, "stone_bricks"); continue; }
      put(x, y, z, edge ? "smooth_stone" : "smooth_stone");
      continue;
    }

    // ---- window rows ----
    if (y === topY - 1) {
      // parapet on the perimeter; roof plant handled below
      if (edge) put(x, y, z, "stone_bricks");
      continue;
    }

    if (column) { put(x, y, z, "light_gray_concrete"); continue; }
    if (!edge) continue; // interior air behind glass

    // corner quoins: solid stone pier on every corner cell
    if (corner) { put(x, y, z, "stone_bricks"); continue; }

    const [dx, dz] = facades[0];
    const idx = dx !== 0 ? z : x;
    const pier = idx % 3 === 0;
    const ground = y === gBase + 1;

    // entrance: door opening, flanked by stone piers, stone lintel above
    if (door && door.x === x && door.z === z) {
      if (y === gBase + 1) {
        const f = FACING_IN[`${-dx},${-dz}`];
        put(x, y, z, "oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "stone_bricks");
      }
      continue;
    }

    // ground floor: piers stone, storefront glass
    if (pier) { put(x, y, z, ground ? "stone_bricks" : "bricks"); continue; }

    // upper floors: alternate spandrel detail so the facade isn't a flat brick sheet
    if (!ground && idx % 6 === 1) { put(x, y, z, "white_concrete"); continue; }

    const along = dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    put(x, y, z, "glass_pane", along);

    // warm light behind some windows
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz)) {
      const ip = plan.get(key(ix, iz));
      const interiorEdge = DIRS.some(([ex, ez]) => !has(ix + ex, iz + ez));
      const iColumn = !interiorEdge && ix % 4 === 0 && iz % 4 === 0;
      if (!interiorEdge && !iColumn && y < ip.topY - 1 && (x + z + y) % 5 === 0) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // ---- roof plant: one compact penthouse block per tier, not scattered noise ----
  if (!edge && d >= 4 && x % 6 === 3 && z % 6 === 3) {
    const { topY: t } = plan.get(key(x, z));
    if (t + 2 < H) {
      put(x, t - 1, z, "light_gray_concrete");
      put(x, t, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

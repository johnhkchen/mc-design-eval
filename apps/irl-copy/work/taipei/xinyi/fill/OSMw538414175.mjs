import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414175";
const W = 27, H = 23, D = 24;

// Low-rise Xinyi-era commercial block: two storeys over a shopfront ground floor,
// white-tiled concrete frame, tinted aluminium glazing, cornice and parapet.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const base = Math.min(...ground.values());     // lowest ground under the footprint
const TOP = base + 11;                          // parapet course; roof about 11 above lowest ground
if (TOP >= H) console.warn(`TOP ${TOP} exceeds canvas height ${H}`);

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const outFaces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pane connection state: a pane on a north/south-running face connects east-west, and vice versa.
const paneProps = (dx) =>
  dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Entrance: one door on the lowest-ground, non-corner cells of the preferred face.
let door = null;
for (const fn of ["south", "north", "east", "west"]) {
  const dir = DIRS.find((d) => d.n === fn);
  const cand = [];
  for (const [x, z, gr] of cells) {
    if (gr !== base) continue;
    const f = outFaces(x, z);
    if (f.length !== 1 || f[0].n !== fn) continue;
    cand.push({ x, z, u: dir.dx !== 0 ? z : x });
  }
  if (!cand.length) continue;
  cand.sort((a, b) => a.u - b.u);
  const med = cand[Math.floor(cand.length / 2)].u;
  const pref = cand.filter((c) => c.u % 4 === 2);
  const pool = pref.length ? pref : cand;
  const pick = pool.reduce((b, c) => (Math.abs(c.u - med) < Math.abs(b.u - med) ? c : b));
  door = { x: pick.x, z: pick.z, fn, u: pick.u };
  break;
}

// 1. Foundation, ground slab and floor slabs (only where the cell is above its foundation).
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  const floorAt = (y, id) => { if (y >= gr) put(x, y, z, id); };
  floorAt(base, "light_gray_concrete");
  floorAt(base + 5, "light_gray_concrete");
  floorAt(base + 10, "gray_concrete");   // roof deck
}

// 2. Perimeter walls: plinth, shopfront, two storeys of window bays, cornice, parapet.
for (const [x, z, gr] of cells) {
  const faces = outFaces(x, z);
  if (!faces.length) continue;
  if (gr >= TOP) continue;
  const isCorner = faces.length >= 2;

  for (const d of faces) {
    const u = d.dx !== 0 ? z : x;
    for (let y = gr; y <= TOP; y++) {
      const rel = y - base;
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; }     // base course at ground
      if (rel === 11) { put(x, y, z, "white_concrete"); continue; }  // parapet
      if (rel === 10) { put(x, y, z, "smooth_quartz"); continue; }   // cornice
      if (rel === 5) { put(x, y, z, "smooth_quartz"); continue; }    // storey line band

      const pillar = isCorner || u % 4 === 0;
      if (pillar) { put(x, y, z, "white_concrete"); continue; }

      // Door, canopy and shopfront / upper window bays
      if (door && door.x === x && door.z === z && door.fn === d.n) {
        if (rel === 1 || rel === 2) {
          put(x, y, z, "iron_door", {
            facing: d.n,
            half: rel === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
      }
      if (door && door.fn === d.n && rel === 3 && Math.abs(u - door.u) <= 1) {
        put(x, y, z, "dark_oak_planks");  // entrance canopy band
        continue;
      }

      if (rel >= 1 && rel <= 3) {
        // ground-floor shopfront glazing
        put(x, y, z, "glass_pane", paneProps(d.dx));
      } else if (rel === 4 || rel === 9 || rel === 6) {
        put(x, y, z, "light_gray_concrete");  // lintels and spandrels
      } else if (rel === 7 || rel === 8) {
        if (u % 4 === 3) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane", paneProps(d.dx));
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
  }
}

// 3. Warm light behind some upper-storey windows (interior air gap, not on the floor slabs).
for (const [x, z, gr] of cells) {
  if (gr >= TOP) continue;
  for (const d of outFaces(x, z)) {
    if (d.dx !== 0 && false) continue;
    const u = d.dx !== 0 ? z : x;
    const ix = x - d.dx, iz = z - d.dz;
    if (!has(ix, iz) || isEdgeCell(ix, iz)) continue;
    for (const rel of [2, 7]) {
      if (u % 4 === 3 || u % 4 === 0) continue;
      if ((u + rel) % 3 !== 0) continue;
      const y = base + rel;
      if (y < gOf(ix, iz) || y < gr) continue;
      put(ix, y, iz, "glowstone");
    }
  }
}

function isEdgeCell(x, z) {
  return outFaces(x, z).length > 0;
}

// 4. Roof: plant boxes and mechanical plant on the interior roof deck.
for (const [x, z, gr] of cells) {
  if (outFaces(x, z).length) continue;
  if (gr > base + 10) continue;
  const inset = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => has(x + a, z + b));
  if (!inset) continue;
  if ((x * 5 + z * 3) % 13 === 0) put(x, base + 11, z, "light_gray_concrete");
  else if ((x * 7 + z * 11) % 17 === 0) put(x, base + 11, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);

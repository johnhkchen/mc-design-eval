import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district mid-rise mixed-use block, c. 1990s: white tiled concrete frame,
// light-grey bands and cornice, blue-tinted glazing in 2-wide bays on 5-block storeys,
// stone-clad ground storey with a central entrance, and a rooftop plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109957";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 32, H = 43, D = 58;
const ROOF = 30;      // roof deck / cornice line
const PARAPET = 31;   // top of parapet (about 31 blocks above lowest ground)
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_andesite";
const FOUND = "stone";
const SLAB = "smooth_quartz";

const g = new Voxels([W, H, D]);

// footprint map: "x,z" -> ground y (clamped to a sane range)
const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}

const has = (x, z) => gmap.has(`${x},${z}`);

// outward-facing sides of a footprint cell (cells with a missing neighbour)
function exposed(x, z) {
  const out = [];
  if (!has(x - 1, z)) out.push("W");
  if (!has(x + 1, z)) out.push("E");
  if (!has(x, z - 1)) out.push("N");
  if (!has(x, z + 1)) out.push("S");
  return out;
}

const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// ---- pass 1: foundations, shell, floors, facade ----
for (const [key, gc] of gmap) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z);
  const per = ex.length > 0;

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, FOUND);

  // roof deck (cornice on the perimeter) and parapet
  g.set(x, ROOF, z, BAND);
  if (per) g.set(x, PARAPET, z, WALL);

  for (let y = gc; y < ROOF; y++) {
    if (!per) {
      // interior: floor slab per storey, air elsewhere (no interiors)
      if (y > 0 && y % 5 === 0) g.set(x, y, z, SLAB);
      continue;
    }

    const face = ex[0];
    const u = face === "W" || face === "E" ? z : x; // coordinate along the face

    if (y % 5 === 0) { g.set(x, y, z, BAND); continue; }   // storey line
    if (y % 5 === 4) { g.set(x, y, z, WALL); continue; }   // spandrel

    const bay = u % 4 === 1 || u % 4 === 2;                // 2-wide glazed bays

    if (y < 5) {
      // ground storey: stone base with shopfront glazing
      g.set(x, y, z, bay ? GLASS : BASE);
      continue;
    }

    if (bay) {
      g.set(x, y, z, GLASS);
      // warm light behind some panes, in the air gap inside the shell
      if (y % 5 === 2 && hash(x, y, z) % 3 === 0) {
        const [dx, dz] = INWARD[face];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && exposed(ix, iz).length === 0 && gmap.get(`${ix},${iz}`) <= y) {
          g.set(ix, y, iz, hash(x, y, z) % 2 ? "glowstone" : "shroomlight");
        }
      }
    } else {
      g.set(x, y, z, WALL);
    }
  }
}

// ---- pass 2: entrance on the ground storey ----
{
  const cands = [];
  for (const [key, gc] of gmap) {
    if (gc > 3) continue;
    const [x, z] = key.split(",").map(Number);
    const ex = exposed(x, z);
    if (ex.length) cands.push({ x, z, gc, face: ex.includes("N") ? "N" : ex.includes("S") ? "S" : ex[0] });
  }
  if (cands.length) {
    // prefer the north/south frontage, then the middle of that face
    const pref = cands.filter((c) => c.face === "N" || c.face === "S");
    const pool = pref.length ? pref : cands;
    const xs = pool.map((c) => c.x).sort((a, b) => a - b);
    const mid = xs[Math.floor(xs.length / 2)];
    const e = pool.reduce((best, c) => (Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best));
    const props = { facing: FACING[e.face], hinge: "left", open: "false", powered: "false" };
    g.set(e.x, e.gc, e.z, "dark_oak_door", { ...props, half: "lower" });
    g.set(e.x, e.gc + 1, e.z, "dark_oak_door", { ...props, half: "upper" });
  }
}

// ---- pass 3: rooftop plant room (louvred, on footprint cells only) ----
{
  const x0 = 8, x1 = W - 9, z0 = 14, z1 = D - 15;
  let ok = true;
  for (let x = x0; x <= x1 && ok; x++)
    for (let z = z0; z <= z1; z++) if (!has(x, z)) { ok = false; break; }
  if (ok) {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const rim = x === x0 || x === x1 || z === z0 || z === z1;
        for (let y = PARAPET + 1; y <= 33; y++) {
          if (rim && y === 32 && (x + z) % 2 === 0) g.set(x, y, z, "iron_bars");
          else g.set(x, y, z, BAND);
        }
        g.set(x, 34, z, BAND); // cap
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

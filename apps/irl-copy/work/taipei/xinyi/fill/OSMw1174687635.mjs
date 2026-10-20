import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no entry for this building. Read as a late-1980s/1990s Xinyi office block:
// five storeys of white concrete bays with blue glass, a granite plinth with a shopfront,
// a quartz cornice, a parapet, a central roof plant room and a mast. Roof about 29 blocks.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174687635";
const W = 33, H = 41, D = 13;
const ROOF = 25;   // roof deck (slab) level
const TOP = 28;    // cap of parapet
const MAST_TOP = 29;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : (raw.cells || [])).map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: c[2] }
    : { x: c.x, z: c.z, g: c.ground ?? c.g ?? c.y ?? 0 }
);
if (list.length === 0) throw new Error("no footprint cells");

const key = (x, z) => `${x},${z}`;
const minG = Math.min(...list.map((c) => c.g));
const ground = new Map();
for (const c of list) {
  ground.set(key(c.x, c.z), Math.max(0, Math.round(c.g - minG)));
}

function infoOf(x, z) {
  const n = !ground.has(key(x, z - 1));
  const s = !ground.has(key(x, z + 1));
  const w = !ground.has(key(x - 1, z));
  const e = !ground.has(key(x + 1, z));
  if (!n && !s && !w && !e) return { kind: "in" };
  if ((n || s) && (w || e)) return { kind: "corner" };
  if (n) return { kind: "wall", out: "north", inX: 0, inZ: 1, p: x };
  if (s) return { kind: "wall", out: "south", inX: 0, inZ: -1, p: x };
  if (w) return { kind: "wall", out: "west", inX: 1, inZ: 0, p: z };
  return { kind: "wall", out: "east", inX: -1, inZ: 0, p: z };
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrances: one door on each long face, nearest the centre bay, on a low cell.
const doors = new Map();
for (const dir of ["north", "south"]) {
  let best = null;
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    const info = infoOf(x, z);
    if (info.kind !== "wall" || info.out !== dir) continue;
    if (info.p % 3 === 0 || gr > 2) continue;
    const d = Math.abs(info.p - 16);
    if (!best || d < best.d) best = { d, k, gr };
  }
  if (best) doors.set(best.k, { facing: dir, bottom: best.gr + 1 });
}

const plant = (x, z) => x >= 13 && x <= 19 && z >= 4 && z <= 8;

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const info = infoOf(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const isSlabLevel = (y) => y === gr || (y % 5 === 0 && y > gr);

  if (info.kind === "in") {
    // Interior: floor slabs only, no air-filled rooms are built.
    for (let y = gr; y <= ROOF; y++) {
      if (isSlabLevel(y)) put(x, y, z, "smooth_stone");
    }
    if (plant(x, z)) {
      put(x, 26, z, "light_gray_concrete");
      put(x, 27, z, "light_gray_concrete");
      if (x === 16 && z === 6) {
        put(x, 28, z, "lightning_rod");
        put(x, MAST_TOP, z, "lightning_rod");
      }
    }
    continue;
  }

  // Shell cells.
  const pil = info.kind === "corner" || (info.kind === "wall" && info.p % 3 === 0);
  const door = info.kind === "wall" ? doors.get(k) : undefined;

  for (let y = gr; y <= TOP; y++) {
    if (y === gr) {
      put(x, y, z, "polished_granite");
      continue;
    }
    if (y <= 24) {
      const s = Math.floor(y / 5);
      const r = y % 5;

      if (door && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: door.facing,
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      if (pil) {
        put(x, y, z, "white_concrete");
        continue;
      }

      if (s === 0) {
        put(x, y, z, y === 4 ? "white_concrete" : "glass");
        continue;
      }

      if (r === 0) put(x, y, z, "light_gray_concrete");
      else if (r === 4) put(x, y, z, "white_concrete");
      else {
        put(x, y, z, "light_blue_stained_glass");
        // Warm light standing on the interior floor behind selected upper windows.
        if (r === 2 && info.kind === "wall" && (info.p + s) % 4 === 0) {
          const ix = x + info.inX, iz = z + info.inZ;
          const ik = key(ix, iz);
          if (ground.has(ik)) {
            const gi = ground.get(ik);
            const ii = infoOf(ix, iz);
            if (ii.kind === "in" && 5 * s >= gi) {
              put(ix, 5 * s + 1, iz, "glowstone");
            }
          }
        }
      }
      continue;
    }
    if (y === ROOF) {
      put(x, y, z, "smooth_quartz");       // cornice
      continue;
    }
    if (y <= 27) {
      put(x, y, z, "white_concrete");      // parapet
      continue;
    }
    put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" }); // parapet cap
  }
}

g.save(`${DIR}/${ID}.nbt`);

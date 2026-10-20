import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-century commercial block: four storeys of 5 blocks, white tiled
// concrete piers, glass-pane window bands, stone base, cornice, parapet, rooftop
// penthouse and mechanical units. Shell only; interiors are air with floor slabs.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280215";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 33, D = 19;
const TOP = 20;      // roof slab level (top of cornice band)
const PARAPET = 21;  // parapet course on the perimeter

const g = new Voxels([W, H, D]);

const gmap = new Map();
const key = (x, z) => `${x},${z}`;
const parse = (s) => s.split(",").map(Number);
for (const c of cells) {
  gmap.set(key(c[0], c[1]), Math.max(0, Math.min(TOP - 1, Math.round(c[2]))));
}
const has = (x, z) => gmap.has(key(x, z));
const isPerim = (x, z) => !(has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// glass pane connection states; runsX = pane lies along the x axis (on a north/south face)
const pane = (runsX) => runsX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundations, interior floor slabs
for (const [key_, gr] of gmap) {
  const [x, z] = parse(key_);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (!isPerim(x, z)) {
    const levels = new Set([gr, 5, 10, 15, TOP]);
    for (const y of levels) if (y >= gr && y <= TOP) put(x, y, z, "smooth_stone");
  }
}

// 2. Perimeter facade
for (const [key_, gr] of gmap) {
  const [x, z] = parse(key_);
  if (!isPerim(x, z)) continue;

  const faces = [];
  if (!has(x, z - 1)) faces.push({ side: "n", p: x, runsX: true, inX: 0, inZ: 1 });
  if (!has(x, z + 1)) faces.push({ side: "s", p: x, runsX: true, inX: 0, inZ: -1 });
  if (!has(x - 1, z)) faces.push({ side: "w", p: z, runsX: false, inX: 1, inZ: 0 });
  if (!has(x + 1, z)) faces.push({ side: "e", p: z, runsX: false, inX: -1, inZ: 0 });

  const corner = faces.some((f) => f.side === "n" || f.side === "s")
    && faces.some((f) => f.side === "w" || f.side === "e");
  const f = faces[0];
  const windowCol = !corner && f && (f.p % 3) !== 0;
  const glowCol = windowCol && (f.p % 6) === 1;
  const inX = x + (f ? f.inX : 0);
  const inZ = z + (f ? f.inZ : 0);
  const glowSpot = glowCol && has(inX, inZ) && !isPerim(inX, inZ);

  for (let y = gr; y <= TOP; y++) {
    const s = y < 5 ? 0 : Math.floor(y / 5);
    const loc = y - 5 * s;

    if (y === gr) {
      put(x, y, z, s === 0 ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (loc === 0) {
      put(x, y, z, s === 0 ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (loc === 4) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (windowCol && loc >= 1 && loc <= 3) {
      put(x, y, z, "glass_pane", pane(f.runsX));
      if (glowSpot && loc === 2 && s >= 1 && y < TOP) {
        put(inX, y, inZ, "glowstone");
      }
      continue;
    }
    put(x, y, z, "white_concrete");
  }

  // parapet course
  put(x, PARAPET, z, "white_concrete");
}

// 3. Rooftop penthouse, centred, on interior cells only
const xs = [...gmap.keys()].map((k_) => parse(k_)[0]);
const zs = [...gmap.keys()].map((k_) => parse(k_)[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);

let pen = null;
outer:
for (let hx = 5; hx >= 2; hx--) {
  for (let hz = 4; hz >= 2; hz--) {
    let ok = true;
    for (let x = cx - hx; x <= cx + hx && ok; x++) {
      for (let z = cz - hz; z <= cz + hz && ok; z++) {
        if (!has(x, z) || isPerim(x, z)) ok = false;
      }
    }
    if (ok) { pen = { hx, hz }; break outer; }
  }
}

if (pen) {
  const { hx, hz } = pen;
  for (let x = cx - hx; x <= cx + hx; x++) {
    for (let z = cz - hz; z <= cz + hz; z++) {
      const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
      const edgeX = dx === hx, edgeZ = dz === hz;
      for (const y of [21, 22]) {
        if (edgeX && edgeZ) put(x, y, z, "white_concrete");
        else if (edgeX || edgeZ) {
          if ((x + z) % 3 !== 0) put(x, y, z, "glass_pane", pane(edgeZ));
          else put(x, y, z, "white_concrete");
        }
      }
      put(x, 23, z, "light_gray_concrete");
    }
  }
}

// 4. Roof mechanical units on the open roof
for (const [key_] of gmap) {
  const [x, z] = parse(key_);
  if (isPerim(x, z)) continue;
  if (pen && Math.abs(x - cx) <= pen.hx && Math.abs(z - cz) <= pen.hz) continue;
  if (((x * 7 + z * 3) % 9) === 0) put(x, 21, z, "smooth_stone");
}

// 5. Entrance on the north face, nearest the middle of that face
const northCells = [...gmap.keys()].map(parse).filter(([x, z]) => !has(x, z - 1));
if (northCells.length) {
  const meanX = northCells.reduce((a, [x]) => a + x, 0) / northCells.length;
  const [dx, dz] = northCells.reduce((best, c) =>
    Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best);
  const gr = gmap.get(key(dx, dz));
  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr, dz, "dark_oak_door", doorProps("lower"));
  put(dx, gr + 1, dz, "dark_oak_door", doorProps("upper"));
}

g.save(`${DIR}/${ID}.nbt`);

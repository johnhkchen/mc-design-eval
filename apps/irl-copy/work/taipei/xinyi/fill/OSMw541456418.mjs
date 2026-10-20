import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block: two storeys over a tiled base, white-concrete
// facades with grey frames, glass-pane bays, a red awning band on the street
// (north) face, a light parapet, and a small roof-access box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456418";
const W = 18, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

function put(x, y, z, name, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// ---- footprint lookup ----
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const L = Math.min(...cells.map((c) => c[2]));
const deckBase = L + 9;          // roof deck; parapet sits at L+10 (about 11 blocks)

// outward normals in priority order
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

function faceOf(x, z) {
  for (const d of DIRS) {
    if (!has(x + d.dx, z + d.dz)) return d;
  }
  return null;
}

// along-face coordinate and per-face extents
const faceCells = cells.map(([x, z, gr]) => {
  const f = faceOf(x, z);
  const u = f ? (f.dz !== 0 ? x : z) : null;
  return { x, z, gr, f, u };
});
const extent = {};
for (const c of faceCells) {
  if (!c.f) continue;
  const e = extent[c.f.name] ??= { min: Infinity, max: -Infinity };
  e.min = Math.min(e.min, c.u);
  e.max = Math.max(e.max, c.u);
}
const frontName = extent.north ? "north" : (faceCells.find((c) => c.f)?.f.name ?? null);
let doorU = null;
if (frontName) {
  const ext = extent[frontName];
  const mid = Math.round((ext.min + ext.max) / 2);
  const us = faceCells.filter((c) => c.f && c.f.name === frontName).map((c) => c.u);
  doorU = us.reduce((best, u) => (Math.abs(u - mid) < Math.abs(best - mid) ? u : best), us[0]);
}

const windowProps = (f) =>
  f.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- build per cell ----
for (const { x, z, gr, f, u } of faceCells) {
  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const deckY = Math.max(deckBase, gr);

  for (let y = gr; y < deckY; y++) {
    const k = y - gr;

    if (!f) {
      // interior: only floor slabs, air between
      if (k === 0 || k === 5) put(x, y, z, "smooth_stone");
      continue;
    }

    const isFront = f.name === frontName;
    const b = u - extent[f.name].min;          // bay index along the face
    const pillar = b % 3 === 0;
    const isDoor = isFront && u === doorU;

    if (k === 0) { put(x, y, z, "polished_andesite"); continue; }

    if (k === 1 || k === 2) {
      if (isDoor) {
        put(x, y, z, "oak_door", {
          facing: f.name, half: k === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else if (pillar) {
        put(x, y, z, "gray_concrete");
      } else {
        put(x, y, z, "glass_pane", windowProps(f));
      }
      continue;
    }

    if (k === 3) { put(x, y, z, isFront ? "red_wool" : "light_gray_concrete"); continue; }
    if (k === 4) { put(x, y, z, "light_gray_concrete"); continue; }
    if (k === 5) { put(x, y, z, "white_concrete"); continue; }

    if (k === 6 || k === 7) {
      if (pillar) put(x, y, z, "gray_concrete");
      else put(x, y, z, "glass_pane", windowProps(f));
      continue;
    }

    if (k === 8) { put(x, y, z, "light_gray_concrete"); continue; }
  }

  // roof deck and parapet
  put(x, deckY, z, "smooth_stone");
  if (f) put(x, deckY + 1, z, "light_gray_concrete");
}

// ---- warm light behind some glass (glowstone in the air gap) ----
for (const { x, z, gr, f, u } of faceCells) {
  if (!f) continue;
  const isFront = f.name === frontName;
  const b = u - extent[f.name].min;
  for (const k of [1, 6]) {
    if (b % 3 !== 1) continue;
    if (isFront && u === doorU && k === 1) continue;
    const ix = x - f.dx, iz = z - f.dz;
    if (!has(ix, iz)) continue;
    // inward cell must be interior (all four neighbours in footprint) and share the ground
    const interior = DIRS.every((d) => has(ix + d.dx, iz + d.dz));
    if (!interior || ground.get(`${ix},${iz}`) !== gr) continue;
    put(ix, gr + k, iz, "glowstone");
  }
}

// ---- roof-access box near the centre ----
{
  const interiors = faceCells.filter((c) => !c.f);
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let best = null, bestD = Infinity;
  for (const c of interiors) {
    const d = (c.x - cx) ** 2 + (c.z - cz) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  if (best) {
    const top = Math.max(deckBase, best.gr);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const x = best.x + dx, z = best.z + dz;
        if (!has(x, z)) continue;
        for (let y = top + 1; y <= top + 2; y++) put(x, y, z, "white_concrete");
        put(x, top + 3, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

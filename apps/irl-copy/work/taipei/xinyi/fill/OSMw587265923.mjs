import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 15 x 17, roof ~21 blocks above lowest ground.
// Read as a 4-storey mid-century / 1980s Taipei commercial block: pale quartz
// tile facade, storey lines, ground-floor shopfront, glass grid, plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265923";
const W = 15, H = 33, D = 17;
const ROOF = 20;   // roof deck layer and cornice line
const TOP = 21;    // parapet top (roof reads ~21 above lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// Classify a footprint cell: outer corner, z-facing wall (north/south face),
// x-facing wall (east/west face), or interior (null).
function faceOf(x, z) {
  const mz = !has(x, z - 1) || !has(x, z + 1);
  const mx = !has(x - 1, z) || !has(x + 1, z);
  if (mz && mx) return { type: "corner" };
  if (mz) return { type: "z", t: x, out: !has(x, z - 1) ? "north" : "south" };
  if (mx) return { type: "x", t: z, out: !has(x - 1, z) ? "west" : "east" };
  return null;
}

// Glass pane connections run along the wall plane.
function glassProps(f) {
  return f.type === "z"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Per-block spec for a perimeter wall cell at absolute height y.
function wallSpec(f, y, gr) {
  if (y === gr) return { id: "polished_andesite" };          // base course
  if (y >= TOP) return { id: "smooth_quartz" };               // parapet
  if (y === ROOF) return { id: "chiseled_quartz_block" };     // cornice line
  const rel = y % 5;
  const k = Math.floor(y / 5);
  if (rel === 0) return { id: "chiseled_quartz_block" };      // storey line
  if (rel === 4) return { id: "smooth_quartz" };              // spandrel
  if (f.type === "corner") return { id: "smooth_quartz" };
  if (k === 0) {
    if (f.t % 4 === 0) return { id: "polished_andesite" };    // shopfront piers
    return { id: "light_blue_stained_glass_pane", props: glassProps(f) };
  }
  if (f.t % 2 === 1) return { id: "light_blue_stained_glass_pane", props: glassProps(f) };
  return { id: "smooth_quartz" };                             // mullion pier
}

// 1. Footprint: foundation, walls, interior floor slabs and roof deck.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation
  const f = faceOf(x, z);
  if (!f) {
    for (const y of new Set([gr, 0, 5, 10, 15, ROOF])) {
      if (y >= gr && y <= ROOF) put(x, y, z, y === ROOF ? "gray_concrete" : "smooth_quartz");
    }
    continue;
  }
  for (let y = gr; y <= TOP; y++) {
    const s = wallSpec(f, y, gr);
    if (s) put(x, y, z, s.id, s.props);
  }
}

// 2. Entrance on the south face, near the facade's centre line.
const cand = cells.filter(([x, z]) => {
  const f = faceOf(x, z);
  return f && f.type === "z" && f.out === "south";
});
if (cand.length) {
  const cx = cand.reduce((s, c) => s + c[0], 0) / cand.length;
  const [dx, dz] = [...cand].sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx))[0];
  const gy = groundAt(dx, dz);
  const facing = faceOf(dx, dz).out;
  const door = { facing, hinge: "left", open: "false", powered: "false" };
  put(dx, gy + 1, dz, "dark_oak_door", { ...door, half: "lower" });
  put(dx, gy + 2, dz, "dark_oak_door", { ...door, half: "upper" });
}

// 3. Warm light: glowstone just inside some windows (shopfront and upper storeys).
for (const [x, z] of cells) {
  const f = faceOf(x, z);
  if (!f || f.type !== "z") continue;
  const iz = z + (f.out === "south" ? -1 : 1);
  if (!has(x, iz) || faceOf(x, iz)) continue;
  for (let k = 0; k <= 3; k++) {
    const hit = k === 0 ? f.t % 4 === 2 : f.t % 6 === 1;
    const y = 5 * k + 2;
    if (hit && y >= groundAt(x, iz) && y < ROOF) put(x, y, iz, "glowstone");
  }
}

// 4. Roof plant penthouse, louvred walls, flat cap and a lightning rod.
for (let x = 4; x <= 10; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z) || faceOf(x, z)) continue;
    if (groundAt(x, z) > TOP) continue;
    const edge = x === 4 || x === 10 || z === 5 || z === 11;
    if (edge) {
      for (let y = 21; y <= 23; y++) {
        if (y === 22 && (x + z) % 2 === 0) put(x, y, z, "iron_bars");
        else put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, 24, z, "gray_concrete");
  }
}
if (has(7, 8) && !faceOf(7, 8)) {
  for (let y = 25; y <= 27; y++) put(7, y, 8, "lightning_rod");
}

vox.save(`${DIR}/${ID}.nbt`);
console.log(`saved ${DIR}/${ID}.nbt`);

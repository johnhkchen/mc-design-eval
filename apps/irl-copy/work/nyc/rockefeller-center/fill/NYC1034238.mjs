// 66 West 45 Street (2008, mixed residential and commercial): a glass tower over a granite street wall. Three lidar tiers:
// a one-cell lower wing on the north (low z) edge, the main tower, and a core a few blocks higher with a mechanical box.
// Every column is built from y 0 up to its tier, with a floor slab per storey (no interiors) and a parapet and cap on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034238.cells.json`, "utf8"));   // [x, z, ground, roof]

const N = 15, H = 143;
const GRANITE = "polished_granite", STONE = "smooth_stone", GLASS = "light_blue_stained_glass", IRON = "iron_block";
const SPANDREL = "gray_concrete", GLOW = "glowstone", PANEL = "light_gray_concrete";

// Lidar roof heights smoothed into three flat tiers (wing 93, tower 127, core 131).
const top = Array.from({ length: N }, () => new Array(N).fill(0));
for (const [x, z, , roof] of cells) top[x][z] = roof < 105 ? 93 : roof >= 129 ? 131 : 127;

const inO = (x, z, y) => x >= 0 && z >= 0 && x < N && z < N && y < top[x][z];
const exposed = (x, z, y) => !inO(x - 1, z, y) || !inO(x + 1, z, y) || !inO(x, z - 1, y) || !inO(x, z + 1, y);
// Mullions on the faces: every third cell along the face (x on z-facing faces, z on x-facing faces); corners always.
const mullionAt = (x, z, y) => {
  const xf = !inO(x - 1, z, y) || !inO(x + 1, z, y), zf = !inO(x, z - 1, y) || !inO(x, z + 1, y);
  return (xf && zf) || (zf ? x % 3 === 0 : z % 3 === 0);
};

const facadeBlock = (x, z, y, t) => {
  if (y === 0) return GRANITE;                                  // base course
  if (y >= t - 2) return GRANITE;                               // two-course parapet
  if (y % 3 === 0) return SPANDREL;                             // storey line
  if (mullionAt(x, z, y)) return y < 3 ? GRANITE : IRON;        // ground floor piers in stone
  return GLASS;
};

// Entrance on the south (high z) face: a dark oak door at x 7, granite jambs and lintel.
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const special = (x, z, y) => {
  if (z === N - 1 && x === 7 && y === 0) return { block: "dark_oak_door", state: doorState("lower") };
  if (z === N - 1 && x === 7 && y === 1) return { block: "dark_oak_door", state: doorState("upper") };
  if (z === N - 1 && y === 1 && (x === 6 || x === 8)) return { block: GRANITE };
  if (z === N - 1 && y === 2 && x >= 6 && x <= 8) return { block: GRANITE };
  return null;
};

// Warm light behind some glass: a glowstone in the air gap next to a glazed facade cell, on a hashed pattern.
const litWindow = (x, z, y) => {
  const k = Math.floor(y / 3);
  if (((x * 5 + z * 3 + k * 7) % 9) !== 0) return false;
  return [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([nx, nz]) =>
    inO(nx, nz, y) && exposed(nx, nz, y) && !mullionAt(nx, nz, y) && y < top[nx][nz] - 2 && y % 3 !== 0);
};

const g = new Voxels([N, H, N]);
for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
  const t = top[x][z];
  for (let y = 0; y < t; y++) {
    const sp = special(x, z, y);
    if (sp) { g.set(x, y, z, sp.block, sp.state); continue; }
    const face = exposed(x, z, y);
    if (y === t - 1) { g.set(x, y, z, face ? GRANITE : STONE); continue; }          // roof cap, parapet edge
    if (face) { g.set(x, y, z, facadeBlock(x, z, y, t)); continue; }
    if (y === 0 || y % 3 === 0) { g.set(x, y, z, STONE); continue; }               // floor slab per storey
    if (y % 3 === 1 && litWindow(x, z, y)) g.set(x, y, z, GLOW);
  }
}

// Mechanical penthouse on the core: a 3x4 box of panels with a glazed band and a granite roof, lightning rod on top.
for (let y = 131; y <= 133; y++) for (let z = 6; z <= 9; z++) for (let x = 7; x <= 9; x++) {
  if (!(x === 7 || x === 9 || z === 6 || z === 9)) continue;
  const corner = (x === 7 || x === 9) && (z === 6 || z === 9);
  g.set(x, y, z, y === 132 && !corner ? GLASS : PANEL);
}
g.set(8, 132, 7, GLOW);
for (let z = 6; z <= 9; z++) for (let x = 7; x <= 9; x++) g.set(x, 134, z, GRANITE);
g.set(8, 135, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Two air-handling boxes on the main roof, standing on its cap.
for (let y = 127; y <= 128; y++) for (let z = 2; z <= 3; z++) for (let x = 2; x <= 3; x++) g.set(x, y, z, PANEL);

const out = g.save(`${dir}/NYC1034238.nbt`);
console.log(JSON.stringify({ ...out, tiers: { wing: 93, tower: 127, core: 131 } }));

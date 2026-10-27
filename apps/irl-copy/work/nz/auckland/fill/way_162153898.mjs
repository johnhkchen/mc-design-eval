// Way 162153898: a 1920s-30s brick commercial block, three storeys over a shopfront with a stepped NE corner tower.
// Massing comes from the lidar roof heights, smoothed into three flat tiers (body 15, shoulder 17, tower 19), each
// column standing solid from its own ground up to its tier's top. Storey lines sit on absolute heights (4, 8, 12, 16)
// so neighbouring columns on a slope line up; the downhill side shows the extra storey as a taller wall.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153898.cells.json", "utf8"));
const g = new Voxels([32, 32, 20]);

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => cell.has(`${x},${z}`);
const LINES = [4, 8, 12, 16];                       // storey lines, absolute y

// tier top from the lidar: the NE corner tower (roof 19), the east shoulder (roof 17), the body (roof 15)
const tierTop = (x, z, roof) => (x >= 26 && z <= 3 ? 19 : roof >= 17 || (x >= 30 && z >= 3 && z <= 7) ? 17 : 15);
const isExt = (x, z) => !inFp(x, z) || !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// facade: a wall with a missing neighbour to the north or south runs along x (u = x); otherwise it runs along z
const facadeOf = (x, z) => {
  const facadeX = !inFp(x, z - 1) || !inFp(x, z + 1);
  const dz = !inFp(x, z - 1) ? -1 : !inFp(x, z + 1) ? 1 : 0;
  const dx = facadeX ? 0 : !inFp(x - 1, z) ? -1 : 1;
  return { facadeX, dx, dz, u: facadeX ? x : z };
};

const doorCells = [];
for (const [x, z, ground, roof] of cells) {
  const T = tierTop(x, z, roof);
  const ext = isExt(x, z);
  const Ltop = Math.max(ground, ...LINES.filter((L) => L <= T - 3));   // solid attic band from here to the roof
  const floors = [ground, ...LINES.filter((L) => L > ground && L < Ltop)];

  if (!ext) {                                       // interior: slabs per storey, solid attic, air between
    for (const L of floors) put(x, L, z, "smooth_stone");
    for (let y = Ltop; y < T; y++) put(x, y, z, "stone");
    if (T === 15 && (x * 3 + z * 5) % 11 === 0) put(x, 15, z, "iron_block");   // roof plant on the body terrace
    continue;
  }

  const { facadeX, dx, dz, u } = facadeOf(x, z);
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");        // foundation to the lowest-cell ground
  for (let y = ground; y < T; y++) put(x, y, z, "bricks");              // the wall, ground up to the tier top
  put(x, ground, z, "stone_bricks");                                    // base course
  for (const L of LINES) if (L > ground && L <= T - 3) put(x, L, z, "smooth_stone");   // string courses
  put(x, T - 3, z, "smooth_stone");                                      // cornice
  put(x, T - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });        // parapet coping
  if (ground < 3) put(x, 3, z, "dark_oak_planks");                       // shopfront fascia

  const pier = u % 3 === 0;
  const winRows = [];
  for (let y = ground + 1; y <= 2; y++) winRows.push(y);                  // shopfront glass
  for (const s of LINES) if (s + 2 <= T - 4) winRows.push(s + 1, s + 2);  // upper-storey windows
  for (const y of winRows) {
    if (pier) { if (y <= 2) put(x, y, z, "dark_oak_log"); continue; }
    put(x, y, z, "glass_pane");
  }
  for (const y of winRows) {                                             // warm light in some windows, behind the glass
    if (pier || (x * 7 + z * 3 + y) % 6 !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && !isExt(ix, iz)) put(ix, y, iz, "glowstone");
  }
  if (ground === 0 && facadeX && dz === 1) doorCells.push({ x, z, u });  // south-facing, ground level: entrance candidates
}

// one entrance, on the south shop face, at the median of the candidates
if (doorCells.length) {
  const sorted = [...doorCells].sort((a, b) => a.u - b.u);
  const d = sorted[sorted.length >> 1];
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(d.x, 1, d.z, "dark_oak_door", { ...base, half: "lower" });
  put(d.x, 2, d.z, "dark_oak_door", { ...base, half: "upper" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153898.nbt");

// 3550 West Pacific Ave (Miscellaneous/Mixed-Use): a 1920s-30s cream stucco mixed-use block, four storeys of
// two blocks each. Shopfronts on the ground floor of the street face, residential windows above, a flat roof with
// a quartz parapet. Built on the footprint cells only: each cell is foundation up to its ground, then the walls
// (boundary cells) and the hollow interior (floor slabs, air, roof) from there up to the parapet at y 8.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill/201006.0001191.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill/201006.0001191.nbt";
const [SX, SY, SZ] = [40, 20, 47];
const TOP = 8;                                   // parapet and roof deck row; roof surface sits on top of it

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x * 1000 + z;
const G = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const DIR = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const inS = (x, z) => G.has(key(x, z));
const facesOf = (x, z) => Object.keys(DIR).filter((d) => !inS(x + DIR[d][0], z + DIR[d][1]));
const isEdge = (x, z) => facesOf(x, z).length > 0;
const along = (d, x, z) => (d === "n" || d === "s" ? x : z);   // coordinate running along a facade
const hash = (x, y, z) => (x * 73 + y * 31 + z * 17) % 7;

// Street = the face with the longest run of single-face wall cells.
const runs = { n: 0, s: 0, e: 0, w: 0 };
for (const [x, z] of cells) { const f = facesOf(x, z); if (f.length === 1) runs[f[0]]++; }
const street = Object.keys(runs).reduce((a, b) => (runs[b] > runs[a] ? b : a));
const streetCells = cells
  .filter(([x, z]) => { const f = facesOf(x, z); return f.length === 1 && f[0] === street; })
  .map(([x, z, g]) => ({ x, z, g, u: along(street, x, z) }))
  .sort((a, b) => a.u - b.u);
const onGround = streetCells.filter((c) => c.g === 0);
const pool = onGround.length ? onGround : streetCells;
const nearestIn = (list, u) => list.reduce((a, b) => (Math.abs(b.u - u) < Math.abs(a.u - u) ? b : a));
const uLo = streetCells[0].u, uHi = streetCells[streetCells.length - 1].u;
const shopDoor = nearestIn(pool, (uLo + uHi) / 2);         // shop door at the middle of the frontage
const apart = pool.filter((c) => Math.abs(c.u - shopDoor.u) >= 4);   // residential entrance well clear of it
const resDoor = nearestIn(apart.length ? apart : pool, uHi - 4);     // ...near the far end
const doorAt = new Map([[key(shopDoor.x, shopDoor.z), { name: "dark_oak_door", face: street, shop: true }],
                        [key(resDoor.x, resDoor.z), { name: "oak_door", face: street, shop: false }]]);
const lintelU = new Set([resDoor.u - 1, resDoor.u, resDoor.u + 1]);

const v = new Voxels([SX, SY, SZ]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (const [x, z, g] of cells) {
  const f = facesOf(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");          // foundation up to the cell's ground
  if (f.length === 0) {                                              // hollow interior: floors, air, roof
    for (const y of [0, 2, 4, 6, TOP]) if (y >= g) put(x, y, z, y === TOP ? "gray_concrete" : "oak_planks");
    continue;
  }
  const corner = f.length > 1, face = f[0], u = along(face, x, z), street_ = face === street;
  for (let y = g; y <= TOP; y++) {
    if (y === g) { put(x, y, z, "polished_andesite"); continue; }  // plinth course
    if (y === TOP) { put(x, y, z, "quartz_bricks"); continue; }     // parapet
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }        // stepped diagonal edges stay plain stucco
    const door = doorAt.get(key(x, z));
    if (y === 1 && door && street_ && g === 0) {
      put(x, y, z, door.name, { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" }); continue;
    }
    if (y === 2 && door && street_ && g === 0) {
      put(x, y, z, door.name, { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" }); continue;
    }
    if (y === 1 && street_ && g === 0) { put(x, y, z, u % 4 === 0 ? "dark_oak_log" : "glass"); continue; }   // shopfront
    if (y === 2 && street_ && g === 0) { put(x, y, z, "dark_oak_planks"); continue; }                        // sign band
    if (y === 3 && street_ && g === 0 && lintelU.has(u)) { put(x, y, z, "dark_oak_planks"); continue; }    // entrance hood
    if (y % 2 === 0) { put(x, y, z, "quartz_bricks"); continue; }                                           // storey lines
    if (u % 6 === 0) { put(x, y, z, "quartz_pillar"); continue; }                                           // pilasters: bay rhythm
    if (u % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }                                           // piers
    // Window pane: connects along the facade to its neighbours (all solid edge cells).
    const horiz = face === "n" || face === "s";
    const nb = (d) => { const [dx, dz] = d === "a" ? (horiz ? [1, 0] : [0, 1]) : (horiz ? [-1, 0] : [0, -1]); return isEdge(x + dx, z + dz) ? "true" : "false"; };
    put(x, y, z, "glass_pane", horiz
      ? { north: "false", south: "false", east: nb("a"), west: nb("b"), waterlogged: "false" }
      : { north: nb("b"), south: nb("a"), east: "false", west: "false", waterlogged: "false" });
  }
}

// Warm light: a glowstone or lantern in the air cell just inside some windows and shop glass.
for (const [x, z, g] of cells) {
  const f = facesOf(x, z);
  if (f.length !== 1) continue;
  const face = f[0], [nx, nz] = DIR[face], ix = x - nx, iz = z - nz;
  if (!inS(ix, iz) || isEdge(ix, iz)) continue;
  const u = along(face, x, z);
  if (face === street && g === 0) {
    if (u % 4 !== 0 && hash(x, 1, z) === 0 && !doorAt.has(key(x, z))) put(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    continue;
  }
  for (const y of [3, 5, 7]) {
    if (y < g || y > TOP - 1 || u % 3 === 0) continue;
    if (hash(x, y, z) === 1) put(ix, y, iz, "glowstone");
  }
}

// Roof equipment: a few plant boxes on the roof deck, clear of the parapet.
for (const [x, z] of cells) {
  if (isEdge(x, z) || x % 6 !== 3 || z % 6 !== 3) continue;
  put(x, TOP + 1, z, "light_gray_concrete");
  put(x, TOP + 2, z, "light_gray_concrete");
}

const stats = v.save(OUT);
console.log(JSON.stringify({ street, shopDoor: [shopDoor.x, shopDoor.z], resDoor: [resDoor.x, resDoor.z], ...stats }));

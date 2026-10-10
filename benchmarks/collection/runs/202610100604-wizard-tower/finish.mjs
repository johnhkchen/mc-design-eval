// FINISH pass over roofed.nbt: glowing dormer, chimney, eave lanterns, ivy, foliage. -> finished.nbt
import { load, B, guard } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = load(new URL("./roofed.nbt", import.meta.url).pathname);
const OUT = new URL("./finished.nbt", import.meta.url).pathname;
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const roofy = (b) => /copper|stone_bricks|mossy_stone_bricks/.test(b);
const isRoof = (x, y, z) => { try { return roofy(g.blockAt(x, y, z)); } catch { return false; } };
const surfaceZ = (x, y) => { for (let z = 0; z < 13; z++) if (isRoof(x, y, z)) return z; return -1; };

// telescope lens: brass, not a red copper block
g.set(12, 17, 5, "lightning_rod", { facing: "east", powered: "false", waterlogged: "false" });
g.set(11, 15, 4, "minecraft:air");   // stray barrel
for (let y = 10; y <= 13; y++) g.set(8, y, 9, "dark_oak_log", { axis: "y" });   // ladder backing, floor 1

// ---- glowing dormer on the cone front (north), centred on the cone axis at that height --------------------------------
const y0 = 21;
let cx = 5; for (let x = 3; x <= 8; x++) if (isRoof(x, y0, surfaceZ(x, y0))) { /* find the column span */ }
const span = []; for (let x = 0; x < 13; x++) if (surfaceZ(x, y0) >= 0) span.push(x);
cx = Math.round((span[0] + span[span.length - 1]) / 2);
const dz = surfaceZ(cx, y0);
// 3-wide frame: window cell replaces the roof at the surface, dark-oak cheeks, stair hood, glowing shroomlight behind
for (const y of [y0, y0 + 1]) {
  g.set(cx, y, surfaceZ(cx, y), "orange_stained_glass");
  for (const x of [cx - 1, cx + 1]) g.set(x, y, surfaceZ(x, y), "dark_oak_planks");
}
const hz = surfaceZ(cx, y0 + 1);
g.set(cx, y0, hz + 1, "shroomlight");
for (const x of [cx - 1, cx, cx + 1]) g.set(x, y0 + 2, surfaceZ(x, y0 + 2) , ...B.stairs("dark_oak", "south"));
// sill + a small hood lantern
g.set(cx, y0 - 1, surfaceZ(cx, y0 - 1), ...B.slab("dark_oak", "top"));

// ---- chimney on the back-left slope with a campfire --------------------------------------------------------------------
{
  const x = 3, z = 7; let ty = 18; while (ty < 29 && isRoof(x, ty, z)) ty++;
  // ty = first free cell above the roof at (x,z)
  for (let y = ty - 3; y < ty + 3; y++) g.set(x, y, z, hash(x, y, z) < 0.3 ? "cobblestone" : "stone_bricks");
  g.set(x, ty + 3, z, "campfire", { lit: "true", signal_fire: "false", waterlogged: "false", facing: "north" });
}

// ---- lanterns hanging from the brim (eave ring at y18) -----------------------------------------------------------------
for (const [x, z] of [[0, 3], [0, 7], [4, 0], [6, 0], [10, 8], [3, 10], [7, 10]]) {
  if (g.isAir(x, 17, z) && !g.isAir(x, 18, z)) { g.set(x, 17, z, ...B.chain("y", false)); if (g.isAir(x, 16, z)) g.set(x, 16, z, ...B.lantern(true)); }
}

// ---- ivy: strands up the stone and the timber, clustered, denser low ---------------------------------------------------
const WALLB = /stone_bricks|cobblestone|andesite|calcite|dark_oak_log|^minecraft:stone$|tuff|dark_oak_planks|deepslate/;
const NB = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
let vines = 0;
for (let y = 17; y >= 3; y--) for (let x = 0; x <= 12; x++) for (let z = 0; z <= 12; z++) {
  if (!g.isAir(x, y, z)) continue;
  if (z === 2 && x >= 4 && x <= 8 && y <= 6) continue;
  const st = { north: "false", south: "false", east: "false", west: "false", up: "false" };
  let any = false;
  for (const [d, dx, dz2] of NB) { const nx = x + dx, nz = z + dz2; if (nx < 0 || nz < 0 || nx > 12 || nz > 12) continue; if (WALLB.test(g.blockAt(nx, y, nz))) { st[d] = "true"; any = true; } }
  if (!any) continue;
  const above = g.get(x, y + 1, z);
  const cont = above && /vine/.test(above.block);
  const base = y <= 9 ? 0.3 : y <= 14 ? 0.12 : 0.03;
  const patch = hash(x >> 1, 5, z >> 1) < 0.55 ? 1.5 : 0.25;
  if (hash(x, y, z + 400) < (cont ? 0.72 : base * patch)) { g.set(x, y, z, "vine", st); vines++; }
}
// leaf/fern clumps at the foot
for (let i = 0; i < 18; i++) {
  const x = Math.floor(hash(i, 1, 2) * 13), z = Math.floor(hash(i, 2, 3) * 13), y = 3;
  if (g.isAir(x, y, z) && (x <= 2 || x >= 10 || z >= 10) && !(x >= 4 && x <= 8 && z <= 3) && !g.isAir(x, y - 1, z))
    g.set(x, y, z, "oak_leaves", { persistent: "true", distance: "7", waterlogged: "false" });
}
g.save(OUT);
console.log("vines", vines, "dormer cx", cx, "saved");

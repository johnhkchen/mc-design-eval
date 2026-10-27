// Park Tower: an 11-storey concrete-frame office block of about 1980 on a stone plinth. Most of the footprint is a
// 10-storey wing (the lidar's roof at 41 blocks); a core of about 10 by 33 blocks rises to 47 as two set-back tiers
// and a plant drum, with a red aviation light on the cap. Storeys are 4 blocks: a light concrete floor line, then three
// rows of glazing between dark polished-andesite piers (one every third block along a face, a pier at each corner).
// Interiors are air behind the glass with a floor slab per storey. The lowest ground is the north side, so the entrance
// goes there; the plinth follows the lidar's ground, and the foundation fills down to it.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_44403771.cells.json`, "utf8"));
const W = 31, D = 48, H = 59;
const CORE_ROOF = 44;                       // lidar roofs of 44 and up are the core (the wing reads 41, the parapet 43)

// the footprint, with the lidar ground and roof per cell; keys are x * 100 + z
const K = (x, z) => x * 100 + z, unK = (k) => [Math.floor(k / 100), k % 100];
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(K(x, z), g); roof.set(K(x, z), r); }
const FP = new Set(ground.keys());
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const erode = (S) => new Set([...S].filter((k) => { const [x, z] = unK(k); return DIRS.every(([dx, dz]) => S.has(K(x + dx, z + dz))); }));
const exposed = (S, k) => { const [x, z] = unK(k); return DIRS.filter(([dx, dz]) => !S.has(K(x + dx, z + dz))); };

// the core: cells whose lidar roof is high, majority-filtered over their 3x3 so the noise on its edge drops out
const hot = new Set([...FP].filter((k) => roof.get(k) >= CORE_ROOF));
const CORE = new Set();
for (const k of FP) {
  const [x, z] = unK(k); let n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (hot.has(K(x + dx, z + dz))) n++;
  if (n >= 5) CORE.add(k);
}
const E1 = erode(CORE), E2 = erode(E1);           // set-back tiers: each one cell in from the one below
const cx = [...E2].reduce((s, k) => s + unK(k)[0], 0) / E2.size, cz = [...E2].reduce((s, k) => s + unK(k)[1], 0) / E2.size;

// materials: concrete floor lines and frame, dark polished-andesite piers, blue glass with tinted bays
const BASE = "stone_bricks", SLAB = "light_gray_concrete", PIER = "polished_andesite", GLASS = "light_blue_stained_glass", TINT = "gray_stained_glass";

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => { if (y >= 0 && y < H) g.set(x, y, z, b, s); };
const gOf = (k) => ground.get(k);

// one storey of a shell S from its floor line at `base`: a slab, then three rows of glazing on each exposed face
function storey(S, base) {
  for (const k of S) {
    const [x, z] = unK(k), G = gOf(k), F = exposed(S, k);
    if (base && base >= G) put(x, base, z, SLAB);       // the floor line (y 0 is the plinth's base course)
    if (!F.length) continue;                              // interior: air behind the glass
    const along = F[0][0] ? z : x;                       // stepped edges have two faces: the first one sets the bays
    for (let y = Math.max(base + 1, G); y <= base + 3; y++) {
      if (along % 3 === 0) put(x, y, z, PIER, undefined);
      else put(x, y, z, Math.floor(along / 3) % 4 === 2 ? TINT : GLASS);
    }
  }
}

// warm light: a glowstone standing on the floor just behind some lower panes
function glow(S, base) {
  for (const k of S) {
    const [x, z] = unK(k), G = gOf(k), F = exposed(S, k);
    if (!F.length || base + 1 < G || F.length > 1) continue;
    const along = F[0][0] ? z : x;
    if (along % 3 === 0 || (x * 7 + z * 13 + base) % 9 !== 0) continue;
    const [dx, dz] = F[0], ik = K(x - dx, z - dz);      // the cell just inside this pane
    if (S.has(ik) && !exposed(S, ik).length && base + 1 >= gOf(ik)) put(x - dx, base + 1, z - dz, "glowstone");
  }
}

// the plinth: stone from y 0 up to each cell's ground, and at least the base course
for (const k of FP) { const [x, z] = unK(k); for (let y = 0; y < Math.max(gOf(k), 1); y++) put(x, y, z, BASE); }

// the wing: ten storeys over the whole footprint
for (let s = 0; s < 10; s++) { storey(FP, 4 * s); glow(FP, 4 * s); }

// the wing's roof line (y 40): a cornice on the edge, a parapet to 43 where the lidar has the edge at 43; the roof is slab
for (const k of FP) {
  const [x, z] = unK(k), edge = exposed(FP, k).length > 0;
  put(x, 40, z, edge ? PIER : SLAB);
  if (edge && !CORE.has(k)) { put(x, 41, z, SLAB); put(x, 42, z, PIER); }
}

// roof plant on the wing: 2x2 boxes of concrete under iron grilles, kept off the edge and the core
const wingRoof = (k) => FP.has(k) && !CORE.has(k) && !exposed(FP, k).length;
for (const k of FP) {
  const [x, z] = unK(k);
  if (x % 6 !== 1 || z % 8 !== 3) continue;
  const box = [K(x, z), K(x + 1, z), K(x, z + 1), K(x + 1, z + 1)];
  if (!box.every(wingRoof)) continue;
  for (const b of box) { const [bx, bz] = unK(b); put(bx, 41, bz, SLAB); put(bx, 42, bz, SLAB); put(bx, 43, bz, "iron_bars"); }
}

// the core's first set-back: three storeys (41-43) on its inner ring, a cornice at 44 on the ring and a floor line
// under the drum; the outer ring of the core is the wing's roof terrace, open to the sky above 40
storey(E1, 40);
for (const k of E1) {
  const [x, z] = unK(k);
  put(x, 44, z, E2.has(k) ? SLAB : PIER);
}

// the drum: louvres on its ring (iron grilles between piers at the corners), a solid deck over its inside, a parapet at 46
for (const k of E2) {
  const [x, z] = unK(k), F = exposed(E2, k), along = F.length && (F[0][0] ? z : x);
  if (!F.length) { put(x, 45, z, SLAB); continue; }
  put(x, 45, z, F.length > 1 ? PIER : along % 2 === 0 ? "iron_bars" : SLAB);
  put(x, 46, z, PIER);
}
// the red aviation lights on the drum's deck, three along its length
for (const t of [cz - 10, cz, cz + 10]) {
  let best = null;
  for (const k of E2) { const [x, z] = unK(k); if (exposed(E2, k).length) continue;
    const d = Math.abs(x - cx) + Math.abs(z - t); if (!best || d < best.d) best = { x, z, d }; }
  if (best) put(best.x, 46, best.z, "redstone_lamp", { lit: "true" });
}

// the entrance on the north face, where the ground is lowest: a double-height door in a glazed bay, lintel above
const doorState = { facing: "north", hinge: "left", open: "false", powered: "false" };
put(13, 1, 1, "dark_oak_door", { ...doorState, half: "lower" });
put(13, 2, 1, "dark_oak_door", { ...doorState, half: "upper" });
for (let x = 13; x <= 15; x++) put(x, 3, 1, PIER);
put(14, 1, 2, "lantern", { hanging: "false", waterlogged: "false" });

const stats = g.save(`${DIR}/way_44403771.nbt`);
console.log(`way_44403771: footprint ${FP.size}, core ${CORE.size}, tier ${E1.size}, drum ${E2.size}, top 47, ${stats.blocks} blocks, ${stats.palette} palette`);

// OSM way 67966704, Mt Eden / Eden Terrace side of the CBD: a 1970s concrete-frame office block, 3 to 8 storeys.
// Read off the lidar roof: a 4-storey main body, 3-storey wings to the south-east, and a tower on a podium at the north
// (roof 34 at its crown). Materials: a dark volcanic (polished basalt) base, off-white concrete piers and light-grey
// spandrels, tinted blue glazing recessed one block behind the face, lit by lamps set in some rooms behind the glass.
// Walls are two blocks thick with air behind; each storey has a floor slab, every tier has a full slab under it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_67966704.cells.json`, "utf8"));

const SX = 70, SY = 47, SZ = 48;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];
const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);

// ---- footprint, foundation and roof -------------------------------------------------------------------------------
const G = new Map(), R = new Map();                       // ground (y of the surface), lidar roof (absolute y)
for (const [x, z, g, r] of cells) { G.set(key(x, z), g); R.set(key(x, z), r); }
const F = [...G.keys()];
const inF = (x, z) => G.has(key(x, z));

// the lidar roof is noisy: a 3x3 median, then flat tiers (the nearest tier, a tie goes up)
const TIERS = [12, 16, 20, 24, 28, 32, 34];
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const tierOf = (v) => TIERS.reduce((b, t) => (Math.abs(t - v) <= Math.abs(b - v) ? t : b), TIERS[0]);
const TOP = new Map();                                    // the tier's top: the roof surface is TOP-1
for (const k of F) {
  const [x, z] = parse(k);
  const v = [R.get(k)]; for (const [dx, dz] of N8) if (inF(x + dx, z + dz)) v.push(R.get(key(x + dx, z + dz)));
  TOP.set(k, Math.max(tierOf(median(v)), G.get(k) + 8));  // at least two storeys above the ground
}
// a high tier needs a mass under it: a sliver of lidar cells above 28 would read as a stray spike, so it steps down
for (let pass = 0; pass < 2; pass++) for (const k of F) {
  const t = TOP.get(k); if (t < 28) continue;
  const [x, z] = parse(k);
  if (N4.filter(([dx, dz]) => (TOP.get(key(x + dx, z + dz)) ?? 0) >= t).length < 3) TOP.set(k, TIERS[TIERS.indexOf(t) - 1]);
}

// ---- depth from the outside, per level: 1 = facade, 2 = the wall's inner skin, 3+ = inside. Foundation counts as
// solid, so a low cell next to a high cell's plinth is not exposed on that side.
const DEP = [];
for (let y = 0; y < SY; y++) {
  const set = new Set(F.filter((k) => y < TOP.get(k)));
  const d = new Map();
  let fr = [];
  for (const k of set) { const [x, z] = parse(k); if (N4.some(([dx, dz]) => !set.has(key(x + dx, z + dz)))) { d.set(k, 1); fr.push(k); } }
  for (let dep = 1; fr.length; dep++) {
    const nx = [];
    for (const k of fr) { const [x, z] = parse(k); for (const [dx, dz] of N4) { const n = key(x + dx, z + dz); if (set.has(n) && !d.has(n)) { d.set(n, dep + 1); nx.push(n); } } }
    fr = nx;
  }
  DEP.push(d);
}
const depth = (k, y) => DEP[y]?.get(k) ?? 0;
// the neighbour at depth `want` on this level (-1 = toward the outside, +1 = inward)
const nbrAt = (k, y, want) => { const [x, z] = parse(k); for (const [dx, dz] of N4) { const n = key(x + dx, z + dz); if (depth(n, y) === want) return { n, dx, dz }; } return null; };
const outDir = (k, y) => { const [x, z] = parse(k); return N4.find(([dx, dz]) => depth(key(x + dx, z + dz), y) === 0) ?? null; };

// ---- the entrance: on the south face, near the middle, at the ground storey ---------------------------------------
const meanX = F.reduce((s, k) => s + parse(k)[0], 0) / F.length;
const doorPick = (pred) => F.filter((k) => { const g = G.get(k); return depth(k, g + 1) === 1 && pred(k, g); })
  .sort((a, b) => Math.abs(parse(a)[0] - meanX) - Math.abs(parse(b)[0] - meanX))[0];
const DOOR = doorPick((k, g) => outDir(k, g + 1)?.[1] === 1) ?? doorPick(() => true);
const DOOR_FACE = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

// ---- materials ---------------------------------------------------------------------------------------------------
const FOUND = "stone_bricks";
const lowerSt = (s) => s === 0;
const pal = (s) => (lowerSt(s)
  ? { base: "polished_basalt", pier: "polished_basalt", band: "polished_basalt", glass: "glass" }
  : { base: "light_gray_concrete", pier: "white_concrete", band: "light_gray_concrete", glass: "light_blue_stained_glass" });

// the bay pattern on a facade: piers every 4 blocks along the face; the centre of each 3-block window is a mullion
const faceU = (x, z, n) => (n[1] !== 0 ? x : z);
const isDoor = (k, y, g) => DOOR !== undefined && k === DOOR && (y - g === 1 || y - g === 2);
const winKind = (k, y, g, n) => {
  if (isDoor(k, y, g)) return "door";
  return faceU(...parse(k), n) % 4 === 0 ? "pier" : "win";
};
// is this depth-2 cell glazed (behind a window bay of the facade), and not a mullion?
const glazedBehind = (k, y, g) => {
  const o = nbrAt(k, y, 1); if (!o) return null;
  const n = outDir(o.n, y); if (!n) return null;
  if (isDoor(o.n, y, g)) return null;
  const kind = winKind(o.n, y, g, n);
  if (kind !== "win") return null;
  return faceU(...parse(o.n), n) % 4 === 2 ? "mullion" : "glass";
};

// ---- the block at (x, y, z) ------------------------------------------------------------------------------------------
const lampHash = (x, y, z) => (x * 73 + z * 151 + y * 19) % 7 === 0;
function blockAt(x, y, z) {
  const k = key(x, z);
  if (!G.has(k)) return null;
  const g = G.get(k), t = TOP.get(k);
  if (y < g) return FOUND;                                           // the plinth on sloping ground
  if (y >= t) return y === t && depth(k, t - 1) === 1 ? "stone_bricks" : null;   // parapet on the facade edge
  const d = depth(k, y), s = Math.floor((y - g) / 4), r = (y - g) % 4, P = pal(s);
  if (y === t - 1) return d <= 2 ? P.band : "smooth_stone";         // the roof deck of this tier
  if (r === 0 || TIERS.includes(y + 1)) return d <= 2 ? (r === 0 && lowerSt(s) ? P.base : P.band) : "smooth_stone";
  if (d >= 3) {                                                     // inside: air, with a lamp behind some glass
    const o = nbrAt(k, y, 2);
    if (r === 1 && o && glazedBehind(o.n, y, g) === "glass" && lampHash(x, y, z))
      return lowerSt(s) ? { name: "glowstone" } : { name: "shroomlight" };
    return null;
  }
  if (r === 3) return d <= 2 ? P.band : null;                       // spandrel above the window zone
  if (d === 1) {                                                    // facade, window zone r = 1, 2
    const n = outDir(k, y);
    const kind = winKind(k, y, g, n);
    if (kind === "door") {
      const inward = { "0,-1": [0, 1], "0,1": [0, -1], "1,0": [-1, 0], "-1,0": [1, 0] }[n.join(",")];
      return { name: "dark_oak_door", state: { facing: DOOR_FACE[inward.join(",")], half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    }
    if (kind === "pier") return P.pier;
    return nbrAt(k, y, 2) ? null : P.glass;                         // recessed one block behind the face where there is depth
  }
  // d === 2, the inner skin of the wall
  const gb = glazedBehind(k, y, g);
  if (gb === "glass") return P.glass;
  if (gb === "mullion") return "gray_concrete";
  const o = nbrAt(k, y, 1);
  if (o && isDoor(o.n, y, g)) return null;                          // the doorway's opening
  return P.pier;
}

const world = new Voxels([SX, SY, SZ]);
for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) for (let y = 0; y < SY; y++) {
  const b = blockAt(x, y, z);
  if (!b) continue;
  if (typeof b === "string") world.set(x, y, z, b);
  else world.set(x, y, z, b.name, b.state);
}

// ---- roof plant on the top tier: 2x2 units, one mast ---------------------------------------------------------------
const maxT = Math.max(...F.filter((k) => depth(k, TOP.get(k) - 1) >= 3).map((k) => TOP.get(k)));
const crown = F.filter((k) => TOP.get(k) === maxT && depth(k, maxT - 1) >= 3);
for (const k of crown) {
  const [x, z] = parse(k);
  if (x % 6 >= 2 && x % 6 <= 3 && z % 6 >= 2 && z % 6 <= 3) for (let y = maxT; y < maxT + 2; y++) world.set(x, y, z, "light_gray_concrete");
}
const cx = crown.reduce((s, k) => s + parse(k)[0], 0) / crown.length, cz = crown.reduce((s, k) => s + parse(k)[1], 0) / crown.length;
const mast = crown.sort((a, b) => Math.hypot(parse(a)[0] - cx, parse(a)[1] - cz) - Math.hypot(parse(b)[0] - cx, parse(b)[1] - cz))[0];
if (mast) { const [mx, mz] = parse(mast); for (let y = maxT; y < maxT + 2; y++) world.set(mx, y, mz, "iron_bars"); }

const report = world.save(`${DIR}/way_67966704.nbt`);
console.log(JSON.stringify({ footprint: F.length, tiers: [...new Set(TOP.values())].sort((a, b) => a - b), door: DOOR, ...report }));

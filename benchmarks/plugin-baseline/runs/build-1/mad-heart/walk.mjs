// Reachability walk on the saved build (screen coords). node walk.mjs build.nbt [startU,startY,startZ] [probe=u,y,z ...]
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = load(process.argv[2]);
const [W, H, D] = g.size;
const start = (process.argv[3] ?? "4,1,4").split(",").map(Number);
const probes = process.argv.slice(4).map((s) => { const [n, c] = s.split("="); return [n, c.split(",").map(Number)]; });
const blk = (u, y, z) => (u < 0 || u >= W || y < 0 || y >= H || z < 0 || z >= D ? "OUT" : (g.get(W - 1 - u, y, z)?.block ?? "air").replace("minecraft:", ""));
const PASS = (b) => b === "air" || b.endsWith("_sign") || b.includes("torch") || b === "ladder" || b.endsWith("_banner") || b.endsWith("button") || b === "lever" ||
  b.includes("chain") || b === "cobweb" || b === "vine" || b === "string" || b.includes("rod") || b.includes("rail") || b.includes("pressure_plate") || b.includes("tripwire") || b.includes("redstone_wire") ||
  b === "repeater" || b === "comparator" || b.endsWith("carpet") || b.endsWith("candle") || b.includes("flower_pot") || b.endsWith("_head") || b.endsWith("_skull") || b === "lantern" || b.endsWith("_lantern") || b === "snow" || b === "short_grass" || b === "fern" || b.includes("mushroom") && !b.includes("block") ||
  (b.endsWith("_door") && !b.startsWith("iron")) || b === "end_rod" || b === "bell" || b === "brewing_stand" || b === "hanging_roots" || b === "sculk_vein" || b.includes("dried_ghast");
const PART = (b) => b.endsWith("_stairs") || b.endsWith("_slab") || b.endsWith("_trapdoor") || b.endsWith("carpet") || b === "lantern" || b.endsWith("_lantern") || b.endsWith("candle") || b.includes("flower_pot") || b === "cauldron" || b === "composter" || b === "brewing_stand" || b.endsWith("_bed") || b === "enchanting_table" || b === "lectern" || b === "daylight_detector" || b === "repeater" || b === "comparator" || b.endsWith("_head") || b.endsWith("_skull") || b === "bell";
const passable = (b) => PASS(b) || PART(b);
const solid = (b) => !passable(b);                // blocks body, supports feet
const ladder = (b) => b === "ladder";
const stand = (u, y, z) => {
  const b = blk(u, y, z), h = blk(u, y + 1, z), s = blk(u, y - 1, z);
  if (b === "OUT" || !passable(b) || !passable(h) || h.endsWith("_stairs") || h.endsWith("_slab") && false) return false;
  return solid(s) || PART(s) || PART(b) || ladder(b) || ladder(s) || s.endsWith("_slab") || s.endsWith("_stairs");
};
const key = (u, y, z) => (u * H + y) * D + z;
const seen = new Set(); const q = [];
const push = (u, y, z) => { const k = key(u, y, z); if (!seen.has(k)) { seen.add(k); q.push([u, y, z]); } };
push(...start);
while (q.length) {
  const [u, y, z] = q.shift();
  for (const [a, c] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nu = u + a, nz = z + c;
    for (const dy of [0, 1, -1, -2, -3]) {
      const ny = y + dy;
      if (ny < 0 || !stand(nu, ny, nz)) continue;
      if (dy === 1) {
        // step/jump up: the cell above our head must be free, and the target is a partial block or a 1-high ledge
        const nb = blk(nu, ny, nz), ledge = blk(nu, y, nz);
        if (!(PART(nb) || PART(ledge) || solid(ledge))) continue;
        if (!passable(blk(u, y + 2, z))) continue;
      }
      if (dy < 0) { const mid = blk(nu, y, nz), mid2 = blk(nu, y + 1, nz); if (!passable(mid) || !passable(mid2)) continue; }
      push(nu, ny, nz);
      break;
    }
  }
  // ladders
  if (ladder(blk(u, y, z)) || ladder(blk(u, y - 1, z))) {
    if (passable(blk(u, y + 1, z)) && passable(blk(u, y + 2, z)) && ladder(blk(u, y, z))) push(u, y + 1, z);
    if (ladder(blk(u, y, z)) || ladder(blk(u, y - 1, z))) { if (passable(blk(u, y - 1, z))) push(u, y - 1, z); }
  }
}
console.log("reachable standing cells:", seen.size);
const reach = (u, y, z) => seen.has(key(u, y, z));
for (const [n, c] of probes) { let ok = false; for (const dy of [0, 1, 2]) if (reach(c[0], c[1] + dy, c[2])) ok = true; console.log(n.padEnd(14), ok ? "REACHED" : "no"); }
// bounding / per-level summary
const byY = {}; for (const k of seen) { const y = Math.floor(k / D) % H; byY[y] = (byY[y] ?? 0) + 1; }
console.log("by y:", Object.entries(byY).map(([y, n]) => `${y}:${n}`).join(" "));
if (process.env.MAP) { for (const y of process.env.MAP.split(",").map(Number)) { console.log("y=" + y); for (let z = 0; z < D; z++) { let r = String(z).padStart(2) + " "; for (let u = 0; u < W; u++) r += reach(u, y, z) ? "o" : (solid(blk(u, y, z)) ? "#" : "."); console.log(r); } } }

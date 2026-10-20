import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098234";
const W = 7, H = 23, D = 22;

// Low-rise commercial block, c. 1980s-90s Xinyi: pale quartz-clad walls, grey
// spandrels, shopfront on the street face (north, z=0), punched window grid
// above, plain roof with parapet and rooftop plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) =>
  !inFp(x, z - 1) || !inFp(x, z + 1) || !inFp(x - 1, z) || !inFp(x + 1, z);

const gs = [...ground.values()];
const gmin = Math.min(...gs);
const gmax = Math.max(...gs);
// Roof about 11 above lowest ground, never below 3 above the highest ground, within the volume.
const T = Math.min(20, Math.max(gmin + 11, gmax + 3));

const paneAlongX = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneAlongZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const gc = Math.min(gr, T - 3);
  const fc = { n: !inFp(x, z - 1), s: !inFp(x, z + 1), w: !inFp(x - 1, z), e: !inFp(x + 1, z) };
  const perim = fc.n || fc.s || fc.w || fc.e;
  const corner = (fc.n || fc.s) && (fc.w || fc.e);
  const alongX = fc.n || fc.s;
  const face = fc.n ? "n" : fc.s ? "s" : fc.w ? "w" : fc.e ? "e" : null;
  const inward = face === "n" ? [x, z + 1] : face === "s" ? [x, z - 1]
    : face === "w" ? [x + 1, z] : face === "e" ? [x - 1, z] : null;
  const inwardOK = inward && inFp(...inward) && !isPerim(...inward);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs: ground slab at gc, storey slabs every 5 blocks, roof slab at T.
  const lv = [gc];
  for (let y = T - 5; y > gc + 2; y -= 5) lv.push(y);
  lv.push(T);
  lv.sort((a, b) => a - b);
  for (const y of lv) {
    g.set(x, y, z, y === T ? "smooth_quartz" : "light_gray_concrete");
  }

  if (!perim) continue;

  // Base course and cornice / parapet.
  g.set(x, gc, z, "polished_andesite");
  g.set(x, T, z, "quartz_block");
  g.set(x, T + 1, z, corner ? "quartz_pillar" : "smooth_quartz");

  // Storey walls.
  for (let i = 0; i < lv.length - 1; i++) {
    const a = lv[i], b = lv[i + 1], n = b - a;
    const ground0 = i === 0;
    for (let k = 1; k < n; k++) {
      const y = a + k;
      if (corner) {
        g.set(x, y, z, "quartz_pillar", { axis: "y" });
        continue;
      }
      if (ground0 && fc.n) {
        // Shopfront on the street face.
        if (k === n - 1) { g.set(x, y, z, "smooth_quartz"); continue; }
        if (x === 3 && k <= n - 3) continue; // entrance doorway, open air
        g.set(x, y, z, "glass_pane", alongX ? paneAlongX : paneAlongZ);
        if (k === 2 && (x === 1 || x === 5) && inwardOK) {
          g.set(inward[0], y, inward[1], "glowstone");
        }
        continue;
      }
      if (k === n - 1 || k === 1) { g.set(x, y, z, "light_gray_concrete"); continue; }
      const p = alongX ? x : z;
      if (p % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }
      g.set(x, y, z, "glass_pane", alongX ? paneAlongX : paneAlongZ);
      if (k === 2 && inwardOK && (p + i) % 4 === 0) {
        g.set(inward[0], y, inward[1], "shroomlight");
      }
    }
  }
}

// Rooftop plant boxes on interior roof cells, standing on the roof slab.
for (const [x, z] of ground.keys().map ? [] : []) {}
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if ((x * 3 + z * 5) % 11 === 0) {
    g.set(x, T + 1, z, "light_gray_concrete");
    g.set(x, T + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

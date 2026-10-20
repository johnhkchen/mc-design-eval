import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century (c. 1960s-70s) two-storey Taipei commercial block: white-quartz
// piers and bands, blue-tinted glazing, stone base, parapet and cornice.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833587";
const W = 22, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(key(x, z));

const gMin = Math.min(...ground.values());
// Base level of the lowest ground; keep the 11-block roof inside the volume.
const B = Math.min(gMin, H - 12);

const WINDOW = "light_blue_stained_glass";
const GLOW = "glowstone";
const TRIM = "smooth_quartz";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const ROOF = "light_gray_concrete";

// Entrance: south-facing edge cell nearest the footprint's centre line.
let cx = 0, n = 0;
for (const [x] of cells) { cx += x; n++; }
cx /= n;
let entrance = null;
for (const [x, z] of cells) {
  if (!has(x, z + 1) && (!entrance || Math.abs(x - cx) < Math.abs(entrance.x - cx))) {
    entrance = { x, z };
  }
}

const isEntranceCell = (x, z) => entrance && entrance.x === x && entrance.z === z;

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, FOUND);

  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const edge = nN || nS || nW || nE;
  const alongX = nN || nS; // facade runs along x
  const along = alongX ? x : z;
  const outward = nS ? "south" : nN ? "north" : nE ? "east" : "west";

  for (let y = gr; y < H; y++) {
    const r = y - B;
    if (r > 11) break;

    if (!edge) {
      // Interior: floor slabs and roof only, air between.
      if (r === 0 || r === 5) g.set(x, y, z, TRIM);
      else if (r === 10) g.set(x, y, z, ROOF);
      else if (r === 11 && (x * 5 + z * 3) % 9 === 0) g.set(x, y, z, "iron_block");
      continue;
    }

    const pier = along % 3 === 0;

    if (r === 0) { g.set(x, y, z, BASE); continue; }
    if (r === 4 || r === 5 || r === 6) { g.set(x, y, z, TRIM); continue; }
    if (r === 10) { g.set(x, y, z, TRIM); continue; }
    if (r === 11) {
      g.set(x, y, z, pier ? TRIM : "smooth_quartz_slab",
        pier ? undefined : { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Window bands r1-3 (storey 1) and r7-9 (storey 2).
    if ((r >= 1 && r <= 3) || (r >= 7 && r <= 9)) {
      if (pier) { g.set(x, y, z, TRIM); continue; }
      if (isEntranceCell(x, z) && (r === 1 || r === 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isEntranceCell(x, z) && r === 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      const lit = (r === 2 || r === 8) && (along * 3 + r * 5) % 9 === 0;
      g.set(x, y, z, lit ? GLOW : WINDOW);
      continue;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

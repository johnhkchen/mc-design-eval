import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 115 Columbia Heights, Brooklyn Heights (1844): Greek Revival brownstone front,
// brick sides and rear, four storeys over a stone base, cornice and parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001652";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 25, D = 6;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// footprint lookup, each cell keeps its own lidar ground and roof
const rec = new Map();
for (const c of cells) {
  rec.set(`${c[0]},${c[1]}`, { gr: Math.round(c[2]), rf: Math.round(c[3]) });
}
const H_ = (x, z) => rec.has(`${x},${z}`);

const all = [...rec.values()];
const g0 = Math.min(...all.map(v => v.gr));

// per-cell roof follows lidar, snapped to whole storey tiers (3-block floors)
// so wings step down cleanly instead of being flattened to one median height
const tierTop = (rf) => {
  const t = Math.round((rf - g0) / 3) * 3 + g0; // 0,3,6,9,12 above g0
  return Math.min(Math.max(t, g0 + 6), g0 + 12) + 1; // parapet row sits just above the deck
};
const topOf = (rf) => Math.min(tierTop(rf), H - 4);

// storey floor levels from the lowest ground
const starts = [];
for (let s = g0; s < H - 4; s += 3) starts.push(s);

const GLASS_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GLASS_Z = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

for (const [key, v] of rec) {
  const [x, z] = key.split(",").map(Number);
  const gr = v.gr;
  const top = topOf(v.rf);
  const front = z === 0 && !H_(x, -1);
  const back = z === D - 1 && !H_(x, D);
  const ext = !H_(x - 1, z) || !H_(x + 1, z) || !H_(x, z - 1) || !H_(x, z + 1);
  const sideFace = !front && !back;

  for (let y = 0; y < top; y++) {
    // foundation from y 0 up to this cell's ground
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }

    if (!ext) {
      // interior: floor slabs and roof deck only, air elsewhere (no interiors)
      if (y === top - 1) put(x, y, z, "smooth_stone");
      else if (starts.includes(y)) put(x, y, z, "spruce_planks");
      continue;
    }

    // exterior shell
    if (y === top - 1) { put(x, y, z, "chiseled_stone_bricks"); continue; }
    if (y === top - 2 && y > gr) { put(x, y, z, "smooth_stone"); continue; } // cornice band

    const s = g0 + 3 * Math.floor((y - g0) / 3);
    const rel = y - s;
    const isGround = s === g0;

    // entrance on the front, ground storey, off-centre at x=3
    if (front && x === 3 && isGround && (rel === 0 || rel === 1)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // base course
    if (y === g0) { put(x, y, z, "stone_bricks"); continue; }

    // string courses at storey lines
    if (starts.includes(y)) { put(x, y, z, "smooth_stone"); continue; }

    // window bands: rows s+1 and s+2, if the storey band fits under the cornice
    const band = (rel === 1 || rel === 2) && s + 2 <= top - 3;
    if (band) {
      if (front || back) {
        if (front && x === 3 && isGround && rel === 2) {
          put(x, y, z, "glass_pane", GLASS_X); // transom over door
          continue;
        }
        const cols = isGround ? [6, 9, 12] : [2, 5, 8, 11, 14];
        if (cols.includes(x)) {
          put(x, y, z, "glass_pane", GLASS_X);
          continue;
        }
      } else if (sideFace && z === 2) {
        put(x, y, z, "glass_pane", GLASS_Z);
        continue;
      }
    }

    // plain wall: brownstone front, brick elsewhere
    put(x, y, z, front ? "brown_terracotta" : "bricks");
  }

  // parapet on exterior cells, standing on the wall top
  if (ext) put(x, top, z, "stone_brick_wall", { up: "true" });
}

// warm lights behind some front windows (inside the air gap at z=1)
const lamps = [[9, g0 + 1], [5, g0 + 4], [11, g0 + 7], [2, g0 + 4]];
for (const [x, y] of lamps) {
  if (H_(x, 0) && H_(x, 1)) put(x, y, 1, "glowstone");
}

// roof chimneys standing on the roof deck of their cell
for (const [cx, cz] of [[4, 2], [11, 3]]) {
  if (!H_(cx, cz)) continue;
  const top = topOf(rec.get(`${cx},${cz}`).rf);
  for (let y = top; y <= top + 2; y++) put(cx, y, cz, "bricks");
  put(cx, top + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

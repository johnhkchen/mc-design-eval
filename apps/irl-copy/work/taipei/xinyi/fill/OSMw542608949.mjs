import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608949";
const W = 8, H = 23, D = 15;

// Record: 8 x 15 footprint, roof ~11 above lowest ground.
// Reading: a two-storey (about 5 blocks per storey) cream-tile mid-rise with
// a red shopfront fascia at street level, light-grey storey bands, glazed
// bays, a parapet cap and a rooftop water tank with an iron-block AC unit.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const lowest = Math.min(...ground.values());

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const glowPending = [];

for (const [key, gc] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const fW = !has(x - 1, z), fE = !has(x + 1, z);
  const fN = !has(x, z - 1), fS = !has(x, z + 1);
  const ext = fW || fE || fN || fS;
  const ewFace = fW || fE;
  const nsFace = fN || fS;
  const corner = ewFace && nsFace;
  const i = ewFace ? z : x;
  const len = ewFace ? D : W;
  const isDoor = fN && x === 3 && !corner;
  const groundWin = i >= 1 && i <= len - 2;
  const upperWin = i % 2 === 1 && i <= len - 2;
  const paneProps = ewFace ? paneEW : paneNS;

  for (let y = gc; y <= lowest + 11; y++) {
    const rel = y - lowest;

    if (rel === 0) {
      put(x, y, z, ext ? "stone_bricks" : "smooth_stone");
    } else if (rel === 5 || rel === 10) {
      // storey line and roof deck, all footprint cells
      put(x, y, z, "light_gray_concrete");
    } else if (rel === 11) {
      if (ext) put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    } else if (ext && !corner) {
      if (isDoor && (rel === 1 || rel === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: rel === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else if (rel >= 1 && rel <= 3 && ((rel <= 4 && groundWin) || (rel >= 6 && upperWin))) {
        put(x, y, z, "glass_pane", paneProps);
      } else if (rel === 4 && fN && rel <= 4) {
        put(x, y, z, "red_concrete");   // shopfront fascia
      } else if (rel >= 6 && rel <= 8 && upperWin) {
        put(x, y, z, "glass_pane", paneProps);
      } else if (rel >= 1 && rel <= 3 && groundWin && !isDoor) {
        put(x, y, z, "glass_pane", paneProps);
      } else {
        put(x, y, z, "smooth_quartz");
      }
    } else if (ext && corner) {
      if (rel <= 9) put(x, y, z, "smooth_quartz");
    }
  }

  // Warm light behind selected ground and upper windows.
  if (ext && !corner && !isDoor && i % 4 === 1) {
    let ix = x, iz = z;
    if (fW) ix = x + 1; else if (fE) ix = x - 1;
    else if (fN) iz = z + 1; else if (fS) iz = z - 1;
    if (has(ix, iz)) {
      const igc = ground.get(`${ix},${iz}`);
      glowPending.push([ix, iz, igc]);
    }
  }
}

// Glowstone behind glass, one per lit bay, on each storey floor.
for (const [ix, iz, igc] of glowPending) {
  for (const rel of [2, 7]) {
    const y = lowest + rel;
    if (y >= igc) put(ix, y, iz, "glowstone");
  }
}

// Rooftop water tank (3 x 3 with dark slab lid) and AC units, where footprint allows.
for (let tx = 2; tx <= 4; tx++) {
  for (let tz = 5; tz <= 7; tz++) {
    if (!has(tx, tz)) continue;
    put(tx, lowest + 11, tz, "white_concrete");
    put(tx, lowest + 12, tz, "white_concrete");
    put(tx, lowest + 13, tz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (const [ax, az] of [[6, 2], [6, 12], [1, 12]]) {
  if (has(ax, az)) put(ax, lowest + 11, az, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);

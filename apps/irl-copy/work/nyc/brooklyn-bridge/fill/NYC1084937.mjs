import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1084937";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 26, D = 15;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const median = (a) => {
  const s = [...a].sort((p, q) => p - q);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// One building: shared storey datum B (median ground) and one flat roof RF (median lidar roof)
const gsAll = cells.map((c) => Math.round(c[2]));
const rfAll = cells.map((c) => c[3]);
const B = Math.max(0, Math.round(median(gsAll)));
const maxGr = Math.max(...gsAll);
let RF = Math.round(median(rfAll) / 2) * 2;
RF = Math.max(maxGr + 6, Math.min(RF, 24));

const cm = new Map();
for (const c of cells) {
  const [x, z, grRaw] = c;
  cm.set(`${x},${z}`, { x, z, gr: Math.round(grRaw), rf: RF });
}
const has = (x, z) => cm.has(`${x},${z}`);
const get = (x, z) => cm.get(`${x},${z}`);

// exposed faces: W=-x (Water Street front), E=+x, N=-z, S=+z
const faces = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
};

const base = (c) => Math.max(c.gr, B);

// window position test on a single exposed face at height y
const winAt = (x, z, face, y) => {
  const c = get(x, z);
  if (!c) return false;
  const fs = faces(x, z);
  if (fs.length !== 1 || fs[0] !== face) return false;
  const rel = y - B;
  if (y < base(c) || rel < 4 || rel % 2 !== 0 || y >= c.rf - 2) return false;
  const a = (face === "W" || face === "E") ? z : x;
  return a % 3 !== 0;
};

// Pass 1: solid plinth/foundation, interiors (floor slabs only), exterior shell
for (const c of cm.values()) {
  const { x, z, rf } = c;
  const fs = faces(x, z);
  const ring = fs.length > 0;
  const corner = fs.length >= 2;
  const b0 = base(c);

  for (let y = 0; y < b0; y++) put(x, y, z, "stone_bricks");

  for (let y = b0; y < rf; y++) {
    const rel = y - B;

    if (!ring) {
      if (y === B || y === rf - 1 || (rel >= 3 && rel % 2 === 1)) put(x, y, z, "smooth_stone");
      continue;
    }

    if (y === rf - 1) { put(x, y, z, "smooth_stone"); continue; }   // cornice cap
    if (y === rf - 2) { put(x, y, z, "stone_bricks"); continue; }   // frieze
    if (rel === 0) { put(x, y, z, "polished_andesite"); continue; } // base course

    const a = (fs[0] === "W" || fs[0] === "E") ? z : x;

    // Water Street shopfront, ground storey (single-face cells on the west)
    if (rel >= 1 && rel <= 2 && fs.length === 1 && fs[0] === "W") {
      if (x === 0 && z === 7) {
        put(x, y, z, "dark_oak_door", {
          facing: "west",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (a % 3 === 0) {
        put(x, y, z, "dark_oak_log", { axis: "y" });
      } else {
        put(x, y, z, "glass");
      }
      continue;
    }

    if (rel % 2 === 1) { put(x, y, z, "stone_bricks"); continue; } // floor string courses

    if (!corner && rel >= 4 && winAt(x, z, fs[0], y)) {
      const face = fs[0];
      let props;
      if (face === "W" || face === "E") {
        props = {
          north: winAt(x, z - 1, face, y) ? "true" : "false",
          south: winAt(x, z + 1, face, y) ? "true" : "false",
          east: "false",
          west: "false",
          waterlogged: "false",
        };
      } else {
        props = {
          east: winAt(x + 1, z, face, y) ? "true" : "false",
          west: winAt(x - 1, z, face, y) ? "true" : "false",
          north: "false",
          south: "false",
          waterlogged: "false",
        };
      }
      put(x, y, z, "glass_pane", props);
    } else {
      put(x, y, z, "bricks");
    }
  }
}

// Pass 2: warm light behind some window glass (inside the air gap)
for (const c of cm.values()) {
  const { x, z, rf } = c;
  const fs = faces(x, z);
  if (fs.length !== 1) continue;
  const face = fs[0];
  const a = (face === "W" || face === "E") ? z : x;
  const [ix, iz] = face === "W" ? [x + 1, z]
    : face === "E" ? [x - 1, z]
    : face === "N" ? [x, z + 1]
    : [x, z - 1];
  if (!has(ix, iz)) continue;
  const inner = get(ix, iz);
  for (let y = B + 4; y < rf - 2; y += 2) {
    if (!winAt(x, z, face, y)) continue;
    if (a % 6 !== 2) continue;
    if (y <= base(inner) || y >= inner.rf - 1) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Pass 3: small roof bulkhead on the deck, supported by the deck below
if (RF <= 22 && has(1, 10) && has(2, 10) && has(1, 11) && has(2, 11)) {
  for (const [bx, bz] of [[1, 10], [2, 10], [1, 11], [2, 11]]) {
    put(bx, RF, bz, "bricks");
    put(bx, RF + 1, bz, "bricks");
    put(bx, RF + 2, bz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001548";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, D = 51, H = 68;
const MAX_TOP = 60;
const g = new Voxels([W, H, D]);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const S = (x, y, z, b, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};
const key = (x, z) => `${x},${z}`;

// footprint map: smooth roof into whole storeys of 2 blocks above the local ground
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.round(gr);
  const storeys = Math.max(4, Math.round((roof - ground) / 2));
  let top = Math.min(ground + 2 * storeys, MAX_TOP);
  if ((top - ground) % 2 === 1) top -= 1;
  map.set(key(x, z), { ground, top });
}

const has = (x, z) => map.has(key(x, z));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
function inward(x, z) {
  if (has(x + 1, z)) return [1, 0];
  if (has(x - 1, z)) return [-1, 0];
  if (has(x, z + 1)) return [0, 1];
  if (has(x, z - 1)) return [0, -1];
  return null;
}

// Pass 1: foundation, base, storeys, facade, interior slabs, roof, parapet
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  const { ground, top } = c;
  const perim = isPerim(x, z);

  for (let y = 0; y < ground; y++) S(x, y, z, "stone_bricks");

  // granite base course on the facade, slab on the interior
  S(x, ground, z, perim ? "polished_granite" : "light_gray_concrete");

  for (let y = ground + 1; y < top; y++) {
    const storeyRow = (y - ground) % 2;   // 0 = floor band, 1 = window row
    if (perim) {
      if (storeyRow === 0) {
        // white spandrel band reads as the floor line
        S(x, y, z, "white_concrete");
      } else {
        // mullion every 3 columns/rows and at corners, glass between
        const corner = (x === 0 || x === W - 1 || z === 0 || z === D - 1);
        const mullion = (x % 3 === 0) || (z % 3 === 0) || corner;
        S(x, y, z, mullion ? "light_gray_concrete" : "light_blue_stained_glass");
      }
    } else if (storeyRow === 0) {
      S(x, y, z, "light_gray_concrete");   // interior floor slab, air otherwise
    }
  }

  if (perim) {
    S(x, top, z, "smooth_stone");          // cornice
    S(x, top + 1, z, "white_concrete");    // parapet
  } else {
    S(x, top, z, "gray_concrete");         // roof membrane
  }
}

// Pass 2: entrance on the z=0 face: granite surround, glass doors, lit canopy
for (let x = 8; x <= 14; x++) {
  const c = map.get(key(x, 0));
  if (!c) continue;
  const { ground } = c;
  S(x, ground, 0, "polished_granite");
  for (let y = ground + 1; y <= ground + 2; y++) {
    if (x === 8 || x === 14) S(x, y, 0, "polished_granite");
    else S(x, y, 0, "glass");
  }
  S(x, ground + 3, 0, "smooth_stone");     // canopy line over the doors
  if (x === 9 || x === 13) S(x, ground + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 3: mechanical penthouse on the central roof
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  if (x < 5 || x > 17 || z < 14 || z > 36) continue;
  const base = c.top + 1;
  const ring = x === 5 || x === 17 || z === 14 || z === 36;
  if (ring) {
    for (let y = base; y <= base + 2; y++) {
      S(x, y, z, (x + y) % 2 === 0 ? "light_gray_concrete" : "gray_concrete");
    }
  }
  S(x, base + 3, z, "smooth_stone");
}

// Pass 4: warm lights just inside some facade windows
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const { ground, top } = c;
  for (let y = ground + 1; y < top; y++) {
    if ((y - ground) % 2 !== 1) continue;
    if ((x * 7 + z * 3 + y * 5) % 9 !== 0) continue;
    const d = inward(x, z);
    if (!d) continue;
    const ix = x + d[0], iz = z + d[1];
    if (!has(ix, iz)) continue;
    const ic = map.get(key(ix, iz));
    if (y <= ic.ground || y >= ic.top) continue;
    S(ix, y, iz, "glowstone");
  }
}

// Pass 5: corner roof lanterns on the parapet, so the tower corners catch the eye at dusk
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  if ((x === 0 || x === W - 1) && (z === 0 || z === D - 1)) {
    S(x, c.top + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 冠德花園城堡 — 1990s Taipei residential slab, 10 storeys + penthouse.
// Long white-tiled slab with a stone base, light-grey storey lines, blue glass
// window bands between white piers, a glazed lobby bay at the centre of the
// street face, and a stepped penthouse/plant block on the roof.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw383954678.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw383954678.nbt";

const W = 68, H = 66, D = 13;
const ROOF_Y = 54;
const PARAPET_Y = 55;
const PEN_TOP = 59;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inFp = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

const ext = (x, z) => ({
  n: !inFp(x, z - 1),
  s: !inFp(x, z + 1),
  w: !inFp(x - 1, z),
  e: !inFp(x + 1, z),
});
const isPerim = (x, z) => {
  const e = ext(x, z);
  return e.n || e.s || e.w || e.e;
};

const inPen = (x, z) => x >= 20 && x <= 47 && z >= 3 && z <= 9 && inFp(x, z);
const penPerim = (x, z) =>
  inPen(x, z) && (!inPen(x - 1, z) || !inPen(x + 1, z) || !inPen(x, z - 1) || !inPen(x, z + 1));

const inMech = (x, z) => x >= 52 && x <= 58 && z >= 4 && z <= 8 && inFp(x, z) && !inPen(x, z);

const GLASS = "light_blue_stained_glass_pane";
const DOOR = "dark_oak_door";
const LOBBY_X0 = 32, LOBBY_X1 = 36, DOOR_X = 34;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ALONG_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function facade(x, z, y, gr) {
  const e = ext(x, z);
  const along = (e.n || e.s) ? "x" : "z";
  const col = along === "x" ? x : z;
  const front = e.n;
  const r = y % 5;

  // Stone plinth
  if (y - gr < 2) return { id: "stone_bricks" };

  // Glazed lobby bay on the street face, door at centre
  if (front && x >= LOBBY_X0 && x <= LOBBY_X1 && z === 0) {
    if (y === gr + 2 || y === gr + 3) {
      if (x === DOOR_X) {
        const half = y === gr + 2 ? "lower" : "upper";
        return { id: DOOR, props: { facing: "north", half, hinge: "left", open: "false", powered: "false" } };
      }
      if (x === LOBBY_X0 || x === LOBBY_X1) return { id: "glowstone" };   // warm plinths
      return { id: GLASS, props: ALONG_X, glass: false };
    }
    if (y === gr + 4) return { id: "smooth_quartz" };                     // lobby lintel
  }

  if (r === 0) return { id: "light_gray_concrete" };
  if (r === 4) return { id: "white_concrete" };

  if (col % 4 === 0) return { id: "white_concrete" };
  return { id: GLASS, props: along === "x" ? ALONG_X : ALONG_Z, glass: true, r, col, e };
}

// ---- Main building ----
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  for (let y = gr; y < ROOF_Y; y++) {
    if (perim) {
      const f = facade(x, z, y, gr);
      put(x, y, z, f.id, f.props);
      if (f.glass && f.r === 2 && f.col % 12 === 6) {
        const e = f.e;
        if (e.n) put(x, y, 1, "glowstone");
        else if (e.s) put(x, y, D - 2, "glowstone");
        else if (e.w) put(1, y, z, "glowstone");
        else if (e.e) put(W - 2, y, z, "glowstone");
      }
    } else if (y === gr || y % 5 === 0) {
      put(x, y, z, "light_gray_concrete");
    }
  }

  put(x, ROOF_Y, z, "light_gray_concrete");

  if (perim && !inPen(x, z)) put(x, PARAPET_Y, z, "stone_bricks");

  if (inMech(x, z)) {
    put(x, PARAPET_Y, z, "light_gray_concrete");
    put(x, PARAPET_Y + 1, z, "light_gray_concrete");
  }
}

// ---- Penthouse on the roof ----
for (let x = 20; x <= 47; x++) {
  for (let z = 3; z <= 9; z++) {
    if (!inPen(x, z)) continue;
    if (penPerim(x, z)) {
      const alongX = (z === 3 || z === 9);
      const col = alongX ? x : z;
      for (let y = PARAPET_Y; y <= 58; y++) {
        if (y === PARAPET_Y || y === 58) { put(x, y, z, "smooth_quartz"); continue; }
        if (col % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }
        put(x, y, z, GLASS, alongX ? ALONG_X : ALONG_Z);
      }
    } else {
      put(x, PARAPET_Y, z, "light_gray_concrete");
    }
    put(x, PEN_TOP, z, "stone_bricks");
  }
}

put(33, 57, 6, "glowstone");

// ---- Plant room cap ----
for (let x = 52; x <= 58; x++)
  for (let z = 4; z <= 8; z++)
    if (inMech(x, z)) put(x, 57, z, "stone_bricks");

g.save(OUT);

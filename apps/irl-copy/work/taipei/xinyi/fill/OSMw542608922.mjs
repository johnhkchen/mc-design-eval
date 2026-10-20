import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shophouse-style 1970s-80s concrete block: 2 storeys (~11 blocks to parapet),
// stone-clad ground floor with red lintel band, white terracotta upper floor,
// glass panes in 3-bay rhythm, warm lights behind some glass, flat roof with tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608922";
const W = 15, H = 23, D = 28;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs), zmax = Math.max(...zs);
const minG = Math.min(...cells.map((c) => c[2]));

// Outward faces: W/E walls run along z, N/S walls run along x.
const AX = {
  W: { dx: -1, dz: 0, axis: "z", facing: "east" },
  E: { dx: 1, dz: 0, axis: "z", facing: "west" },
  N: { dx: 0, dz: -1, axis: "x", facing: "south" },
  S: { dx: 0, dz: 1, axis: "x", facing: "north" },
};
const facesOf = (x, z) =>
  Object.keys(AX).filter((k) => !has(x + AX[k].dx, z + AX[k].dz));

const perimeter = (x, z) => facesOf(x, z).length > 0;

// Window test: single-face cells only (corners are piers); piers every 3rd bay.
const bayOf = (x, z, face) => {
  const A = AX[face];
  const t = A.axis === "z" ? z : x;
  const lo = A.axis === "z" ? zmin : xmin;
  const hi = A.axis === "z" ? zmax : xmax;
  const win = t > lo && t < hi && (t - lo) % 3 !== 0;
  return { t, lo, hi, win };
};

const paneProps = (axis) =>
  axis === "z"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Ground-floor wall/window rules, relative to minG (r = y - minG).
const wallAt = (r, win, lit, face, x, z) => {
  if (r === 0) return ["stone_bricks"];
  if (r >= 1 && r <= 3) {
    if (win) return ["glass_pane", paneProps(AX[face].axis)];
    return ["stone_bricks"];
  }
  if (r === 4) return ["red_terracotta"];
  if (r === 5) return ["light_gray_concrete"];
  if (r === 6) return [win ? "light_gray_concrete" : "white_terracotta"];
  if (r === 7 || r === 8) {
    if (win) return ["glass_pane", paneProps(AX[face].axis)];
    return ["white_terracotta"];
  }
  if (r === 9) return ["white_terracotta"];
  return ["smooth_stone"]; // r 10, 11: roof deck edge / parapet
};

// Pass 1: foundations, floors, walls.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "light_gray_concrete"); // ground slab

  const faces = facesOf(x, z);
  if (faces.length === 0) {
    // Interior: storey floor slab and roof deck only; air between.
    if (minG + 5 >= gr) put(x, minG + 5, z, "light_gray_concrete");
    if (minG + 10 >= gr) put(x, minG + 10, z, "light_gray_concrete");
    continue;
  }

  const face = faces.length === 1 ? faces[0] : null;
  let win = false, lo = 0, hi = 0, t = 0;
  if (face) {
    const b = bayOf(x, z, face);
    win = b.win; lo = b.lo; hi = b.hi; t = b.t;
  }

  for (let r = 0; r <= 11; r++) {
    const y = minG + r;
    if (y < gr) continue;
    let w = { win: false };
    const storeyGlass = win && (r >= 1 && r <= 3 || r >= 7 && r <= 8);
    if (storeyGlass) w.win = true;
    const [id, props] = wallAt(r, storeyGlass, false, face || "W", x, z);
    if (face && storeyGlass && id === "glass_pane") {
      put(x, y, z, id, props);
    } else if (face && !win && r === 6 && id === "light_gray_concrete") {
      put(x, y, z, id);
    } else {
      put(x, y, z, id, props);
    }
  }
}

// Pass 2: warm lights behind selected windows, placed on the interior side.
for (const [x, z, gr] of cells) {
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const A = AX[face];
  const { win, t, lo } = bayOf(x, z, face);
  if (!win) continue;
  const ix = x - A.dx, iz = z - A.dz;
  if (!has(ix, iz) || perimeter(ix, iz)) continue;
  const igr = G.get(`${ix},${iz}`);
  const seed = (t - lo) * 3 + (x * 7 + z * 5);
  if (seed % 4 === 0) {
    const y = minG + 2;
    if (y > igr) put(ix, y, iz, "glowstone");
  } else if (seed % 4 === 2) {
    const y = minG + 7;
    if (y > igr) put(ix, y, iz, "shroomlight");
  }
}

// Pass 3: entrance on the W face, nearest the middle, double-height door.
{
  const mid = (zmin + zmax) / 2;
  let best = null;
  for (const [x, z, gr] of cells) {
    if (x !== xmin) continue;
    const f = facesOf(x, z);
    if (f.length !== 1 || f[0] !== "W") continue;
    const d = Math.abs(z - mid);
    if (!best || d < best.d) best = { x, z, gr, d };
  }
  if (best) {
    const doorProps = (half) => ({
      facing: AX.W.facing, half, hinge: "left", open: "false", powered: "false",
    });
    put(best.x, best.gr, best.z, "dark_oak_door", doorProps("lower"));
    put(best.x, best.gr + 1, best.z, "dark_oak_door", doorProps("upper"));
  }
}

// Pass 4: roof equipment: a water tank on the roof deck near centre.
{
  const xc = Math.floor((xmin + xmax) / 2);
  const zc = Math.floor((zmin + zmax) / 2);
  for (const dx of [0, 1]) {
    for (const dz of [0, 1]) {
      const x = xc + dx, z = zc + dz;
      if (!has(x, z)) continue;
      if (perimeter(x, z)) continue;
      put(x, minG + 11, z, "iron_block");
      put(x, minG + 12, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397471";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 22, H = 38, D = 17;
const g = new Voxels([W, H, D]);

// Roof deck layer, parapet layer. Storey lines sit where y % 5 === 0.
const R = 25;
const PARAPET = 26;

const KEY = (x, z) => `${x},${z}`;
const SIDES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// footprint: key -> ground (rounded, >= 0)
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(KEY(x, z), Math.max(0, Math.round(gr)));

const sidesOf = (x, z) =>
  Object.keys(SIDES).filter((s) => {
    const [dx, dz] = SIDES[s];
    return !foot.has(KEY(x + dx, z + dz));
  });

const idxOn = (side, x, z) => (side === "north" || side === "south" ? x : z);

const paneProps = (side) =>
  side === "north" || side === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Front (entrance) side: prefer south, else north. Door on the middle single-face cell.
const frontSide = [...foot.keys()].some((k) => {
  const [x, z] = k.split(",").map(Number);
  return sidesOf(x, z).includes("south");
}) ? "south" : "north";

let doorKey = null;
{
  const cands = [...foot.keys()]
    .map((k) => k.split(",").map(Number))
    .filter(([x, z]) => {
      const sd = sidesOf(x, z);
      return sd.length === 1 && sd[0] === frontSide;
    })
    .sort((a, b) => a[0] - b[0]);
  if (cands.length) doorKey = KEY(...cands[Math.floor(cands.length / 2)]);
}

// 1. Foundations, body, interiors, roof.
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);

  // foundation fill from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const sd = sidesOf(x, z);
  const facade = sd.length > 0;

  if (!facade) {
    // interior: floor slab per storey and roof deck, air otherwise
    for (let y = gr; y <= R; y++) {
      if (y === gr) put(x, y, z, "smooth_stone");
      else if (y === R) put(x, y, z, "light_gray_concrete");
      else if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const primary = sd[0];
  for (let y = gr; y <= R; y++) {
    const r = y % 5;
    let b = "white_concrete";
    let p;
    if (y === gr) {
      b = "stone_bricks"; // base course
    } else if (y === R) {
      b = "smooth_quartz"; // cornice cap
    } else if (r === 0) {
      b = "white_concrete"; // floor line
    } else if (r === 4) {
      b = "smooth_quartz"; // string course
    } else {
      const shopStorey = y < 5;
      const pier = sd.length > 1 || idxOn(primary, x, z) % 3 === 0;
      if (shopStorey) {
        b = pier ? "white_concrete" : "light_blue_stained_glass";
      } else if (pier) {
        b = "white_concrete";
      } else {
        b = "light_blue_stained_glass_pane";
        p = paneProps(primary);
      }
    }
    put(x, y, z, b, p);
  }

  // parapet on facade top
  put(x, PARAPET, z, "white_concrete");
}

// 2. Warm lights behind glass (inward interior cells, band layer r === 2).
for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);
  const sd = sidesOf(x, z);
  if (sd.length !== 1) continue;
  const side = sd[0];
  const [ox, oz] = SIDES[side];
  const ix = x - ox, iz = z - oz;
  const ik = KEY(ix, iz);
  if (!foot.has(ik) || sidesOf(ix, iz).length > 0) continue;
  const igr = foot.get(ik);
  for (let y = gr; y <= R; y++) {
    if (y % 5 !== 2) continue;
    if (y < igr) continue;
    const lit = y < 5 ? (x + z) % 2 === 0 : (x + z + y) % 4 === 0;
    if (lit) put(ix, y, iz, "glowstone");
  }
}

// 3. Entrance door, lintel with light above.
if (doorKey) {
  const [dx, dz] = doorKey.split(",").map(Number);
  const gd = foot.get(doorKey);
  const facing = OPP[frontSide];
  put(dx, gd, dz, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gd + 1, dz, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, gd + 2, dz, "smooth_quartz");
  // warm light just inside the lintel
  const [ox, oz] = SIDES[frontSide];
  put(dx - ox, gd + 2, dz - oz, "glowstone");
}

// 4. Roof plant room and mast.
{
  let sx = 0, sz = 0, n = 0;
  for (const k of foot.keys()) {
    const [x, z] = k.split(",").map(Number);
    sx += x; sz += z; n++;
  }
  const cx = Math.round(sx / n), cz = Math.round(sz / n);
  for (const [k, gr] of foot) {
    const [x, z] = k.split(",").map(Number);
    if (sidesOf(x, z).length > 0) continue;
    if (Math.abs(x - cx) > 3 || Math.abs(z - cz) > 2) continue;
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "light_gray_concrete");
    put(x, R + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  if (foot.has(KEY(cx, cz))) {
    for (let y = R + 4; y <= R + 6; y++) {
      put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

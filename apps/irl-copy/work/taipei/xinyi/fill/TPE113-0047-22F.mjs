import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE113-0047-22F: 2024 mid-rise, two storeys of ~5 blocks plus parapet, roof ~11 above lowest ground.
// Commercial ground floor with shopfront glazing, white-concrete spandrels and pillars,
// glass upper storey, quartz cornice, roof plant. Stepped with the site slope.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE113-0047-22F";
const W = 49, H = 23, D = 33;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: Math.round(c[2]) }
    : { x: c.x, z: c.z, g: Math.round(c.ground ?? c.g ?? 0) }
);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map((c) => [key(c.x, c.z), c]));
const has = (x, z) => cellMap.has(key(x, z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "east", dx: 1, dz: 0 },
  { n: "west", dx: -1, dz: 0 },
];

const perimOf = (c) => DIRS.filter((d) => !has(c.x + d.dx, c.z + d.dz));

// Entrance: north-facing street edge, middle of the run (fallback: any single-sided edge).
let doorKey = null;
let doorDir = null;
let doorCell = null;
{
  let cand = cells
    .map((c) => ({ c, outs: perimOf(c) }))
    .filter((o) => o.outs.length === 1 && o.outs[0].n === "north");
  if (cand.length === 0) {
    cand = cells
      .map((c) => ({ c, outs: perimOf(c) }))
      .filter((o) => o.outs.length === 1);
  }
  if (cand.length > 0) {
    cand.sort((a, b) => a.c.x - b.c.x || a.c.z - b.c.z);
    const pick = cand[Math.floor(cand.length / 2)];
    doorCell = pick.c;
    doorKey = key(pick.c.x, pick.c.z);
    doorDir = pick.outs[0];
  }
}

const paneProps = (axisZ) =>
  axisZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of cells) {
  const b = Math.max(0, c.g);
  const outs = perimOf(c);
  const perim = outs.length > 0;
  const corner = outs.length >= 2;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(c.x, y, c.z, "stone_bricks");

  // Floor slabs: ground floor (b), storey 2 (b+5), roof deck (b+10).
  if (perim) {
    put(c.x, b, c.z, "stone_bricks");        // base course / plinth
    put(c.x, b + 5, c.z, "white_concrete");  // storey-line spandrel
    put(c.x, b + 10, c.z, "smooth_quartz");  // cornice
  } else {
    put(c.x, b, c.z, "smooth_stone");
    put(c.x, b + 5, c.z, "smooth_stone");
    put(c.x, b + 10, c.z, "smooth_stone");
  }

  if (perim) {
    const out = outs[0];
    const axisZ = out.dz !== 0; // wall runs along X
    const k = axisZ ? c.x : c.z;
    const pillar = corner || k % 3 === 0;
    const isDoor = key(c.x, c.z) === doorKey;
    const inward = { x: c.x - out.dx, z: c.z - out.dz };
    const hasInward = has(inward.x, inward.z);
    const winProps = paneProps(axisZ);
    const litWindow = !pillar && k % 6 === 1 && hasInward;

    // Ground storey: shopfront glass b+1..b+3, spandrel b+4.
    for (let y = b + 1; y <= b + 3; y++) {
      if (isDoor && y <= b + 2) continue; // door set below
      if (pillar) put(c.x, y, c.z, "white_concrete");
      else put(c.x, y, c.z, "light_blue_stained_glass_pane", winProps);
    }
    put(c.x, b + 4, c.z, "white_concrete");

    // Upper storey: glass b+6..b+8, spandrel b+9.
    for (let y = b + 6; y <= b + 8; y++) {
      if (pillar) put(c.x, y, c.z, "white_concrete");
      else put(c.x, y, c.z, "light_blue_stained_glass_pane", winProps);
    }
    put(c.x, b + 9, c.z, "white_concrete");

    // Parapet.
    put(c.x, b + 11, c.z, "light_gray_concrete");

    // Warm lights behind selected glass.
    if (litWindow) {
      put(inward.x, b + 2, inward.z, "shroomlight");
      put(inward.x, b + 7, inward.z, "shroomlight");
    }

    // Entrance door: double-height, glass transom above.
    if (isDoor) {
      const facing = doorDir.n;
      put(c.x, b + 1, c.z, "dark_oak_door", {
        facing, half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(c.x, b + 2, c.z, "dark_oak_door", {
        facing, half: "upper", hinge: "left", open: "false", powered: "false",
      });
      put(c.x, b + 3, c.z, "light_blue_stained_glass_pane", winProps);
      // Hanging lantern under the cornice band, supported by the spandrel above.
      put(c.x, b + 4, c.z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else {
    // Interior roof plant: small AC units on a grid, standing on the roof deck.
    if (c.x % 7 === 3 && c.z % 7 === 3) {
      put(c.x, b + 11, c.z, "light_gray_concrete");
      put(c.x, b + 12, c.z, "iron_block");
    }
  }
}

// Door surround: quartz jambs on the neighbouring wall cells along the same face.
if (doorCell && doorDir) {
  const axisZ = doorDir.dz !== 0;
  const b = Math.max(0, doorCell.g);
  for (const off of [-1, 1]) {
    const nx = axisZ ? doorCell.x + off : doorCell.x;
    const nz = axisZ ? doorCell.z : doorCell.z + off;
    const n = cellMap.get(key(nx, nz));
    if (!n) continue;
    const nOuts = perimOf(n);
    if (nOuts.length !== 1 || nOuts[0].n !== doorDir.n) continue;
    const nb = Math.max(0, n.g);
    for (let y = nb + 1; y <= nb + 4; y++) put(nx, y, nz, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);

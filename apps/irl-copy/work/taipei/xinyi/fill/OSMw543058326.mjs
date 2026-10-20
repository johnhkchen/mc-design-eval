import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial block, c.1980s: white-tiled concrete frame, blue tinted
// curtain-wall glazing, a shopfront storey, a flat roof with a parapet, a mechanical
// penthouse, a stair tower and a lightning mast. Roof deck at y16 (about 17 above the lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw543058326";
const W = 13, H = 29, D = 24;
const DECK_Y = 16;
const PARAPET_Y = 17;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => Math.min(DECK_Y, ground.get(`${x},${z}`));

// outward directions: [dx, dz, name]
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => outward(x, z).length > 0;

// Entrance: the perimeter cell on the north (min z) side nearest the middle of the frontage.
let doorCell = null;
{
  const minZ = Math.min(...cells.map(c => c[1]));
  const cand = cells
    .filter(([x, z]) => z === minZ && isPerim(x, z))
    .sort((a, b) => Math.abs(a[0] - 6) - Math.abs(b[0] - 6));
  if (cand.length) doorCell = { x: cand[0][0], z: cand[0][1] };
}
const isDoor = (x, y, z) => doorCell && x === doorCell.x && z === doorCell.z && (y === groundAt(x, z) || y === groundAt(x, z) + 1);

const hash = (x, y, z) => ((x * 7 + y * 13 + z * 31) % 5) === 0;

function facade(x, y, z, u) {
  if (y === 4) return "white_concrete";                 // ground storey lintel band
  if (y < 4) {                                          // shopfront storey
    if (u % 3 === 0) return "white_concrete";
    return "glass";
  }
  if (y % STOREY === 0) return "light_gray_concrete";   // storey spandrel lines
  if (u % 3 === 0) return "white_concrete";             // window mullions
  return "light_blue_stained_glass";
}

// Pass 1: foundations, walls, floors, deck, parapet
for (const [x, z] of cells) {
  const gc = groundAt(x, z);
  // foundation fill from y0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const faces = outward(x, z);
  if (faces.length > 0) {
    const [dx, dz] = faces[0];
    const u = dz !== 0 ? x : z;
    for (let y = gc; y <= DECK_Y - 1; y++) {
      if (isDoor(x, y, z)) {
        const upper = y === gc + 1;
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: upper ? "upper" : "lower",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else {
        g.set(x, y, z, facade(x, y, z, u));
      }
    }
    // parapet on the perimeter
    g.set(x, PARAPET_Y, z, "white_concrete");
  } else {
    // interior: ground floor slab and storey floor slabs, air elsewhere (gap behind glass)
    for (let y = gc; y <= DECK_Y - 1; y++) {
      if (y === gc || y % STOREY === 0) g.set(x, y, z, "light_gray_concrete");
    }
  }

  // roof deck over the whole footprint
  g.set(x, DECK_Y, z, "light_gray_concrete");
}

// Pass 2: warm lights standing on interior floors, behind some upper-storey windows
for (const [x, z] of cells) {
  const faces = outward(x, z);
  if (!faces.length) continue;
  const [dx, dz] = faces[0];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const gc = groundAt(ix, iz);
  for (let fy = STOREY; fy < DECK_Y; fy += STOREY) {
    const ly = fy + 1;
    if (fy < gc || ly >= DECK_Y - 1) continue;
    if (hash(x, ly, z)) g.set(ix, ly, iz, "glowstone");
  }
}

// Pass 3: roof equipment on the deck
const inRect = (x0, x1, z0, z1, fn) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z)) fn(x, z);
};

// mechanical penthouse: x 4..8, z 7..15, walls y17..19, roof slab y20
inRect(4, 8, 7, 15, (x, z) => {
  const edge = x === 4 || x === 8 || z === 7 || z === 15;
  for (let y = 17; y <= 19; y++) {
    if (edge) g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, 20, z, "smooth_stone");
});

// stair tower: x 9..11, z 2..4, y17..21 solid, cap at y22
inRect(9, 11, 2, 4, (x, z) => {
  for (let y = 17; y <= 21; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, 22, z, "smooth_stone");
});

// lightning mast on the penthouse roof
if (has(6, 11)) {
  for (let y = 21; y <= 26; y++) g.set(6, y, 11, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

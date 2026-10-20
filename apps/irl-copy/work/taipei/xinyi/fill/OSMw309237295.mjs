// 大統領經貿廣場 (Presidential Business & Trade Plaza), Xinyi, Taipei.
// Late-1990s Taipei office tower: ~17 storeys of 5 blocks, light grey concrete
// frame with lighter blue glazing, white spandrels and bay ribs, a lit
// shopfront with a recessed lobby and lintel canopy, a set-back plant
// penthouse with a small crown, and a lightning rod.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309237295";
const W = 45, H = 95, D = 93;
const ROOF = 83;            // roof deck height above lowest ground (lidar)
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 2, Math.round(gr))));
}
const has = (x, z) => G.has(`${x},${z}`);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Storey lines are global, counted down from the roof deck, so floors line
// up across the whole building even where the ground steps.
const isLine = (y) => (ROOF - y) % STOREY === 0;
const firstLineAbove = (gr) => {
  let L = gr + 1;
  while (!isLine(L)) L++;
  return L;
};

// Which face of the footprint an edge cell sits on, its position along that
// face, whether it is a corner, and the inward direction.
function edgeInfo(x, z) {
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const n = +mN + +mS + +mW + +mE;
  if (n === 0) return null;
  const face = mN ? "n" : mS ? "s" : mW ? "w" : "e";
  const corner = n >= 2 && (mN || mS) && (mW || mE);
  const u = face === "n" || face === "s" ? x : z;
  const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[face];
  return { face, u, corner, inward };
}

// Entrance on the n face: a glazed door bay, with a wider lintel canopy above.
const DOOR_U = [20, 24];
const LINTEL_U = [19, 25];

// Penthouse, crown and roof plant rectangles.
const inP = (x, z) => x >= 12 && x <= 32 && z >= 30 && z <= 62;
const inC = (x, z) => x >= 17 && x <= 27 && z >= 40 && z <= 52;
const inM1 = (x, z) => x >= 4 && x <= 8 && z >= 10 && z <= 14;
const inM2 = (x, z) => x >= 36 && x <= 40 && z >= 74 && z <= 78;

// ---- Pass 1: foundations, body, roof deck, parapet -------------------------
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Plinth: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof deck over every footprint cell.
  put(x, ROOF, z, "light_gray_concrete");

  const e = edgeInfo(x, z);

  for (let y = gr; y < ROOF; y++) {
    const lineY = isLine(y);

    // Interior: only floor slabs at each storey line; the rest is air.
    if (!e) {
      if (lineY) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Edge: facade.
    const fl = firstLineAbove(gr);
    const ground = y < fl;
    const doorBay = e.face === "n" && e.u >= DOOR_U[0] && e.u <= DOOR_U[1];
    const lintelBay = e.face === "n" && e.u >= LINTEL_U[0] && e.u <= LINTEL_U[1];

    if (y === gr) {
      // Base course; the entrance gets a contrasting threshold stone.
      put(x, y, z, doorBay ? "smooth_stone" : "polished_andesite");
      continue;
    }
    if (lintelBay && ground && y === fl - 1) {
      // Entrance canopy: a 2-deep lintel slab over the lobby, on the piers.
      put(x, y, z, "white_concrete");
      const [dx, dz] = e.inward;
      if (has(x + dx, z + dz) && !edgeInfo(x + dx, z + dz)) {
        put(x + dx, y, z + dz, "white_concrete");
      }
      continue;
    }
    if (lineY) {
      put(x, y, z, "white_concrete");              // spandrel band
      continue;
    }

    const s = Math.floor((ROOF - y) / STOREY);     // storey index from top
    const bLine = ROOF - STOREY * (s + 1);         // line below this band
    const corner = e.corner;
    const rib = e.u % 6 === 0;                     // bay ribs in white
    const pier = corner || e.u % 3 === 0;

    if (ground && doorBay) {
      put(x, y, z, "glass");                       // lobby door bay
    } else if (corner || rib) {
      put(x, y, z, "white_concrete");              // ribs and corners
    } else if (pier) {
      put(x, y, z, "light_gray_concrete");         // mullions
    } else if (ground) {
      put(x, y, z, "light_blue_stained_glass");    // shopfront
    } else {
      put(x, y, z, "light_blue_stained_glass");    // curtain wall
    }

    // Warm light behind some windows, one block inside the glass.
    const lit = y === bLine + 2 && y >= gr && !pier && !corner && !rib;
    if (lit) {
      const [dx, dz] = e.inward;
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !edgeInfo(ix, iz)) {
        if (ground && doorBay && (e.u === 21 || e.u === 23)) {
          put(ix, y, iz, "shroomlight");          // lobby lamps
        } else if (((e.u + s) % 4) === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Parapet on the edge cells.
  if (e) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
  }
}

// ---- Pass 2: roof plant, penthouse, crown, lightning rod --------------------
for (const [key] of G) {
  const [x, z] = key.split(",").map(Number);

  // Roof mechanical boxes.
  if (inM1(x, z) || inM2(x, z)) {
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
  }

  // Penthouse: y 84..88, glazed band on the outside at y 86..87.
  if (inP(x, z)) {
    const border = x === 12 || x === 32 || z === 30 || z === 62;
    const pier = border && (x % 3 === 0 || z % 3 === 0);
    for (let y = ROOF + 1; y <= 88; y++) {
      if (y === 88) put(x, y, z, "white_concrete");
      else if (border && (y === 86 || y === 87) && !pier) put(x, y, z, "light_blue_stained_glass");
      else if (border) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_gray_concrete");
    }
  }

  // Crown: y 89..92 on top of the penthouse.
  if (inC(x, z) && inP(x, z)) {
    const border = x === 17 || x === 27 || z === 40 || z === 52;
    for (let y = 89; y <= 92; y++) {
      if (y === 92) put(x, y, z, "white_concrete");
      else if (border && (y === 90 || y === 91) && x % 3 !== 0 && z % 3 !== 0) put(x, y, z, "light_blue_stained_glass");
      else if (border) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_gray_concrete");
    }
  }
}

// Lightning rod on the crown centre.
if (has(22, 46)) {
  put(22, 93, 46, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(22, 94, 46, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);

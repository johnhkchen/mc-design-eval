import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3344163";
const W = 18, H = 33, D = 34;

// ---- load footprint: [x, z, ground, roof] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const c of raw) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  let ground = Math.max(0, Math.min(H - 8, Math.round(gr)));
  let roof = Math.round(rf);
  if (roof < ground + 4) roof = ground + 4;
  roof = Math.min(roof, H - 4);
  cells.set(`${x},${z}`, { x, z, ground, roof });
}

const has = (x, z) => cells.has(`${x},${z}`);
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const exposed = (c) => DIRS.filter(([dx, dz]) => !has(c.x + dx, c.z + dz));

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const SLAB = { type: "bottom", waterlogged: "false" };
const paneProps = (dx) =>
  dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Warm light check: is (x,y,z) an interior air cell sitting on a floor slab?
const interiorAirOk = (c, y) => {
  if (y < c.ground || y >= c.roof - 1) return false;
  const below = y - 1 - c.ground;
  return below >= 0 && below % 2 === 0 && exposed(c).length === 0;
};

// ---- pass 1: foundation, interiors, perimeter walls ----
const perimeterCells = [];
for (const c of cells.values()) {
  const { x, z, ground, roof } = c;

  // foundation / plinth
  for (let y = 0; y < ground; y++) set(x, y, z, "stone_bricks");

  const ex = exposed(c);
  if (ex.length === 0) {
    // hollow interior: floor slab per storey, air between, roof deck on top
    for (let b = ground; b < roof - 1; b += 2) set(x, b, z, "smooth_stone");
    set(x, roof - 1, z, "stone");
    continue;
  }

  perimeterCells.push(c);
  const isCorner = ex.length >= 2;
  const face = ex[0];
  const i = face[0] !== 0 ? z : x; // position along the wall

  for (let y = ground; y < roof; y++) {
    const k = Math.floor((y - ground) / 2);
    const r = (y - ground) % 2;
    let id = "bricks";
    let props = null;

    if (y === roof - 1) {
      id = "smooth_stone"; // cornice course
    } else if (r === 0) {
      id = "smooth_stone"; // storey line / sill band
    } else if (isCorner) {
      id = "stone_bricks"; // corner quoin
    } else {
      // window row: light stone piers, brick spandrels with glass between
      const isWindow = k === 0 ? (i % 4 !== 0) : (i % 4 === 1 || i % 4 === 2);
      if (isWindow) {
        id = "glass_pane";
        props = paneProps(face[0]);
      } else {
        id = "stone_bricks"; // pier
      }
    }
    set(x, y, z, id, props);
  }

  // parapet cap
  set(x, roof, z, "stone_brick_slab", SLAB);
}

// ---- pass 2: warm lights behind some upper-floor windows ----
for (const c of perimeterCells) {
  const ex = exposed(c);
  if (ex.length !== 1) continue;
  const face = ex[0];
  const i = face[0] !== 0 ? c.z : c.x;
  for (let y = c.ground + 1; y < c.roof - 1; y += 2) {
    const k = Math.floor((y - c.ground - 1) / 2);
    if (k === 0 || k % 2 !== 0) continue;
    if (i % 8 !== 1) continue;
    const ix = c.x - face[0];
    const iz = c.z - face[1];
    const ic = cells.get(`${ix},${iz}`);
    if (!ic) continue;
    if (interiorAirOk(ic, y)) set(ix, y, iz, "glowstone");
  }
}

// ---- pass 3: street entrance on the low-z (Manhattan-side) facade ----
const streetCands = perimeterCells.filter((c) => {
  const ex = exposed(c);
  return ex.length === 1 && ex[0][1] === -1;
});
if (streetCands.length) {
  const midX = (W - 1) / 2;
  streetCands.sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX));
  const d = streetCands[0];
  const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };

  // stone door surround: jambs flanking the door, lintel above
  for (const dx of [-1, 1]) {
    const jc = cells.get(`${d.x + dx},${d.z}`);
    if (!jc) continue;
    set(jc.x, jc.ground, jc.z, "stone_bricks");
    set(jc.x, jc.ground + 1, jc.z, "stone_bricks");
  }
  set(d.x, d.ground + 2, d.z, "stone_bricks"); // lintel above door

  set(d.x, d.ground, d.z, "oak_door", { ...doorBase, half: "lower" });
  set(d.x, d.ground + 1, d.z, "oak_door", { ...doorBase, half: "upper" });
}

// ---- pass 4: corner chimney stacks on the roofline ----
const corners = perimeterCells
  .filter((c) => exposed(c).length >= 2)
  .sort((a, b) => b.roof - a.roof);
if (corners.length) {
  const c = corners[0];
  for (let y = c.roof; y <= c.roof + 2 && y < H; y++) {
    set(c.x, y, c.z, "bricks");
  }
  set(c.x, c.roof + 3 < H ? c.roof + 3 : c.roof + 2, c.z, "stone_brick_slab", SLAB);
}

g.save(`${DIR}/${ID}.nbt`);

// Mid-century (c. 1975-1990) two-storey commercial block: white concrete wall
// bands with a grey base, glass-pane shopfronts and windows with white piers,
// a flat roof with parapet, rooftop AC units and a small stair hut.
// Storey lines sit at minG+5 and minG+10. The roof deck is at minG+11, and
// the parapet cap is at minG+12. Downhill cells carry foundation fill from y=0
// up to their own ground, and their walls run to the same roof level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608943";
const W = 20, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inF = (x, z) => G.has(`${x},${z}`);
const gndAt = (x, z) => G.get(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));

const ROOF = minG + 11;   // roof deck row
const PAR = ROOF + 1;     // parapet cap row
const ENT_X = Math.floor(W / 2) - 1;

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const edgeInfo = (x, z) => ({
  nN: !inF(x, z - 1), nS: !inF(x, z + 1),
  nW: !inF(x - 1, z), nE: !inF(x + 1, z),
});
const isEdge = (x, z) => {
  const e = edgeInfo(x, z);
  return e.nN || e.nS || e.nW || e.nE;
};

// Wall block for an exterior cell at height y (y above its own ground gr).
function edgeBlock(x, z, y, gr) {
  const { nN, nS, nW, nE } = edgeInfo(x, z);
  if (y === gr) return { id: "polished_andesite" };
  if (y === ROOF) return { id: "white_concrete" };          // parapet
  if (y === PAR) return { id: "stone_brick_slab", props: { type: "bottom", waterlogged: "false" } };
  const rel = y - minG;
  if (rel % 5 === 0) return { id: "light_gray_concrete" };   // floor band / sill
  if (rel % 5 === 4) return { id: "white_concrete" };         // lintel
  // window rows (rel%5 in 1..3)
  const onZ = nN || nS, onX = nW || nE;
  const pierZ = x % 4 === 0 || x === 0 || x === W - 1;
  const pierX = z % 4 === 0 || z === 0 || z === D - 1;
  let pier;
  if (onZ && onX) pier = true;
  else if (onZ) pier = pierZ;
  else pier = pierX;
  const isEntrance = nS && x === ENT_X && z === D - 1;
  if (isEntrance) {
    if (rel % 5 === 1 || rel % 5 === 2) return null;         // doorway opening
    if (rel % 5 === 3) return { id: "glass_pane" };          // transom
  }
  if (pier) return { id: "white_concrete" };
  return { id: "glass_pane" };
}

// 1. Foundations, floors, walls, roof deck
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // foundation fill from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  if (!edge) {
    // interior: ground floor slab and storey floor slabs, air between
    S(x, gr, z, "light_gray_concrete");
    for (const L of [minG + 5, minG + 10]) {
      if (L >= gr) S(x, L, z, "light_gray_concrete");
    }
  } else {
    // exterior walls from just above ground to the parapet cap
    for (let y = gr; y <= PAR; y++) {
      const b = y === gr ? { id: "polished_andesite" } : edgeBlock(x, z, y, gr);
      if (!b) continue;
      S(x, y, z, b.id, b.props);
    }
  }

  // roof deck over the whole footprint (edge cells already carry parapet)
  if (!edge) S(x, ROOF, z, "light_gray_concrete");
}

// 2. Stair hut on the roof (3x3 cells, door on south face)
const hutOK = [];
for (let x = 2; x <= 4; x++) for (let z = 2; z <= 4; z++) hutOK.push(inF(x, z));
if (hutOK.every(Boolean)) {
  for (let x = 2; x <= 4; x++) {
    for (let z = 2; z <= 4; z++) {
      const perim = x === 2 || x === 4 || z === 2 || z === 4;
      if (perim) {
        const doorway = x === 3 && z === 4;
        for (let y = ROOF + 1; y <= ROOF + 3; y++) {
          if (doorway && y <= ROOF + 2) continue;
          S(x, y, z, "white_concrete");
        }
      }
      S(x, ROOF + 4, z, "light_gray_concrete");
    }
  }
}

// 3. Rooftop AC units (iron blocks on the deck, inside the footprint)
for (let x = 2; x <= 17; x++) {
  for (let z = 2; z <= 14; z++) {
    if (!inF(x, z) || isEdge(x, z)) continue;
    if (x >= 2 && x <= 4 && z >= 2 && z <= 4) continue;
    if ((x * 7 + z * 3) % 13 === 0) S(x, PAR, z, "iron_block");
  }
}

// 4. Entrance lantern inside the shop
if (inF(ENT_X, D - 2) && !isEdge(ENT_X, D - 2)) {
  S(ENT_X, minG + 1, D - 2, "lantern", { hanging: "false", waterlogged: "false" });
}

// 5. Warm lights behind some window panes (glowstone in the interior air)
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const { nN, nS, nW, nE } = edgeInfo(x, z);
  let dx = 0, dz = 0;
  if (nN) dz = 1; else if (nS) dz = -1;
  else if (nW) dx = 1; else if (nE) dx = -1;
  const cx = x + dx, cz = z + dz;
  if (!inF(cx, cz) || isEdge(cx, cz)) continue;
  for (const rel of [2, 7]) {
    const y = minG + rel;
    if (y <= gr || y <= gndAt(cx, cz)) continue;
    if ((x * 5 + z * 3 + y) % 4 !== 0) continue;
    const b = edgeBlock(x, z, y, gr);
    if (!b || b.id !== "glass_pane") continue;
    S(cx, y, cz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

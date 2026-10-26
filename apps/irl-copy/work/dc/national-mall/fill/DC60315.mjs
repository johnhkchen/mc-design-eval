// DC60315: a Federal-era limestone office block on the Mall, 31 x 12 footprint, three storeys over a stone plinth,
// a central double-door entrance on the north (z = 0) front, a rooftop penthouse, and a wall shell with an air gap
// behind the glass and a floor slab per storey. Storey lines are absolute (the same on the downhill side), so the
// ragged footprint reads as one building; the plinth stands on each cell's own ground and nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60315.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 31, Z = 12, Y = 20;
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, r });
const has = (x, z) => foot.has(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;

// Lidar roof height, smoothed: the mean of the footprint cells within two blocks, rounded into the 6..8 tiers
const roof = (x, z) => {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const c = foot.get(`${x + dx},${z + dz}`); if (c) { s += c.r; n++; }
  }
  return Math.min(8, Math.max(6, Math.round(s / n)));
};
// which sides of a cell are open to the air (no footprint cell beyond them)
const faces = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });
const exterior = (x, z) => { const f = faces(x, z); return f.n || f.s || f.w || f.e; };
// a facade cell: the wall's bay index (along the face) and whether it is a window (not a pier, not a corner)
const facade = (x, z) => {
  const f = faces(x, z), zFace = f.n || f.s, xFace = f.w || f.e;
  const bay = zFace ? x : z;
  return { f, zFace, corner: zFace && xFace, bay, open: zFace !== xFace ? bay % 3 !== 0 : false };
};
const inward = (x, z) => {
  const f = faces(x, z);
  return f.n ? [x, z + 1] : f.s ? [x, z - 1] : f.w ? [x + 1, z] : f.e ? [x - 1, z] : null;
};
// the entrance bay: x 13..16 on the north front, doors at 14 and 15, pilasters at 13 and 16
const entranceBay = (x, z) => z === 0 && x >= 13 && x <= 16;

const GLASS_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane in a wall running along x
const GLASS_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane in a wall running along z

// warm lights behind some windows, and two lanterns inside the entrance
const lights = new Map();
for (const [k, c] of foot) {
  const [x, z] = k.split(",").map(Number);
  if (!exterior(x, z)) continue;
  const fa = facade(x, z), nb = inward(x, z);
  if (!fa.open || !nb || !has(...nb) || exterior(...nb)) continue;
  const [ix, iz] = nb;
  if (fa.bay % 6 === 1) lights.set(key(ix, 2, iz), ["glowstone"]);
  if (fa.bay % 6 === 4 && roof(ix, iz) - 1 > 5) lights.set(key(ix, 5, iz), ["glowstone"]);
}
lights.set(key(14, 2, 1), ["lantern", { hanging: "false", waterlogged: "false" }]);
lights.set(key(15, 2, 1), ["lantern", { hanging: "false", waterlogged: "false" }]);

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const R = roof(x, z);
  const ext = exterior(x, z);
  const fa = facade(x, z);
  const entrance = fa.zFace && faces(x, z).n && entranceBay(x, z);

  for (let y = 0; y < R; y++) {
    const lit = lights.get(key(x, y, z));
    if (!ext) {                                       // interior: stone under, a floor slab per storey, air between, roof deck on top
      if (y <= 1) put(x, y, z, "stone_bricks");
      else if (y === R - 1) put(x, y, z, "stone");
      else if (y === 4) put(x, y, z, "smooth_stone");
      else if (lit) put(x, y, z, lit[0], lit[1]);
      continue;
    }
    // exterior shell
    if (y <= 1) { put(x, y, z, y === 1 ? "chiseled_stone_bricks" : "stone_bricks"); continue; }   // plinth and base course
    if (y === R - 1) { put(x, y, z, "smooth_stone"); continue; }                                 // cornice on top of the wall
    if (y === 4) { put(x, y, z, entrance ? "polished_andesite" : "smooth_stone"); continue; }     // string course; entrance lintel
    if (entrance && y <= 3) {                                                                     // entrance: doors, pilasters
      if (x === 14 || x === 15) {
        const half = y === 2 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: x === 14 ? "left" : "right", open: "false", powered: "false" });
      } else put(x, y, z, "chiseled_stone_bricks");
      continue;
    }
    if (fa.open && (y === 2 || y === 3 || (y >= 5 && y <= R - 2))) {                              // windows: glass with an air gap behind
      put(x, y, z, "glass_pane", fa.zFace ? GLASS_X : GLASS_Z);
      continue;
    }
    put(x, y, z, "calcite");                                                                      // piers and blank wall
  }
}

// rooftop penthouse, set back from the parapet line, on the roof deck of each cell it stands on
for (let z = 3; z <= 8; z++) for (let x = 12; x <= 18; x++) {
  if (!has(x, z)) continue;
  const R = roof(x, z);
  const edge = x === 12 || x === 18 || z === 3 || z === 8;
  const corner = (x === 12 || x === 18) && (z === 3 || z === 8);
  for (let y = R; y < R + 2 && edge; y++) {                    // walls only: the room inside is air
    if (y === R && !corner) put(x, y, z, "glass_pane", z === 3 || z === 8 ? GLASS_X : GLASS_Z);
    else put(x, y, z, "calcite");
  }
  put(x, R + 2, z, "smooth_stone");
}

// mechanical plant on the flat roof, outside the penthouse
for (const [x, z] of [[4, 6], [5, 6], [25, 5], [26, 5], [24, 9]]) {
  if (has(x, z) && !exterior(x, z)) put(x, roof(x, z), z, "light_gray_concrete");
}

const stats = g.save(`${DIR}/DC60315.nbt`);
console.log(JSON.stringify(stats));

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw359743631";
const W = 69, H = 23, D = 43;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let F = 0;
for (const [x, z, gr] of cells) {
  const r = Math.round(gr);
  ground.set(key(x, z), r);
  if (r > F) F = r;
}
const inSet = (x, z) => ground.has(key(x, z));
const outwardDirs = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inSet(x + dx, z + dz));
const isPerim = (x, z) => outwardDirs(x, z).length > 0;

// Level plan relative to F:
//  F        ground floor slab
//  F+1..F+4 ground storey (shopfront glass, lintel)
//  F+5      storey line / upper floor slab
//  F+6..F+9 upper storey windows
//  F+10     roof deck, red cornice on perimeter
//  F+11     parapet coping; roof plant and sign above
const WALL = "white_concrete";
const FRAME = "light_gray_concrete";

// Entrance on the north face (outward -z), centred on that face.
const northFace = cells.filter(([x, z]) => {
  const o = outwardDirs(x, z);
  return o.length === 1 && o[0][0] === 0 && o[0][1] === -1;
});
const northXs = northFace.map(([x]) => x).sort((a, b) => a - b);
const entranceX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;
const isEntranceCell = (x, z) =>
  northXs.length > 0 && (x === entranceX || x === entranceX + 1) &&
  northFace.some(([cx, cz]) => cx === x && cz === z);

for (const [x, z] of cells) {
  // Plinth from y0 to the floor datum.
  for (let y = 0; y < F; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, storey line, roof deck.
  g.set(x, F, z, "smooth_stone");
  g.set(x, F + 5, z, "smooth_stone");
  g.set(x, F + 10, z, "smooth_stone");

  const out = outwardDirs(x, z);
  if (out.length === 0) continue;

  // Perimeter walls, white with storey line and cornice.
  for (let y = F + 1; y <= F + 9; y++) g.set(x, y, z, WALL);
  g.set(x, F + 5, z, "red_terracotta");
  g.set(x, F + 10, z, "red_terracotta");
  g.set(x, F + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  if (out.length >= 2) {
    for (let y = F + 1; y <= F + 9; y++) {
      if (y === F + 5) continue;
      g.set(x, y, z, FRAME);
    }
    continue;
  }

  const [dx] = out[0];
  const i = dx !== 0 ? z : x;
  const paneProps = dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const isPillar = i % 3 === 0;

  // Ground storey: shopfront glass with frames.
  if (isPillar) {
    for (let y = F + 1; y <= F + 4; y++) g.set(x, y, z, FRAME);
  } else {
    for (let y = F + 1; y <= F + 3; y++) g.set(x, y, z, "glass_pane", paneProps);
    g.set(x, F + 4, z, FRAME);
  }

  // Upper storey: window bays.
  if (isPillar) {
    for (let y = F + 6; y <= F + 9; y++) g.set(x, y, z, FRAME);
  } else {
    for (let y = F + 6; y <= F + 9; y++) g.set(x, y, z, "glass_pane", paneProps);
    if (i % 6 === 2) {
      const ix = x - dx, iz = z - (dx === 0 ? (out[0][1]) : 0);
      const inx = x - out[0][0], inz = z - out[0][1];
      if (inSet(inx, inz) && !isPerim(inx, inz)) g.set(inx, F + 7, inz, "glowstone");
    }
  }
}

// Entrance: a glazed bay framed by pillars and a red lintel, lit from inside.
for (const [x, z] of cells) {
  if (!isEntranceCell(x, z)) continue;
  for (let y = F + 1; y <= F + 3; y++) g.set(x, y, z, "glass");
  g.set(x, F + 4, z, "red_terracotta");
}
// Door-surround pillars on the outer edges of the entrance bay.
for (const edge of [entranceX - 1, entranceX + 2]) {
  if (!northFace.some(([cx]) => cx === edge)) continue;
  for (let y = F + 1; y <= F + 4; y++) g.set(edge, y, northFace.find(([cx]) => cx === edge)[1], "gold_block");
}
// Lanterns just inside the doorway, hanging from the storey slab.
for (const [x, z] of cells) {
  if (!isEntranceCell(x, z)) continue;
  const iz = z + 1;
  if (inSet(x, iz) && !isPerim(x, iz)) {
    g.set(x, F + 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof plant: small boxes on the roof deck, kept off the parapet.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x % 14 === 7 && z % 12 === 6) {
    const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => {
      const cx = x + a, cz = z + b;
      return inSet(cx, cz) && !isPerim(cx, cz);
    });
    if (ok) {
      for (let y = F + 11; y <= Math.min(H - 1, F + 12); y++)
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]])
          g.set(x + a, y, z + b, "light_gray_concrete");
    }
  }
}

// Rooftop hotel sign: a short gold-and-red stack on the north roofline, centred on the entrance.
if (entranceX >= 0) {
  const sx = entranceX;
  const sz = (northFace.find(([cx]) => cx === sx) || [0, 0])[1] + 2;
  if (inSet(sx, sz) && !isPerim(sx, sz)) {
    for (let y = F + 11; y <= Math.min(H - 1, F + 13); y++) {
      g.set(sx, y, sz, y === F + 13 ? "gold_block" : "red_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

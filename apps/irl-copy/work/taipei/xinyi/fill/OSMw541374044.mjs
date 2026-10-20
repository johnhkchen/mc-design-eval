import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374044";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Architecture: a two-storey Xinyi-era (1980s-90s) concrete commercial block.
// Stone plinth, white concrete piers, glass-pane window bays, storey bands,
// flat roof with parapet and rooftop plant. Hollow inside (air gap behind glass).
const ROOF = 11;     // roof membrane at y=11 (about 11 blocks above lowest ground)
const BAND_1 = 5;    // storey line between floors
const BAND_2 = 10;   // cornice band under roof
const PARAPET = 12;  // parapet course at y=12, cap at y=13

const key = (x, z) => `${x},${z}`;
const S = new Map();
for (const [x, z, gr] of cells) {
  S.set(key(x, z), Math.min(Math.max(0, gr | 0), 9));
}
const has = (x, z) => S.has(key(x, z));
const faceOf = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Choose the main entrance: a single-face north-exposed (or any single-face) cell near mid-span.
let doorKey = null, doorFace = null;
{
  const singles = [];
  for (const [x, z] of cells) {
    const f = faceOf(x, z);
    const ex = Object.keys(f).filter((k) => f[k]);
    if (ex.length === 1) singles.push({ x, z, face: ex[0] });
  }
  const prefer = singles.filter((c) => c.face === "N");
  const pool = prefer.length ? prefer : singles;
  if (pool.length) {
    const mx = pool.reduce((a, c) => a + c.x, 0) / pool.length;
    const mz = pool.reduce((a, c) => a + c.z, 0) / pool.length;
    pool.sort((a, b) => (Math.abs(a.x - mx) + Math.abs(a.z - mz)) - (Math.abs(b.x - mx) + Math.abs(b.z - mz)));
    doorKey = key(pool[0].x, pool[0].z);
    doorFace = pool[0].face;
  }
}
const FACING = { N: "north", S: "south", W: "west", E: "east" };

for (const [x, z] of cells) {
  const gr = S.get(key(x, z));
  const f = faceOf(x, z);
  const exposed = Object.keys(f).filter((k) => f[k]);
  const perim = exposed.length > 0;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, air otherwise (no interiors modelled).
    g.set(x, gr, z, "smooth_stone");
    if (gr < BAND_1) g.set(x, BAND_1, z, "smooth_stone");
    g.set(x, ROOF, z, "stone_bricks");
    continue;
  }

  const single = exposed.length === 1 ? exposed[0] : null;
  const onNS = single === "N" || single === "S";
  // Window bays on single-face cells; corners and inner cells become piers.
  const isPillar = !single || (onNS ? x % 3 === 0 : z % 3 === 0);
  const isDoor = single && key(x, z) === doorKey && single === doorFace;

  for (let y = gr; y <= BAND_2; y++) {
    if (isDoor && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: FACING[single],
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (y === gr) {
      g.set(x, y, z, "polished_andesite");
    } else if (y === BAND_1 || y === BAND_2) {
      g.set(x, y, z, "smooth_stone");
    } else if (y === 4 || isPillar || !single) {
      g.set(x, y, z, "white_concrete");
    } else {
      const paneProps = onNS
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", paneProps);
    }
  }

  // Roof membrane, parapet and cap on the perimeter.
  g.set(x, ROOF, z, "stone_bricks");
  g.set(x, PARAPET, z, "white_concrete");
  g.set(x, PARAPET + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Warm lights behind some glass: lanterns standing on interior floors.
for (const [x, z] of cells) {
  const gr = S.get(key(x, z));
  const f = faceOf(x, z);
  const perim = Object.values(f).some(Boolean);
  if (perim || gr > 4) continue;
  if ((x * 7 + z * 3) % 5 === 0) g.set(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  if ((x + 2 * z) % 4 === 0) g.set(x, 6, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Rooftop plant: a few air-conditioning / mechanical boxes near the centre.
for (const [x, z] of cells) {
  if (x < 5 || x > 12 || z < 5 || z > 12) continue;
  const f = faceOf(x, z);
  if (Object.values(f).some(Boolean)) continue;
  if ((x + z) % 3 === 0) {
    g.set(x, PARAPET, z, "iron_block");
  } else if ((x * z) % 7 === 0) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86614";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 32, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup and extents
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { gr, rf });
const has = (x, z) => map.has(`${x},${z}`);
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = (minX + maxX) / 2;
const doorL = Math.floor(midX), doorR = Math.ceil(midX);

// A cell is on the perimeter if any 4-neighbour is outside the footprint
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const storeyTop = (rf, gr) => {
  const k = Math.max(2, Math.round((rf - gr) / 3));
  let R = gr + 3 * k;
  if (R > H - 4) R = H - 4;
  return R;
};

// Pass 1: foundations, walls, cornices, interior floors and roof decks
for (const [x, z, gr, rf] of cells) {
  const G = gr;
  const R = storeyTop(rf, gr);

  // Foundation from y0 up to the cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const isPerim = zFace || xFace;

  if (isPerim) {
    const along = zFace ? x : z;
    const minA = zFace ? minX : minZ;
    const maxA = zFace ? maxX : maxZ;
    const corner = zFace && xFace;
    const front = zFace && z === minZ;

    for (let y = G; y <= R - 2; y++) {
      const s = y - G;
      if (s % 3 === 0) {
        // Storey band / base course
        g.set(x, y, z, s === 0 ? "stone_bricks" : "quartz_block");
      } else if (front && (x === doorL || x === doorR) && s <= 1) {
        // Double entrance doors on the street face
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: s === 0 ? "lower" : "upper",
          hinge: x === doorL ? "left" : "right",
          open: "false",
          powered: "false",
        });
      } else if (front && (x === doorL || x === doorR) && s === 2) {
        // Granite lintel over the entrance
        g.set(x, y, z, "polished_granite");
      } else if (front && (x === doorL - 1 || x === doorR + 1) && s <= 2) {
        // Granite door surround flanks
        g.set(x, y, z, "polished_granite");
      } else if (corner || along === minA || along === maxA) {
        // Corner piers
        g.set(x, y, z, "quartz_pillar", { axis: "y" });
      } else if (along % 2 === 0) {
        // Intermediate piers: vertical pillar relief so the wall reads as bays
        g.set(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        // Window panes, connected along the face
        const props = zFace
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        g.set(x, y, z, "glass_pane", props);
      }
    }

    // Cornice on top of the wall
    g.set(x, R - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  } else {
    // Interior: floor slabs per storey and a light roof deck; air otherwise
    for (let y = G; y <= R - 2; y++) {
      if ((y - G) % 3 === 0) g.set(x, y, z, "smooth_stone");
    }
    g.set(x, R - 1, z, "stone");
  }
}

// Pass 2: warm lights behind a sparse set of windows
for (const [x, z, gr, rf] of cells) {
  const G = gr;
  const R = storeyTop(rf, gr);
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  if (!(zFace || xFace)) continue;
  if (zFace && xFace) continue;
  const along = zFace ? x : z;
  const minA = zFace ? minX : minZ;
  const maxA = zFace ? maxX : maxZ;
  if (along === minA || along === maxA || along % 2 === 0) continue;
  const front = zFace && z === minZ;
  for (let y = G + 4; y <= R - 3; y++) {
    const s = y - G;
    if (s % 3 !== 1) continue;
    if (along % 8 !== 1) continue;
    if (front && (x === doorL || x === doorR)) continue;
    let ix = x, iz = z;
    if (zFace) iz = z === minZ ? z + 1 : z - 1;
    else ix = x === minX ? x + 1 : x - 1;
    if (!has(ix, iz) || perim(ix, iz)) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Pass 3: rooftop penthouse and mechanical units
for (const [x, z, gr, rf] of cells) {
  const G = gr;
  const R = storeyTop(rf, gr);
  if (perim(x, z)) continue;

  const pent = x >= minX + 2 && x <= minX + 3 && z >= minZ + 6 && z <= minZ + 10 && R + 2 < H;
  if (pent) {
    const edgeZ = z === minZ + 6 || z === minZ + 10;
    for (let y = R; y <= R + 1; y++) {
      if (edgeZ) {
        g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      } else {
        g.set(x, y, z, "smooth_quartz");
      }
    }
    g.set(x, R + 2, z, "quartz_block");
    continue;
  }

  if (R + 1 < H && ((x === minX + 4 && z === minZ + 3) || (x === minX + 1 && z === minZ + 13))) {
    g.set(x, R, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);

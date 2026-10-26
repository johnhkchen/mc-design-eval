import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86633: no record, so read as a c.1905-1915 Beaux-Arts brick office block:
// a stone base, brick walls, limestone storey lines and cornice, a solid brick
// parapet with stone coping, paired window bays, and a central entrance on the north face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86633";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 28, D = 5;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);

const put = (x, y, z, id, st) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const glassStates = (face) =>
  face === "NS"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: foundations, walls, floors, cornice, parapet, coping.
for (const [x, z, gr0, roof0] of cells) {
  const gr = Math.round(gr0);
  const roof = Math.round(roof0);

  // Roof surface clamped to grid. Cornice at T, parapet at T+1, coping slab at T+2.
  const top = Math.min(roof, 25);
  const T = Math.max(gr + 1, top - 3);

  const outN = !has(x, z - 1), outS = !has(x, z + 1);
  const outW = !has(x - 1, z), outE = !has(x + 1, z);
  const perim = outN || outS || outW || outE;
  const corner = (outN || outS) && (outW || outE);
  const faceNS = (outN || outS) && !(outW || outE);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Body: walls on the perimeter, floor slabs in the interior at each storey line.
  for (let y = gr; y <= T; y++) {
    const rel = y - gr;
    if (perim) {
      if (y === T) put(x, y, z, "calcite");            // cornice course
      else if (rel % 3 === 0) put(x, y, z, "calcite"); // storey line
      else put(x, y, z, "bricks");
    } else if (rel % 3 === 0 || y === T) {
      put(x, y, z, "smooth_stone");                     // floor slabs / roof slab
    }
  }

  // Solid brick parapet above the cornice, capped with a stone coping slab.
  if (perim) {
    put(x, T + 1, z, "bricks");
    put(x, T + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Window bays on non-corner perimeter cells; ground floor entrance on north face.
  if (perim && !corner) {
    const face = faceNS ? "NS" : "EW";
    for (let y = gr; y < T; y++) {
      const rel = y - gr;
      if (rel % 3 === 0) continue;
      const isGround = rel < 3;
      if (outN && isGround && rel === 2) {
        put(x, y, z, "smooth_quartz");                  // lintel over ground floor
        continue;
      }
      if (outN && isGround && x === 2 && rel < 2) {
        const half = rel === 0 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      put(x, y, z, "glass_pane", glassStates(face));
    }
  }
}

// Pass 2: roof equipment and warm light, after the shell is complete.
for (const [x, z, gr0, roof0] of cells) {
  const gr = Math.round(gr0);
  const roof = Math.round(roof0);
  const top = Math.min(roof, 25);
  const T = Math.max(gr + 1, top - 3);
  const perim = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

  if (!perim && x === 2 && z === 2) {
    // Warm light behind the centre of each even storey.
    for (let k = 0; ; k++) {
      const b = gr + 3 * k;
      if (b + 1 >= T) break;
      if (k % 2 === 0) put(x, b + 1, z, "glowstone");
    }
    // Small roof-top mechanical box on the centre of the roof.
    put(x, T + 1, z, "stone_bricks");
    put(x, T + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

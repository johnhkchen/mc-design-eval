import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shin Kong Mitsukoshi A9, Xinyi: a stone-and-glass department-store block of the
// early 2000s. Lidar roof ~11 blocks above lowest ground: two 5-block storeys,
// a light parapet, a solid rooftop plant tier, and a centred recessed entrance on
// both long faces with a glass shopfront at street level.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw269773066";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 65, H = 23, D = 119;
const g = new Voxels([W, H, D]);

const ROOF = 11;     // lidar roof height above lowest ground (blocks)
const STOREY = 5;    // blocks per storey
const PLATE = "light_gray_concrete";

const S = (x, y, z, b, p) => { if (y >= 0 && y < H) g.set(x, y, z, b, p); };

const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of groundOf.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

// Rooftop plant tier: smaller, centred, solid with a light cap.
const tierIn = (x, z) =>
  x >= minX + 22 && x <= maxX - 22 && z >= minZ + 34 && z <= maxZ - 34;

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(H - 3, gr0));
  const top = Math.min(H - 2, Math.max(ROOF, gr + STOREY));

  // Foundation / plinth from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "smooth_stone");

  const perimeter = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const zFace = !has(x, z + 1) || !has(x, z - 1);   // exterior on a z-facing side
  const xFace = !has(x + 1, z) || !has(x - 1, z);   // exterior on an x-facing side
  const idx = (x + z) % 4;

  // Centred entrance on each long face (z-faces: along x; x-faces: along z).
  const entranceZ = zFace && Math.abs(x - cx) <= 3;
  const entranceX = xFace && !zFace && Math.abs(z - cz) <= 3;
  const entrance = entranceZ || entranceX;
  const entDx = entranceZ ? Math.abs(x - cx) : Math.abs(z - cz);
  const entCentre = entrance && entDx <= 1;

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const isRoofDeck = y === top - 1;

    if (!perimeter) {
      // Interior: floor slabs per storey, roof deck, otherwise an air gap behind glass.
      if (isRoofDeck) S(x, y, z, "light_gray_concrete");
      else if (rel % STOREY === 0) S(x, y, z, PLATE);
      continue;
    }

    // Facade cells.
    if (rel === 0) { S(x, y, z, "polished_granite"); continue; }        // base course
    if (isRoofDeck) { S(x, y, z, "smooth_quartz"); continue; }          // parapet cap

    if (rel < STOREY) {
      // Ground storey.
      if (entrance) {
        if (entDx === 2) { S(x, y, z, "smooth_quartz"); continue; }     // portal piers
        if (rel === 3 && entCentre) {
          S(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          continue;
        }
        if (rel <= 2 && entDx <= 1) { S(x, y, z, "glass"); continue; }  // doorway
        S(x, y, z, "smooth_quartz"); continue;                          // lintel
      }
      if (idx === 0) { S(x, y, z, "polished_andesite"); continue; }
      if (rel === 3 && idx === 2 && ((x * 7 + z * 3) % 9 === 0)) {
        S(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      S(x, y, z, "glass");
      continue;
    }

    if (rel % STOREY === 0) { S(x, y, z, PLATE); continue; }            // storey spandrel

    if (entrance && rel === STOREY) {                                   // entrance lintel above portal
      S(x, y, z, "smooth_quartz");
      continue;
    }

    if (idx === 1 || idx === 2) {
      if (((x + z) * 5 + rel) % 17 === 0) S(x, y, z, "shroomlight");
      else S(x, y, z, "glass");
    } else {
      S(x, y, z, "white_concrete");                                     // mullion
    }
  }

  // Rooftop plant tier: solid, louvred, light cap; stands on the roof deck.
  if (tierIn(x, z)) {
    const tierTop = Math.min(H - 1, top + 3);
    const edge = !tierIn(x + 1, z) || !tierIn(x - 1, z) || !tierIn(x, z + 1) || !tierIn(x, z - 1);
    for (let y = top; y < tierTop; y++) {
      if (y === tierTop - 1) S(x, y, z, "smooth_quartz");
      else if (edge) S(x, y, z, ((x + z + y) % 2 === 0) ? "white_concrete" : "light_gray_concrete");
      else S(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${dir}/${id}.nbt`);

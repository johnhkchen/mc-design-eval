import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858018";
const W = 20, H = 23, D = 22;

// Reading: no record, so this is a generic 1980s-90s Taipei two-storey commercial block:
// white tiled concrete frame, dark-glass bays, grey roof deck, plant room and AC units.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const B = Math.max(...cells.map(c => c[2])); // ground-floor slab level (highest cell ground)

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) => Object.keys(FACES).filter(f => {
  const [dx, dz] = FACES[f];
  return !inFp(x + dx, z + dz);
});
// along-wall coordinate and its last index for a face
const along = (f, x, z) => (f === "N" || f === "S") ? x - minX : z - minZ;
const alongLast = f => (f === "N" || f === "S") ? maxX - minX : maxZ - minZ;

// only footprint cells are ever written
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!inFp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = f => (f === "N" || f === "S")
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

const doorProps = half => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// 1. foundation: solid from y 0 up to the ground-floor slab level under every cell
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
}

// 2. slabs, base course, storey lines, cornice and roof deck
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fs = faces(x, z);
  const perim = fs.length > 0;
  put(x, B, z, perim ? "stone_bricks" : "smooth_stone");          // base course / ground slab
  put(x, B + 5, z, perim ? "white_concrete" : "smooth_stone");    // storey line / upper floor slab
  put(x, B + 10, z, perim ? "white_concrete" : "gray_concrete");  // cornice / roof deck
}

// 3. walls: window grid with frames, shopfront and entrance on the north (min z) face
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fs = faces(x, z);
  if (fs.length === 0) continue;
  const corner = fs.length > 1;
  const f = fs[0];
  const k = along(f, x, z);
  const last = alongLast(f);
  const [dx, dz] = FACES[f];
  const doorK = Math.floor(last / 2);

  for (let tier = 0; tier < 2; tier++) {
    const base = tier === 0 ? B + 1 : B + 6;
    for (let r = 0; r < 4; r++) {
      const y = base + r;
      if (r === 0) {
        put(x, y, z, "polished_andesite");
        continue;
      }
      if (r === 3) {
        if (tier === 0 && f === "N") put(x, y, z, "dark_oak_planks"); // shop awning band
        else put(x, y, z, "smooth_quartz");                          // lintel
        continue;
      }
      // r = 1 or 2: glass bays between pillars
      const pillar = corner || k % 4 === 0 || k === last;
      const isDoor = tier === 0 && f === "N" && k === doorK && !corner;

      if (isDoor) {
        put(x, y, z, "dark_oak_door", doorProps(r === 1 ? "lower" : "upper"));
        continue;
      }
      if (pillar) {
        put(x, y, z, "white_concrete");
        continue;
      }
      if (tier === 0 && f === "N") {
        put(x, y, z, "light_blue_stained_glass");   // shopfront glazing
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(f));
      }
    }
  }
}

// 4. warm lights set back behind some glazed bays (interior cells only)
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const fs = faces(x, z);
  if (fs.length === 0 || fs.length > 1) continue;
  const f = fs[0];
  const k = along(f, x, z);
  const last = alongLast(f);
  const pillar = k % 4 === 0 || k === last;
  if (pillar) continue;
  const [dx, dz] = FACES[f];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || faces(ix, iz).length > 0) continue;
  if (k % 8 === 2) put(ix, B + 7, iz, "glowstone");   // upper floor, behind glass
  if (k % 8 === 6 && !(f === "N" && (tier => false)())) put(ix, B + 2, iz, "shroomlight");
}

// 5. roof plant: AC units on the deck and a small stair/plant core in the middle
const cx = Math.round((minX + maxX) / 2), cz = Math.round((minZ + maxZ) / 2);
const inCore = (x, z) => Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (faces(x, z).length > 0) continue;
  if (inCore(x, z)) continue;
  if ((x * 7 + z * 3) % 9 === 0) put(x, B + 11, z, "light_gray_concrete");
}
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (faces(x, z).length > 0 || !inCore(x, z)) continue;
  put(x, B + 11, z, "smooth_quartz");
  put(x, B + 12, z, "smooth_quartz");
  put(x, B + 13, z, "gray_concrete");
}
put(cx, B + 14, cz, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);

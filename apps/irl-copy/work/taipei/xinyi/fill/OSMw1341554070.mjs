import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341554070";
const W = 7, H = 43, D = 7;

// Record: 6-storey 1990s Taipei mid-rise, cream-tiled concrete, tinted glass
// windows, dark mullions, shopfront base, parapet with AC plant and a rod.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...cells.map((c) => c[2]));   // lowest ground = y 0 reference for storeys
const TOP = B + 30;                               // parapet ring level (roof surface at TOP+1 = 31 above)

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exteriorFaces = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const f = exteriorFaces(x, z);
  return f.n || f.s || f.w || f.e;
};
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
const outName = { n: "north", s: "south", w: "west", e: "east" };
const paneProps = (f) =>
  f === "n" || f === "s"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Door face: prefer south, then north, then east, then west.
const pickDoorFace = (f) => ["s", "n", "e", "w"].find((k) => f[k]);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exteriorFaces(x, z);
  const faces = ["n", "s", "w", "e"].filter((k) => ex[k]);
  const perim = faces.length > 0;

  if (!perim) {
    // Interior cell: floor slabs per storey and the roof deck, air elsewhere.
    for (let y = gr; y <= TOP - 1; y++) {
      const rel = y - B;
      if (y === gr || rel % 5 === 0 || rel === 29) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  const corner = faces.length >= 2;
  const face = faces[0];
  const doorFace = pickDoorFace(ex);

  for (let y = gr; y <= TOP; y++) {
    const rel = y - B;

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }      // base course
    if (rel === 30) { put(x, y, z, "white_concrete"); continue; }   // parapet
    if (rel === 29) { put(x, y, z, "smooth_stone"); continue; }     // cornice / roof deck
    if (rel % 5 === 0) { put(x, y, z, "smooth_stone"); continue; }  // storey line
    if (rel % 5 === 4) { put(x, y, z, "white_concrete"); continue; } // spandrel

    // Window zone (rel % 5 in 1..3)
    if (corner) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    const idx = face === "n" || face === "s" ? x : z;
    if (idx % 2 === 0) {
      put(x, y, z, "light_gray_concrete"); // mullion
      continue;
    }

    // Entrance door on the chosen door face, centred.
    if (face === doorFace && idx === 3 && (rel === 1 || rel === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: outName[face],
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    put(x, y, z, "cyan_stained_glass_pane", paneProps(face));

    // Warm light behind some windows, inside the air gap.
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (rel === 2 && has(ix, iz) && !isPerim(ix, iz) && (idx + rel + x + z) % 3 === 0) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// Rooftop plant: AC block and a short lightning rod on the centre cell.
if (has(3, 3)) {
  put(3, TOP + 1, 3, "iron_block");
  for (let k = 2; k <= 4; k++) {
    put(3, TOP + k, 3, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

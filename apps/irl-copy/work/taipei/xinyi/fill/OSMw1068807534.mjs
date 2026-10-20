import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise commercial block, Xinyi, c. 1970s-80s: two storeys on a
// stone-bricked plinth, white-concrete piers between glazed bays, a red fascia
// over the shopfront (south/front face), a light-gray storey line, a cornice
// and parapet, and a roof deck with plant. Roof cap at y 11 (lidar ~11 above
// lowest ground). Storey lines are absolute: ground storey 0..4, upper 5..9.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807534";
const W = 27, H = 23, D = 10;
const FLOOR2 = 5;   // storey line / upper floor slab
const TOP = 10;     // parapet course; roof deck sits at this level

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw
  .map(([x, z, gr]) => [Math.round(x), Math.round(z), Math.min(10, Math.max(0, Math.round(gr)))])
  .filter(([x, z]) => x >= 0 && x < W && z >= 0 && z < D);

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },   // street / front face
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const missingOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isInterior = (x, z) => has(x, z) && missingOf(x, z).length === 0;

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Entrance: middle of the front (south-facing) frontage.
const frontCells = cells.filter(([x, z]) => {
  const m = missingOf(x, z);
  return m.length === 1 && m[0].name === "south";
});
const frontXs = frontCells.map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const doorCell = frontCells.find(([x]) => x === doorX);
const doorZ = doorCell ? doorCell[1] : -1;

// 1) Foundations, interior slabs and roof decks, then 2) the perimeter facades.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const miss = missingOf(x, z);
  if (miss.length === 0) {
    // Interior: upper floor slab (air gap above ground floor) and roof deck.
    if (gr <= FLOOR2) put(x, FLOOR2, z, "smooth_stone");
    put(x, TOP, z, "gray_concrete");
    continue;
  }

  const corner = miss.length > 1;
  const face = corner ? null : miss[0];
  const isFrontFace = !!face && face.name === "south";
  // Index along the facade: x for north/south faces, z for east/west faces.
  const idx = face && face.dz !== 0 ? x : z;
  const pier = corner || idx % 4 === 0;
  const doorHere = isFrontFace && x === doorX && z === doorZ && gr + 2 <= 3;
  const paneProps = face && face.dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y <= TOP; y++) {
    if (y === TOP) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet
      continue;
    }
    if (y === gr && gr <= 3) {
      put(x, y, z, "stone_bricks"); // plinth course
      continue;
    }
    if (y === 9) {
      put(x, y, z, "smooth_stone"); // cornice band
      continue;
    }
    if (y === FLOOR2) {
      put(x, y, z, "light_gray_concrete"); // storey line
      continue;
    }
    if (y === 4) {
      put(x, y, z, isFrontFace && !corner ? "red_concrete" : "light_gray_concrete"); // fascia
      continue;
    }
    if (y <= 3) {
      // Ground storey: shopfront glazing between piers, entrance on the front.
      if (pier) put(x, y, z, "white_concrete");
      else if (doorHere && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "oak_door", {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else put(x, y, z, "glass_pane", paneProps);
    } else {
      // Upper storey (6..8): window grid with white piers.
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    }
  }

  // Warm lights behind some glass.
  if (face && !corner) {
    const ix = x - face.dx;
    const iz = z - face.dz;
    if (!pier && idx % 8 === 2) {
      // Upper window: glowstone standing on the upper floor slab, inside.
      const gIn = gAt(ix, iz);
      if (isInterior(ix, iz) && gIn !== undefined && gIn <= FLOOR2 && FLOOR2 + 1 <= 8) {
        put(ix, FLOOR2 + 1, iz, "glowstone");
      }
    }
    if (isFrontFace && !pier && !doorHere && idx % 4 === 2) {
      // Shopfront: lantern standing on the shop floor, behind the glass.
      const gIn = gAt(ix, iz);
      if (isInterior(ix, iz) && gIn !== undefined && gIn >= 1 && gIn <= 2) {
        put(ix, gIn, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// 3) Roof plant on interior roof-deck cells (deck at y 10, equipment from y 11).
const roofPut = (x, y, z, id, props) => {
  if (isInterior(x, z)) put(x, y, z, id, props);
};
// Two AC condenser boxes.
for (const [x0, z0] of [[4, 2], [9, 6]]) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    roofPut(x0 + dx, 11, z0 + dz, "light_gray_concrete");
  }
}
// Steel water tank, two high.
for (let dz = 0; dz < 2; dz++) {
  roofPut(20, 11, 4 + dz, "iron_block");
  roofPut(20, 12, 4 + dz, "iron_block");
}
// Lightning rod on the parapet corner of the roof.
roofPut(24, 11, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

vox.save(`${DIR}/${ID}.nbt`);

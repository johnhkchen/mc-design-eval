import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1960s-70s reinforced-concrete two-storey commercial block: a white-concrete
// frame with pier-and-bay windows, a shopfront ground floor under a dark
// fascia, a parapet roof, and a small penthouse with roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807433";
const W = 30, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// footprint lookup
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const inF = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

// outward offsets: [dx, dz, name]
const OUT = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// footprint bounds for centring entrance and penthouse
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midX = Math.floor((minX + maxX) / 2);
const midZ = Math.floor((minZ + maxZ) / 2);

const STONE = "stone_bricks";
const FLOOR = "smooth_stone";
const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const DARK = "gray_concrete";
const GLASS = "light_blue_stained_glass";

for (const [x, z, G] of cells) {
  const outs = OUT.filter(([dx, dz]) => !inF(x + dx, z + dz));
  const perimeter = outs.length > 0;

  // foundation fill from y0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, STONE);

  // ground-level base course / floor slab
  put(x, G, z, perimeter ? STONE : FLOOR);

  // storey 1 (b = G) and storey 2 (b = G+5)
  for (let s = 0; s < 2; s++) {
    const b = G + 5 * s;

    if (perimeter) {
      const alongZ = outs.some(([, dz]) => dz !== 0); // north/south face -> t = x
      const t = alongZ ? x : z;
      const corner = outs.length >= 2;
      const pier = corner || t % 3 === 0;
      const [ox, oz] = outs[0];
      const inX = x - ox, inZ = z - oz;

      if (s === 0) {
        const isEntrance = outs.some(([, dz, n]) => n === "south" && dz === 1) &&
          Math.abs(x - midX) <= 1;
        if (pier) {
          for (let y = b + 1; y <= b + 4; y++) put(x, y, z, WALL);
        } else if (isEntrance) {
          // recessed entrance opening with hanging lanterns under a lintel
          put(x, b + 4, z, DARK);
          if (x === midX) put(x, b + 3, z, "lantern", { hanging: "true" });
        } else {
          put(x, b + 1, z, STONE);                       // plinth
          put(x, b + 2, z, GLASS);                       // shopfront glass
          put(x, b + 3, z, GLASS);
          put(x, b + 4, z, DARK);                        // fascia band
          if (t % 6 === 1 && inF(inX, inZ)) put(inX, b + 2, inZ, "glowstone");
        }
        // entrance column bays are piers/entrance; ensure fascia over whole front
        if (pier && !corner) put(x, b + 4, z, WALL);
      } else {
        if (pier) {
          for (let y = b + 1; y <= b + 4; y++) put(x, y, z, WALL);
        } else {
          put(x, b + 1, z, TRIM);                        // sill
          put(x, b + 2, z, t % 6 === 4 ? "shroomlight" : GLASS);
          put(x, b + 3, z, GLASS);
          put(x, b + 4, z, TRIM);                        // lintel
          if (t % 6 === 1 && inF(inX, inZ)) put(inX, b + 2, inZ, "glowstone");
        }
      }
    }

    // floor slab / roof slab across the whole footprint
    put(x, b + 5, z, FLOOR);
  }

  // parapet on the roof edge
  if (perimeter) put(x, G + 11, z, TRIM);
}

// roof penthouse: a box on the roof slab, fully within the footprint
const px0 = midX - 4, px1 = midX + 4, pz0 = midZ - 3, pz1 = midZ + 3;
let penthouseOk = true;
for (let x = px0; x <= px1 && penthouseOk; x++)
  for (let z = pz0; z <= pz1; z++)
    if (!inF(x, z)) { penthouseOk = false; break; }

if (penthouseOk) {
  for (let x = px0; x <= px1; x++) {
    for (let z = pz0; z <= pz1; z++) {
      const G = groundAt(x, z);
      const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
      if (edge) {
        for (let y = G + 11; y <= G + 13; y++) put(x, y, z, "smooth_quartz");
        // small windows on the penthouse faces
        if ((x === px0 || x === px1) && z === midZ) put(x, G + 12, z, GLASS);
        if ((z === pz0 || z === pz1) && x === midX) put(x, G + 12, z, GLASS);
        // roof cap
        put(x, G + 14, z, TRIM);
      } else {
        put(x, G + 14, z, TRIM);
      }
    }
  }
}

// rooftop plant units (iron blocks) on the roof, away from the penthouse
const plant = [[minX + 3, midZ - 4], [maxX - 3, midZ + 4], [minX + 3, midZ + 4]];
for (const [x, z] of plant) {
  if (!inF(x, z) || (penthouseOk && x >= px0 - 1 && x <= px1 + 1 && z >= pz0 - 1 && z <= pz1 + 1)) continue;
  const G = groundAt(x, z);
  put(x, G + 11, z, "iron_block");
  put(x, G + 12, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);

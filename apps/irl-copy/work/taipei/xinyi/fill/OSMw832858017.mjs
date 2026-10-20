import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record for this parcel, so the era is inferred from the lidar: roof about 11 blocks
// (about 8 m) above the lowest ground means two storeys of 5 blocks plus a parapet.
// Read as a 1970s-90s Xinyi low-rise commercial block: white-tiled concrete frame, a
// shopfront ground floor with pillars and glass, grey concrete roof slab, a smooth-stone
// cornice and a parapet, with a few rooftop AC units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858017";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 18, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const S = new Map(cells.map(([x, z, gy]) => [`${x},${z}`, gy]));
const has = (x, z) => S.has(`${x},${z}`);
const groundOf = (x, z) => S.get(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Absolute levels are measured from the lowest ground (B). Roof top is B+11.
const B = Math.min(...cells.map(c => c[2]));
const TOP = Math.min(B + 11, H - 1);
const SOLID = (x, y, z, id, props) => { if (y >= 0 && y < H) g.set(x, y, z, id, props); };

// Pane orientation: a wall running along x uses east/west connections, otherwise north/south.
const paneProps = (x, z) => {
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};
const alongIndex = (x, z) => (!has(x, z - 1) || !has(x, z + 1)) ? x : z;

// Inward neighbour for a perimeter cell, used to place lights behind glass.
const inward = (x, z) => {
  if (!has(x, z - 1) && has(x, z + 1)) return [x, z + 1];
  if (!has(x, z + 1) && has(x, z - 1)) return [x, z - 1];
  if (!has(x - 1, z) && has(x + 1, z)) return [x + 1, z];
  if (!has(x + 1, z) && has(x - 1, z)) return [x - 1, z];
  return null;
};

// Front door: south-facing perimeter cell (no neighbour at z+1) nearest the middle of the width.
let door = null;
for (const [x, z] of cells) {
  if (perim(x, z) && !has(x, z + 1)) {
    if (!door || Math.abs(x - W / 2) < Math.abs(door[0] - W / 2)) door = [x, z];
  }
}

for (const [x, z, gy] of cells) {
  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gy; y++) SOLID(x, y, z, "stone_bricks");

  const isP = perim(x, z);
  const alongI = alongIndex(x, z);

  // Floor slab at ground level.
  SOLID(x, gy, z, isP ? "stone_bricks" : "gray_concrete"); // base course / floor

  for (let y = gy + 1; y <= TOP; y++) {
    const t = y - B;

    if (t === 5) { SOLID(x, y, z, isP ? "smooth_stone" : "gray_concrete"); continue; }   // storey line / floor
    if (t === 10) { SOLID(x, y, z, isP ? "smooth_stone" : "gray_concrete"); continue; }  // cornice / roof slab
    if (t === 11) {
      if (isP) SOLID(x, y, z, "gray_concrete");                                         // parapet
      else if (x % 6 === 3 && z % 6 === 3) SOLID(x, y, z, "light_gray_concrete");        // AC unit
      continue;
    }
    if (!isP) continue; // interior air

    // Ground storey: shopfront with pillars, glazing and a lintel.
    if (t >= 1 && t <= 3) {
      if (door && x === door[0] && z === door[1] && t <= 2) {
        SOLID(x, y, z, "oak_door", {
          facing: "south", half: t === 1 ? "lower" : "upper", hinge: "left",
          open: "false", powered: "false",
        });
        continue;
      }
      if (alongI % 3 === 0) SOLID(x, y, z, "white_concrete");
      else SOLID(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
      continue;
    }
    if (t === 4) { SOLID(x, y, z, "white_concrete"); continue; } // ground lintel

    // Upper storey: window grid with pillars, header at t=9.
    if (t >= 6 && t <= 8) {
      if (alongI % 3 === 0) SOLID(x, y, z, "white_concrete");
      else SOLID(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
      continue;
    }
    if (t === 9) { SOLID(x, y, z, "white_concrete"); continue; } // upper header
  }

  // Warm lights behind some upper-floor windows (glowstone on the floor slab).
  if (isP && !(door && x === door[0] && z === door[1])) {
    if ((x * 7 + z * 3) % 5 === 0) {
      const inn = inward(x, z);
      if (inn) {
        const [ix, iz] = inn;
        const yL = B + 6;
        if (has(ix, iz) && yL > groundOf(ix, iz) && alongIndex(x, z) % 3 !== 0) {
          SOLID(ix, yL, iz, "glowstone");
        }
      }
    }
  }
}

// Lantern just inside the entrance, standing on the ground floor slab.
if (door) {
  const [dx, dz] = door;
  const gy = groundOf(dx, dz);
  const inn = inward(dx, dz);
  if (inn && has(inn[0], inn[1])) {
    SOLID(inn[0], gy + 1, inn[1], "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1303423584";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 19, D = 26;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(gy)));
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces missing from neighbours
function outward(x, z) {
  const f = [];
  if (!has(x, z + 1)) f.push("south");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x - 1, z)) f.push("west");
  return f;
}

// Entrance: centred on the south (+z) face
const ENTRY_X = [4, 5, 6];

for (const [x, z, gc] of cells) {
  const out = outward(x, z);
  const perim = out.length > 0;
  const corner = out.length >= 2;

  // Foundation: solid from y 0 up to the ground surface
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  put(x, gc, z, "smooth_stone");

  // Floor / base course at gc+1
  put(x, gc + 1, z, perim ? "smooth_stone" : "light_gray_concrete");

  // Facade
  if (perim) {
    const onSouth = out.includes("south");
    const onNorth = out.includes("north");
    const idx = (onSouth || onNorth) ? x : z;
    const pier = corner || idx % 3 === 0;
    const isEntry = onSouth && ENTRY_X.includes(x);

    for (let y = gc + 2; y <= gc + 4; y++) {
      if (isEntry) {
        if (y === gc + 4 && x === 5) {
          // Hanging lantern under the blue band
          put(x, y, z, "lantern", { hanging: "true" });
        } else if (y === gc + 4) {
          // leave air above the door frame
        } else {
          put(x, y, z, "glass");
        }
      } else if (pier) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "glass");
      }
    }
    // Blue storey band (Bannan-line tone) at the top course
    put(x, gc + 5, z, "blue_concrete");
  } else {
    // Interior: air, with occasional warm lights just behind the glass line
    if ((x * 3 + z * 5) % 7 === 0) put(x, gc + 2, z, "glowstone");
  }

  // Roof slab at gc+6 across the whole footprint; cornice on the perimeter
  put(x, gc + 6, z, perim ? "smooth_stone" : "gray_concrete");

  // Parapet on the perimeter, with corners stepped up in chiselled stone
  if (perim) {
    put(x, gc + 7, z, corner ? "chiseled_stone_bricks" : "smooth_stone");
  }
}

// Roof plant: small mast on the roof near the centre
const mx = 5, mz = 13;
if (has(mx, mz)) {
  const mg = ground.get(`${mx},${mz}`);
  put(mx, mg + 7, mz, "iron_block");
  put(mx, mg + 8, mz, "iron_block");
  put(mx, mg + 9, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);

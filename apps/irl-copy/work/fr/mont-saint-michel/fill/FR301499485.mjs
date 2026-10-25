import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499485";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 44, H = 31, D = 36;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
const inside = (x, z) => fp.has(key(x, z));
const perim = (x, z) => !inside(x + 1, z) || !inside(x - 1, z) || !inside(x, z + 1) || !inside(x, z - 1);

// Massing: ground, storeys of about 5 blocks, wall top from lidar roof height.
for (const [x, z, gr, rf] of cells) {
  const G = Math.max(0, Math.round(gr));
  const R = Math.min(Math.round(rf), H - 5);
  let n = Math.max(1, Math.round((R - G) / 5));
  if (G + 5 * n > H - 5) n = Math.max(1, Math.floor((H - 5 - G) / 5));
  fp.set(key(x, z), { x, z, G, n, top: G + 5 * n });
}

// Entrance: south-facing perimeter cell nearest the middle of that face.
const southFace = [...fp.values()].filter(c => perim(c.x, c.z) && !inside(c.x, c.z + 1));
let entranceKey = null;
let entranceX = null;
if (southFace.length) {
  const mx = southFace.reduce((s, c) => s + c.x, 0) / southFace.length;
  const best = southFace.reduce((b, c) => (Math.abs(c.x - mx) < Math.abs(b.x - mx) ? c : b));
  entranceKey = key(best.x, best.z);
  entranceX = best.x;
}

for (const c of fp.values()) {
  const { x, z, G, n, top } = c;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone");

  if (perim(x, z)) {
    // Facade: render walls, stone pilasters every 4 bays, string courses,
    // glazed bays between, shopfront at ground, striped awning.
    const onN = !inside(x, z - 1), onS = !inside(x, z + 1);
    const u = (onN || onS) ? x : z; // position along the facade
    const isEntrance = key(x, z) === entranceKey;
    const pier = (u % 4 === 0);

    for (let y = G; y < top; y++) {
      const k = Math.floor((y - G) / 5);
      const r = (y - G) % 5;
      let b;
      if (y === top - 1) {
        b = "stone_bricks"; // cornice / parapet
      } else if (k === 0 && r === 0) {
        b = "stone_bricks"; // plinth
      } else if (k === 0 && r === 4) {
        // striped shopfront awning band
        b = (u % 2 === 0) ? "red_terracotta" : "white_terracotta";
      } else if (k === 0) {
        b = pier ? "stone_bricks" : "glass"; // shopfront glazing between piers
      } else if (r === 0) {
        b = "stone_bricks"; // storey string course
      } else if (r === 4) {
        b = pier ? "stone_bricks" : "calcite"; // lintel band with piers
      } else if (r === 1) {
        // sill row: stone at piers, dark sill beneath glazing
        b = pier ? "stone_bricks" : "dark_oak_trapdoor_placeholder";
        b = pier ? "stone_bricks" : "stone_brick_slab";
      } else {
        // window glazing: two panes per four-bay, pier columns in stone
        b = pier ? "stone_bricks" : (u % 4 === 2 ? "glass" : "glass");
      }
      if (b === "dark_oak_trapdoor_placeholder") b = "stone_bricks";
      g.set(x, y, z, b);
    }

    // Entrance: framed doorway with lintel, door in the middle of the shopfront.
    if (isEntrance && G + 2 < top - 1) {
      const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
      g.set(x, G + 1, z, "dark_oak_door", { ...props, half: "lower" });
      g.set(x, G + 2, z, "dark_oak_door", { ...props, half: "upper" });
      g.set(x, G + 3, z, "stone_bricks");
    }
    // Flank the entrance with stone jambs so it reads from the street.
    if (!isEntrance && entranceX !== null && Math.abs(x - entranceX) === 1 && onS && G + 3 < top) {
      g.set(x, G + 1, z, "stone_bricks");
      g.set(x, G + 2, z, "stone_bricks");
    }
  } else {
    // Interior: floor slabs per storey, air gap, roof cover, warm light behind glazing.
    const nearEdge = perim(x + 1, z) || perim(x - 1, z) || perim(x, z + 1) || perim(x, z - 1);
    for (let y = G; y < top; y++) {
      const r = (y - G) % 5;
      const k = Math.floor((y - G) / 5);
      if (y === G) {
        g.set(x, y, z, "smooth_stone");
      } else if (y === top - 1) {
        g.set(x, y, z, "deepslate_tiles");
      } else if (r === 0) {
        g.set(x, y, z, "smooth_stone");
      } else if (nearEdge && r === 2 && (x * 7 + z * 3 + k) % 4 === 0) {
        g.set(x, y, z, (k === 0) ? "glowstone" : "shroomlight");
      }
    }
    // Chimney stacks on the slate roof.
    if (x % 10 === 5 && z % 12 === 6) {
      for (let y = top - 1; y <= Math.min(top + 2, H - 1); y++) g.set(x, y, z, "bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

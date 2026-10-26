import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87218.cells.json`, "utf8"));

const W = 14, H = 30, D = 5;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells: [x, z, ground, roof]
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(`${x},${z}`, { gr, roof });
const has = (x, z) => map.has(`${x},${z}`);

// Flatten the lidar roof into one main tier (median), keep clearly lower wings
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const tierRoof = (roof) => (Math.abs(roof - medRoof) <= 2 ? medRoof : roof);

// Glass pane connections: long faces run along x (connect east/west),
// short faces run along z (connect north/south)
const PANE_LONG = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_SHORT = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const ROOF_SLAB = { type: "bottom", waterlogged: "false" };

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const { gr, roof } = map.get(`${x},${z}`);
    const G = gr;
    const R = Math.max(G + 8, tierRoof(roof));

    const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
    const onLong = z === 0 || z === D - 1;
    const onShort = x === 0 || x === W - 1;
    const cornerZ = z === 0 || z === D - 1;
    const pillarCol = onLong ? (x % 3 === 0) : cornerZ;
    const entranceOpen = z === 0 && (x === 6 || x === 7);
    const entranceFrame = z === 0 && (x === 5 || x === 8);

    // Foundation from y0 up to this cell's ground
    for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

    // Base course
    g.set(x, G, z, "chiseled_stone_bricks");

    for (let y = G + 1; y <= R - 1; y++) {
      const rel = y - G;
      const storeyLine = rel % 4 === 0;

      if (perim) {
        if (y === R - 2) { g.set(x, y, z, "smooth_quartz"); continue; }       // cornice
        if (y === R - 1) { g.set(x, y, z, "quartz_slab", ROOF_SLAB); continue; } // parapet cap
        if (storeyLine) { g.set(x, y, z, "smooth_quartz"); continue; }         // storey line

        // Ground-storey entrance
        if (rel <= 3 && z === 0) {
          if (entranceOpen) {
            if (rel === 1) {
              g.set(x, y, z, "dark_oak_door", {
                facing: "north", half: "lower", hinge: x === 6 ? "left" : "right",
                open: "false", powered: "false",
              });
            } else if (rel === 2) {
              g.set(x, y, z, "dark_oak_door", {
                facing: "north", half: "upper", hinge: x === 6 ? "left" : "right",
                open: "false", powered: "false",
              });
            } else {
              g.set(x, y, z, "smooth_quartz");
            }
            continue;
          }
          if (entranceFrame) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
        }

        if (pillarCol) {
          g.set(x, y, z, "quartz_pillar", { axis: "y" });
        } else if (onLong) {
          g.set(x, y, z, "glass_pane", PANE_LONG);
        } else if (onShort) {
          g.set(x, y, z, "glass_pane", PANE_SHORT);
        }
        continue;
      }

      // Interior: floor slabs per storey, air gap behind glass
      if (y === R - 1) { g.set(x, y, z, "smooth_stone"); continue; }
      if (storeyLine) { g.set(x, y, z, "smooth_stone"); continue; }

      // Warm lanterns behind some north-face windows
      if (z === 1 && rel === 2 && x % 4 === 2) {
        g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }

    // Central penthouse on the main tier, sitting on the roof slab
    if (!perim && x >= 4 && x <= 9 && z >= 1 && z <= 3 && R + 3 < H) {
      for (let y = R; y <= R + 2; y++) {
        if (y === R + 2) g.set(x, y, z, "quartz_slab", ROOF_SLAB);
        else g.set(x, y, z, "smooth_quartz");
      }
    }
  }
}

g.save(`${DIR}/DC87218.nbt`);

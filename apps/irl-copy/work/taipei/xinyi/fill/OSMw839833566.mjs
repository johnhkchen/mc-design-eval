import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833566";
const W = 16, H = 23, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const minG = Math.min(...ground.values());
const F2 = minG + 6;   // second-storey floor / cornice line
const RT = minG + 11;  // roof deck level (roof about 11 blocks above lowest ground)

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [cx, cz, cg] of cells) {
  const gr = Math.round(cg);
  const n = !inside(cx, cz - 1);
  const s = !inside(cx, cz + 1);
  const w = !inside(cx - 1, cz);
  const e = !inside(cx + 1, cz);
  const perim = n || s || w || e;
  const corner = (n || s) && (w || e);
  const alongX = (n || s) && !(w || e);
  const idx = alongX ? cx : cz;
  const front = n; // north face (z = min) is the street frontage

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(cx, y, cz, "stone_bricks");
  // Ground slab / base course
  put(cx, gr, cz, perim ? "stone_bricks" : "smooth_stone");

  if (F2 > gr) {
    // Second-storey floor line (cornice on the perimeter, slab inside)
    put(cx, F2, cz, perim ? "smooth_quartz" : "smooth_stone");

    if (perim) {
      // Walls for both storeys
      const wallRanges = [[gr + 1, F2 - 1, "low"], [F2 + 1, RT - 1, "high"]];
      for (const [y0, y1, band] of wallRanges) {
        for (let y = y0; y <= y1; y++) {
          if (corner) {
            put(cx, y, cz, "quartz_pillar", { axis: "y" });
            continue;
          }
          let winRow;
          if (band === "low") winRow = y >= gr + 1 && y <= gr + 3;
          else winRow = y >= F2 + 1 && y <= F2 + 3;
          const isWindow = winRow && idx % 3 !== 0;

          if (front && band === "low" && y === gr + 4 && idx >= 5 && idx <= 10) {
            // Red shopfront awning band
            put(cx, y, cz, "red_concrete");
          } else if (front && band === "low" && idx === 7 && (y === gr + 1 || y === gr + 2)) {
            // Entrance door
            put(cx, y, cz, "dark_oak_door", {
              facing: alongX ? "south" : "east",
              half: y === gr + 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
              powered: "false",
            });
          } else if (isWindow) {
            const props = alongX
              ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
              : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
            put(cx, y, cz, "cyan_stained_glass_pane", props);

            // Warm light placed just inside some windows
            if (y === (band === "low" ? gr + 2 : F2 + 2) && idx % 9 === 4) {
              let ix = cx, iz = cz;
              if (n) iz = cz + 1;
              else if (s) iz = cz - 1;
              else if (w) ix = cx + 1;
              else if (e) ix = cx - 1;
              if (inside(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "shroomlight");
            }
          } else {
            put(cx, y, cz, "white_concrete");
          }
        }
      }
    }
  }

  // Roof deck at RT (solid under the whole footprint), parapet on the perimeter
  if (RT > gr) {
    put(cx, RT, cz, perim ? "smooth_quartz" : "light_gray_concrete");
    if (perim) put(cx, RT + 1, cz, "white_concrete");
  }
}

// Roof equipment: a condenser plant block and a lightning rod, on interior roof cells only
for (const [cx, cz] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (isPerim(cx, cz)) continue;
  if (cx >= 9 && cx <= 11 && cz >= 4 && cz <= 6) put(cx, RT + 1, cz, "gray_concrete");
  if (cx === 3 && cz === 20) put(cx, RT + 1, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

// Part 4, Field Station and Outpost: the station shell (glazing and doors from the shell helper), the station deck,
// the cafe roof (roof.json, laid by runParts), and the Outpost play pieces (log platform, play logs, boulders) on gravel.
// Ground is the height map's: the station floor and deck sit at y3 (map height 3), play pieces sit on the map height.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { stationShell, deck, playLog, boulder, STATION_BOX, STATION_DECK } from "../vocab.mjs";

const dir = fileURLToPath(new URL(".", import.meta.url));
const HM = readFileSync(dir + "heights.txt", "utf8").trim().split("\n").map((r) => [...r].map((c) => parseInt(c, 36)));

// map height H(x, z): one base-36 digit per 2 x 2 cell (a '?' building cell reads as its neighbour's height, 3 here)
const mapH = (x, z) => HM[z >> 1]?.[x >> 1] ?? 3;

// The ground part lays the map-height surface (grass at y3) under the station floor and deck before this part runs, and
// runParts locks every cell an earlier part placed. So the y3 cells x4..14, z19..32 (the deck and the floor) are not
// writable here: they stay the ground's grass until the ground part leaves them out.
const groundOwned = (x, y, z) => y === 3 && x >= STATION_DECK[0] && x <= STATION_DECK[1] && z >= STATION_DECK[2] && z <= STATION_BOX[3];

// the view this part writes through: a write into a ground-owned cell is dropped, every other write goes to the grid
function stationView(g) {
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => { if (!groundOwned(x, y, z)) target.set(x, y, z, block, state, nbt); return view; };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

export function build(grid) {
  const g = stationView(grid);

  // Field Station: floor y3 (over the ground surface), walls y4..8, head band y8; the shell helper writes the glazing
  // and the double north door and the single south door.
  stationShell(g, 4, 3, 23, { over: true });

  // Station deck in front (north) of the north face, flush with the floor at y3.
  deck(g, [STATION_DECK[0], 3, STATION_DECK[2], STATION_DECK[1], 3, STATION_DECK[3]], { over: true });

  // Outpost, south of the station (z34..42, x0..20) and east of it (x16..20, z24..33).
  // Log platform on spruce_log posts: posts at y H+1..H+2, a stripped log across them at y H+3.
  const h1 = mapH(15, 35) + 1;
  for (const z of [35, 37]) {
    for (const x of [15, 17]) {
      for (let k = 0; k < 2; k++) g.set(x, h1 + k, z, ...B.log("spruce", "y"));
    }
    playLog(g, 15, z, 3, "x", h1 + 2);
  }

  // Play logs lying on the gravel at map height + 1.
  playLog(g, 2, 36, 4, "x", mapH(2, 36) + 1);
  playLog(g, 9, 34, 5, "z", mapH(9, 34) + 1);
  playLog(g, 2, 38, 3, "x", mapH(2, 38) + 1);
  playLog(g, 10, 40, 4, "x", mapH(10, 40) + 1);
  playLog(g, 18, 26, 4, "z", mapH(18, 26) + 1);

  // Boulders of andesite and tuff with moss carpet, sitting on the map height.
  boulder(g, 6, mapH(6, 36), 36, 1.5);
  boulder(g, 1, mapH(1, 38), 38, 1);
  boulder(g, 19, mapH(19, 36), 36, 1);
  boulder(g, 13, mapH(13, 41), 41, 1.5);
  boulder(g, 19, mapH(19, 30), 30, 1);
}

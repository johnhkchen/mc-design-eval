// Builds the trio from scratch: the solid ground, then every part in plan order. runParts locks each part's blocks
// from the parts before it. Usage: node build.mjs <out.nbt>
// The toolkit reads the file in the shifted frame, so this also writes rooms-build.json and sockets-build.json: the
// rooms and sockets in that same frame (for `mcd room`, `mcd walk`, `mcd rooms`, `mcd sockets check --sockets`).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SiteGrid, YOFF } from "./site.mjs";
import { SITE, STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

// [name, module, options]; the stair joiner's options say it may cut the floors (runParts also cuts for "stair" names)
const PARTS = [
  ["masonry shell", "parts/shell.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs", { carve: true }],
  ["roofs", "parts/roofs.mjs"],
  ["chimney stacks", "parts/chimneys.mjs"],
  ["frontage", "parts/frontage.mjs"],
  ["grounds", "parts/grounds.mjs"],
  ["lighting", "parts/lights.mjs"],
  ["room: H1 lobby and stair hall", "parts/room-1.mjs"],
  ["room: H1 flat 1", "parts/room-2.mjs"],
  ["room: H1 flat 2", "parts/room-3.mjs"],
  ["room: H1 loft", "parts/room-4.mjs"],
  ["room: H2 lobby and stair hall", "parts/room-5.mjs"],
  ["room: H2 flat 1", "parts/room-6.mjs"],
  ["room: H2 flat 2", "parts/room-7.mjs"],
  ["room: H2 loft", "parts/room-8.mjs"],
  ["room: H3 lobby and stair hall", "parts/room-9.mjs"],
  ["room: H3 flat 1", "parts/room-10.mjs"],
  ["room: H3 flat 2", "parts/room-11.mjs"],
  ["room: H3 loft", "parts/room-12.mjs"],
];

// A part whose file isn't there yet builds nothing (parallel workers, stubs), so the build never fails for it.
async function loadPart(file) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${file}: missing, skipped`); return () => {}; }
  return (await import(path)).build;
}

const g = new SiteGrid();
g.fill([SITE.x0, SITE.yMin, SITE.z0], [SITE.x1, 0, SITE.z1], STONE);

const list = [];
for (const [name, file, opts] of PARTS) list.push(opts ? [name, await loadPart(file), opts] : [name, await loadPart(file)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);

// rooms and sockets in the file's frame (every world y + YOFF)
const shiftY = (v) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number") ? [v[0], v[1] + YOFF, v[2]]
  : Array.isArray(v) ? v.map(shiftY) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shiftY(x)])) : v;
const rooms = JSON.parse(readFileSync("rooms.json", "utf8"));
const roomsOut = { ...rooms, entrance: shiftY(rooms.entrance), rooms: rooms.rooms.map((r) => ({ ...r, box: [r.box[0], r.box[1] + YOFF, r.box[2], r.box[3], r.box[4] + YOFF, r.box[5]] })) };
writeFileSync("rooms-build.json", JSON.stringify(roomsOut, null, 1));
const L = JSON.parse(readFileSync("sockets.json", "utf8"));
const s = shiftY(L);
s.floorY += YOFF; s.floorAbove += YOFF;
writeFileSync("sockets-build.json", JSON.stringify(s));
console.log(`saved ${out} (${g.cells.size} cells)`);

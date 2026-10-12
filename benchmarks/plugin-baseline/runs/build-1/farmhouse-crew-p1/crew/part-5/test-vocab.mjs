// Tiny test of every vocab helper: node test-vocab.mjs -> /tmp/farm-vocab.nbt (render it to look)
import * as V from "./vocab.mjs";
const g = new V.Grid([44, 18, 40]);
g.fill([0, 0, 0], [43, 0, 39], "grass_block");
// a wall with a window, a door and shutters (north-facing wall at z=5, x 2..14)
V.stoneFill(g, [2, 1, 5], [14, 6, 5]);
for (const [x, y] of [[4, 3], [10, 3]]) for (let k = 0; k < 2; k++) g.set(x, y + k, 5, "air");
g.set(7, 2, 5, "air"); g.set(7, 3, 5, "air");
V.window(g, { x: 4, y: 3, z: 5, face: "north" });
V.window(g, { x: 10, y: 3, z: 5, face: "north" });
V.door(g, { x: 7, y: 2, z: 5, face: "north" });
// furniture
V.table(g, 3, 1, 10); V.table(g, 4, 1, 10); V.chair(g, 2, 1, 10, "east"); V.chair(g, 5, 1, 10, "west"); V.chair(g, 3, 1, 9, "south"); V.chair(g, 4, 1, 11, "north");
V.bed(g, 8, 1, 9, "south", "red"); V.barrel(g, 10, 1, 9); V.chest(g, 11, 1, 9); V.hearth(g, 12, 1, 9); V.furnace(g, 13, 1, 9);
V.bookshelf(g, 13, 1, 10); V.waterCauldron(g, 12, 1, 10); V.pot(g, 11, 1, 10); V.lantern(g, 3, 2, 10); V.lamp(g, 15, 1, 8);
V.fenceRun(g, 17, 8, 22, 8, 1, "oak"); V.fenceRun(g, 17, 10, 22, 10, 1, "cobblestone", { wall: true });
V.gate(g, { x: 20, y: 1, z: 12, face: "north" });
// garden
g.fill([0, 0, 20], [43, 0, 30], "gravel");
V.plantedBed(g, { x0: 1, z0: 20, x1: 6, z1: 27, rows: ["wheat", "carrots", "potatoes", "beetroots"], water: [[3, 23], [3, 24]] });
V.espalier(g, { x: 8, z: 24, wall: "west" });
V.roseArch(g, { x: 12, zA: 22, zB: 24 });
V.well(g, { cx: 17, cz: 24 });
V.sundial(g, { x: 22, z: 24 }); V.urn(g, { x: 24, z: 24 });
V.greenhouse(g, { x0: 27, z0: 24, x1: 32, z1: 28 });
V.coldFrame(g, { x0: 35, z0: 24, x1: 39, z1: 25 });
V.toolShed(g, { x0: 27, z0: 32, x1: 31, z1: 35 });
console.log("fixed", V.fixConnections(g), "refused", g.refused?.length ?? 0);
g.save("/tmp/farm-vocab.nbt");

// Lordaeron comfort shops (comfort:<kind>): where a town's comforts come from. Single storey, no beds (by agreement),
// a shop front with the goods in the window, an interior furnished for the trade; the tavern wider, a long bar.
import { compose, layoutOf } from "./compose.mjs";

const lamps = (put, top, cells) => cells.forEach((c) => put(0, "lantern", c, top));
export const COMFORTS = {
  treats: { name: "bakery", W: 10, show: ["bread", "cake"], palette: "brick", fit: ({ put, top }) => {
    put(0, "oven", [1, 1]); put(0, "oven", [2, 1]); put(0, "hearth", [1, 3]); put(0, "goods_bread", [3, 1]); put(0, "goods_bread", [4, 1]);
    put(0, "table", [3, 3]); put(0, "goods_cake", [3, 3], 2); put(0, "cask", [7, 1]); put(0, "chest", [8, 1]); lamps(put, top, [[2, 3], [6, 3]]);
  } },
  clothing: { name: "tailor", W: 10, show: ["red", "wool"], palette: "daub", fit: ({ put, top }) => {
    put(0, "goods_wool", [1, 1]); put(0, "goods_red", [2, 1]); put(0, "goods_blue", [3, 1]); put(0, "table", [3, 3]); put(0, "bench", [3, 2]);
    put(0, "chest", [8, 1]); put(0, "shelf", [7, 1]); put(0, "hearth", [1, 3]); lamps(put, top, [[2, 3], [6, 3]]);
  } },
  reading: { name: "reading room", W: 10, show: ["books", "candle"], palette: "stone", fit: ({ put, top }) => {
    for (const x of [1, 2, 3, 4, 5, 6, 7, 8]) put(0, "shelf", [x, 1]);
    put(0, "desk", [2, 3]); put(0, "bench", [3, 3], 1, 1); put(0, "desk", [6, 3]); put(0, "bench", [7, 3], 1, 1); put(0, "hearth", [1, 3]); lamps(put, top, [[2, 2], [6, 2], [4, 4], [7, 4]]);
  } },
  furnishings: { name: "chandler", W: 10, show: ["candle", "honey"], palette: "daub", fit: ({ put, top }) => {
    put(0, "goods_honey", [1, 1]); put(0, "goods_honey", [2, 1]); put(0, "table", [3, 3]); put(0, "candles", [3, 3], 2); put(0, "table", [5, 3]); put(0, "candles", [5, 3], 2);
    put(0, "cask", [7, 1]); put(0, "chest", [8, 1]); put(0, "hearth", [1, 3]); lamps(put, top, [[2, 3], [6, 3]]);
  } },
  leisure: { name: "tavern", W: 13, show: ["bread", "honey"], palette: "brick", fit: ({ put, top }) => {
    for (let x = 6; x <= 10; x++) put(0, "bar", [x, 2]);                                         // the bar, casks behind it
    for (let x = 6; x <= 11; x++) put(0, "cask", [x, 1]);
    for (const x of [2, 4]) { put(0, "table", [x, 3]); put(0, "bench", [x, 2]); put(0, "bench", [x, 4], 1, 2); }
    put(0, "hearth", [1, 3]); put(0, "chest", [11, 3]); lamps(put, top, [[3, 3], [8, 3], [10, 4]]);
  } },
};
export function comfort(kind) {
  const c = COMFORTS[kind], [a, b] = c.show;
  const L = layoutOf({ W: c.W, D: 7, storeys: 1, roof: "gable_x", shop: true, noCore: true, fitout: c.fit });
  for (const s of L.shell.filter((s) => s.module === "bay_shop_ground")) L.plan.push({ storey: 0, module: `goods_${a}`, at: [s.i, 7], dy: 2 }, { storey: 0, module: `goods_${b}`, at: [s.i + 1, 7], dy: 2 });
  return { layout: L, grid: compose(L), spec: c };
}

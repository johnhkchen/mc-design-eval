import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const g = load(process.argv[2]);
const z = Number(process.argv[3]);
for (let y = 49; y >= 34; y--) { let row = ""; for (let x = 14; x <= 27; x++) { const b = g.blockAt(x, y, z).replace("minecraft:", ""); row += (b === "air" ? "." : b[0] === "c" ? "c" : b[0] === "w" ? "w" : b[0] === "y" ? "Y" : b[0] === "g" ? "G" : b[0]=="s"?"s":"?"); } console.log(String(y).padStart(2), row); }

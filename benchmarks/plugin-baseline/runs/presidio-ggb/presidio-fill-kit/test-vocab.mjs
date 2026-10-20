// Runs every vocabulary share's test
import { execFileSync } from "node:child_process";
execFileSync("node", ["vocab/test-h1.mjs"], { stdio: "inherit" });
execFileSync("node", ["vocab/test-h2.mjs"], { stdio: "inherit" });
execFileSync("node", ["vocab/test-h3.mjs"], { stdio: "inherit" });

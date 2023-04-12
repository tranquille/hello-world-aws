import path from "path";
import fs from "fs";
import * as esbuild from "esbuild";

const p = path.resolve(path.dirname("."), "lambdas");
console.log(p);

async function* walk(dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* await walk(entry);
    else if (d.isFile()) yield entry;
  }
}

const entryPoints = [];
for await (const f of walk(p)) {
  if (f.endsWith("ts") && !f.includes("spec")) {
    entryPoints.push(f);
  }
}

console.log(entryPoints);
await esbuild.build({
  entryPoints,
  write: true,
  outdir: "bin",
  platform: "node",
  target: ["node18.0"],
  format: "esm",
  outExtension: { ".js": ".mjs" },
});

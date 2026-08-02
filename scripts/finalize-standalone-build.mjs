import { access, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const assets = [
  "query_compiler_fast_bg.js",
  "query_compiler_fast_bg.wasm",
];
const outputDirectories = [resolve("dist/server/assets"), resolve("dist/standalone/dist/server/assets")];

await Promise.all(assets.flatMap((asset) => {
  const source = resolve("lib/db/generated-edge/internal", asset);
  return [
    access(source),
    ...outputDirectories.map((directory) => copyFile(source, resolve(directory, asset))),
  ];
}));

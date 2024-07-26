#!/usr/bin/env node

// based on build.js from https://github.com/cockpit-project
import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import copy from "esbuild-plugin-copy";
import postcss from "esbuild-postcss";
import { ArgumentParser } from "argparse";

const development = process.env.NODE_ENV === "development";

const context = await esbuild.context({
  ...(development ? { sourcemap: "linked" } : {}),
  bundle: true,
  entryPoints: [
    "./src/popup/index.js",
    "./src/css/tailwind.css",
    "./src/newtab/index.js",
    "./src/redirect/index.js",
    "./src/background/background.js",
  ],
  outdir: "dist",
  target: ["es2020"],
  loader: { ".js": "jsx", ".ttf": "file" },
  plugins: [
    {
      name: "clean-dist",
      setup(build) {
        build.onStart(() => {
          try {
            fs.rmSync(path.resolve("./dist"), { recursive: true });
          } catch (error) {
            if (error.code !== "ENOENT") {
              throw error;
            }
          }
        });
      },
    },
    postcss(),
    copy({
      assets: [
        // `to` paths are relative to `outdir`, `from` paths are relative to `build.js`.
        { from: ["./src/popup/index.html"], to: ["popup/index.html"] },
        { from: ["./src/newtab/index.html"], to: ["newtab/index.html"] },
        { from: ["./src/redirect/index.html"], to: ["redirect/index.html"] },
        { from: ["./src/manifest.json"], to: ["manifest.json"] },
      ],
    }),
  ],
});

try {
  await context.rebuild();
} catch (e) {
  console.log(e);
}

const parser = ArgumentParser();
parser.add_argument("-w", "--watch", {
  action: "store_true",
  help: "Enable watch mode",
});
const args = parser.parse_args();

// similar to fs.watch(), but recursively watches all subdirectories
function watch_dirs(dir, on_change) {
  const callback = (ev, dir, fname) => {
    // only listen for "change" events, as renames are noisy
    // ignore hidden files and the "4913" temporary file create by vim
    const isHidden = /^\./.test(fname);
    if (ev !== "change" || isHidden || fname === "4913") {
      return;
    }
    on_change(path.join(dir, fname));
  };

  fs.watch(dir, {}, (ev, path) => callback(ev, dir, path));

  // watch all subdirectories in dir
  const d = fs.opendirSync(dir);
  let dirent = d.readSync();

  while (dirent !== null) {
    if (dirent.isDirectory())
      watch_dirs(path.join(dir, dirent.name), on_change);

    dirent = d.readSync();
  }
  d.closeSync();
}

if (args.watch) {
  const on_change = async (path) => {
    console.log("change detected:", path);
    await context.cancel();

    try {
      await context.rebuild();
    } catch (e) {} // ignore in watch mode
  };

  watch_dirs("src", on_change);

  // wait forever until Control-C
  await new Promise(() => {});
}

context.dispose();

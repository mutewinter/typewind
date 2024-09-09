// src/transform.ts
import * as babel from "@babel/core";
var transformBabel = (ext, content) => {
  const config = {
    filename: `typewind.${ext}`,
    plugins: ["typewind/babel"]
  };
  if (ext === "ts" || ext === "tsx") {
    config.presets = ["@babel/preset-typescript"];
  }
  if (ext === "js" || ext === "jsx") {
    config.plugins?.push("@babel/plugin-syntax-jsx");
  }
  const res = babel.transformSync(content, config);
  if (res?.code == void 0) {
    throw new Error("Failed to transform file");
  }
  return res.code;
};
var typewindTransforms = {
  tsx: (content) => transformBabel("tsx", content),
  ts: (content) => transformBabel("ts", content),
  jsx: (content) => transformBabel("jsx", content),
  js: (content) => transformBabel("js", content)
};
export {
  transformBabel,
  typewindTransforms
};

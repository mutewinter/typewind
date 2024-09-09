"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/transform.ts
var transform_exports = {};
__export(transform_exports, {
  transformBabel: () => transformBabel,
  typewindTransforms: () => typewindTransforms
});
module.exports = __toCommonJS(transform_exports);
var babel = __toESM(require("@babel/core"));
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  transformBabel,
  typewindTransforms
});

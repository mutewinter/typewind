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
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/evaluate.ts
var evaluate_exports = {};
__export(evaluate_exports, {
  createTw: () => createTw
});
module.exports = __toCommonJS(evaluate_exports);

// src/utils.ts
var import_path = __toESM(require("path"));
var import_resolveConfig = __toESM(require("tailwindcss/resolveConfig.js"));
var import_setupContextUtils = require("tailwindcss/lib/lib/setupContextUtils.js");
var import_fs = __toESM(require("fs"));
function loadConfig() {
  const pkg = require(import_path.default.join(process.cwd(), "package.json"));
  return {
    configPath: "./tailwind.config.js",
    showPixelEquivalents: false,
    rootFontSize: 16,
    ...pkg?.typewind
  };
}
function getConfigPath() {
  const config = loadConfig();
  for (const configFile of [
    config.configPath,
    "./tailwind.config.js",
    "./tailwind.config.cjs"
  ]) {
    try {
      const configPath = import_path.default.join(process.cwd(), configFile);
      import_fs.default.accessSync(configPath);
      return configPath;
    } catch (err) {
    }
  }
  throw new Error(
    "No tailwind config file found!\nIf your tailwind config file is not on the same folder, check: https://typewind.dev/docs/installation/custom-config-file-path"
  );
}
function createTypewindContext() {
  const configFile = getConfigPath();
  const userConfig = (0, import_resolveConfig.default)(require(configFile));
  return (0, import_setupContextUtils.createContext)(userConfig);
}

// src/evaluate.ts
var ctx = createTypewindContext();
var { candidateRuleMap, variantMap } = ctx;
function fmtArbitraryRule(name, value, candidateRuleMap2) {
  const classes = [];
  const rules = candidateRuleMap2.get(name);
  if (rules) {
    const isKnownValue = rules.some(
      ([rule]) => value in rule.options.values
    );
    classes.push(`${name}-${isKnownValue ? value : `[${value}]`}`);
  }
  return classes.join(" ");
}
var fmtToTailwind = (s) => s.replace(/_/g, "-").replace(/^\$/, "@").replace(/\$/, "/");
var createTw = () => {
  const twUsed = (classes = /* @__PURE__ */ new Set()) => {
    const target = {
      classes,
      prevProp: void 0,
      toString() {
        return [...target.classes].join(" ");
      }
    };
    const thisTw = new Proxy(target, {
      get(target2, p, recv) {
        if (p === "toString")
          return Reflect.get(...arguments);
        if (typeof p !== "string")
          return null;
        const name = fmtToTailwind(p);
        if (target2.prevProp?.endsWith("-")) {
          target2.classes.add(
            fmtArbitraryRule(target2.prevProp.slice(0, -1), p, candidateRuleMap)
          );
        } else if (target2.prevProp?.endsWith("/")) {
          target2.classes.add(`${target2.prevProp}${name}`);
        } else if (!name.endsWith("-") && !name.endsWith("/")) {
          let spreadModifier2 = function(prefix, chunks) {
            for (const chunk of chunks.toString().split(" ")) {
              target2.classes.add(`${prefix}${chunk}`);
            }
            return thisTw;
          };
          var spreadModifier = spreadModifier2;
          if (name === "raw") {
            return (style) => spreadModifier2("", style);
          }
          if (name === "variant") {
            return (modifier, classes2) => spreadModifier2(`[${modifier}]:`, classes2);
          }
          if (variantMap.has(name) || name === "important") {
            const prefix = name === "important" ? "!" : `${name}:`;
            return (arg) => spreadModifier2(prefix, arg);
          }
          target2.classes.add(name);
        }
        target2.prevProp = name;
        return thisTw;
      }
    });
    return thisTw;
  };
  const tw = new Proxy(
    {},
    {
      get(_target, p) {
        if (typeof p !== "string")
          return Reflect.get(...arguments);
        return twUsed()[p];
      }
    }
  );
  return tw;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createTw
});

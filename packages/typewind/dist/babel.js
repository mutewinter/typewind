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

// src/babel.ts
var babel_exports = {};
__export(babel_exports, {
  default: () => headingBabelPlugin
});
module.exports = __toCommonJS(babel_exports);
var import_core = require("@babel/core");
var import_eval = __toESM(require("eval"));

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

// src/babel.ts
var import_generator = __toESM(require("@babel/generator"));
function headingBabelPlugin() {
  const nodesReplaced = /* @__PURE__ */ new Set();
  const ctx = createTypewindContext();
  return {
    name: "typewind",
    pre(state) {
      this.classes ??= [];
    },
    visitor: {
      MemberExpression(path2, state) {
        if (!import_core.types.isIdentifier(path2.node.object) || path2.node.object.name !== "tw")
          return;
        let curPath = path2;
        let prevPath = void 0;
        while (curPath && (import_core.types.isMemberExpression(curPath.node) || import_core.types.isCallExpression(curPath.node) && (prevPath == void 0 || prevPath.node == curPath.node.callee))) {
          prevPath = curPath;
          curPath = curPath.parentPath;
        }
        const code = (0, import_generator.default)(prevPath.node).code;
        const { result } = (0, import_eval.default)(
          `
const { createTw } = require("typewind/dist/evaluate.js");
const tw = createTw();
try {
  let result$$ = ${code};
  if (typeof result$$ === 'function' || typeof result$$ === "undefined") {
    throw new Error()
  } else {
    exports.result = result$$.toString();
  }
} catch (error) {
  throw new Error(\`Error in evaluating typewind expression: ${code.replace(
            "`",
            "\\`"
          )}. \${error}\`)
}
`,
          true
        );
        if (prevPath.node && !import_core.types.isStringLiteral(prevPath.node)) {
          nodesReplaced.add(prevPath.node);
          try {
            prevPath.replaceWith(import_core.types.stringLiteral(result));
          } catch {
          }
        }
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});

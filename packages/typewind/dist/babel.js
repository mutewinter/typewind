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

// src/babel.ts
var babel_exports = {};
__export(babel_exports, {
  default: () => headingBabelPlugin
});
module.exports = __toCommonJS(babel_exports);
var import_core = require("@babel/core");
var import_eval = __toESM(require("eval"));
var import_generator = __toESM(require("@babel/generator"));
function headingBabelPlugin() {
  const nodesReplaced = /* @__PURE__ */ new Set();
  return {
    name: "typewind",
    pre(state) {
      this.classes ??= [];
    },
    visitor: {
      MemberExpression(path, state) {
        if (!import_core.types.isIdentifier(path.node.object) || path.node.object.name !== "tw")
          return;
        let curPath = path;
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

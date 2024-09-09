// src/babel.ts
import { types as t } from "@babel/core";
import _eval from "eval";
import generator from "@babel/generator";
function headingBabelPlugin() {
  const nodesReplaced = /* @__PURE__ */ new Set();
  return {
    name: "typewind",
    pre(state) {
      this.classes ??= [];
    },
    visitor: {
      MemberExpression(path, state) {
        if (!t.isIdentifier(path.node.object) || path.node.object.name !== "tw")
          return;
        let curPath = path;
        let prevPath = void 0;
        while (curPath && (t.isMemberExpression(curPath.node) || t.isCallExpression(curPath.node) && (prevPath == void 0 || prevPath.node == curPath.node.callee))) {
          prevPath = curPath;
          curPath = curPath.parentPath;
        }
        const code = generator(prevPath.node).code;
        const { result } = _eval(
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
        if (prevPath.node && !t.isStringLiteral(prevPath.node)) {
          nodesReplaced.add(prevPath.node);
          try {
            prevPath.replaceWith(t.stringLiteral(result));
          } catch {
          }
        }
      }
    }
  };
}
export {
  headingBabelPlugin as default
};

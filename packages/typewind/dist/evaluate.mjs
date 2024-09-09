var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/utils.ts
import _eval from "eval";
import path from "path";
import resolveConfig from "tailwindcss/resolveConfig.js";
import { buildSync } from "esbuild";
import fs from "fs";
import { createContext } from "tailwindcss/lib/lib/setupContextUtils.js";
function loadConfig() {
  const pkg = __require(path.join(process.cwd(), "package.json"));
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
    "./tailwind.config.ts",
    "./tailwind.config.js",
    "./tailwind.config.cjs"
  ]) {
    try {
      const configPath = path.join(process.cwd(), configFile);
      fs.accessSync(configPath);
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
  let pkgJSON;
  try {
    pkgJSON = __require(path.join(process.cwd(), "package.json"));
  } catch {
    pkgJSON = {};
  }
  let config;
  if (configFile.endsWith(".ts")) {
    const preprocessedConfig = buildSync({
      entryPoints: [configFile],
      write: false,
      bundle: true,
      format: "cjs",
      target: "node14",
      platform: "node",
      external: ["node_modules/*"]
    }).outputFiles[0].text;
    config = _eval(preprocessedConfig, true);
  } else {
    config = __require(configFile);
  }
  const userConfig = resolveConfig(config);
  return createContext(userConfig);
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
      // prevProp is for keeping track of dynamic values
      // if previous acces ends with _ then its dynamic
      prevProp: void 0,
      // proxy can't be used as string so convert it
      toString() {
        return [...target.classes].join(" ");
      }
    };
    const thisTw = new Proxy(target, {
      get(target2, p, recv) {
        if (p === "toString") return Reflect.get(...arguments);
        if (typeof p !== "string") return null;
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
        if (typeof p !== "string") return Reflect.get(...arguments);
        return twUsed()[p];
      }
    }
  );
  return tw;
};
export {
  createTw
};

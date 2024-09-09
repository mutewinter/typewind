#!/usr/bin/env node
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/cli.ts
import fs2 from "fs";
import path2 from "path";
import { transform } from "lightningcss";

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

// src/cli.ts
function createDoc(doc) {
  try {
    let cssDoc = `
    * \`\`\`css
    * ${transform({
      filename: "doc.css",
      code: Buffer.from(doc)
    }).code.toString().replace(/\n/g, "\n    * ")}
    * \`\`\`
  `;
    const config = loadConfig();
    if (config.showPixelEquivalents) {
      const remMatch = doc.match(/-?[0-9.]+rem/g);
      const pxValue = config.rootFontSize;
      if (remMatch) {
        cssDoc = cssDoc.replace(
          /(-?[0-9.]+)rem/g,
          // There is a zero-width space between * and / in the closing comment
          // without which typescript closes the tsdoc comment
          (match, p1) => `${match} /* ${parseFloat(p1) * pxValue}px *\u200B/`
        );
      }
    }
    return cssDoc;
  } catch (error) {
    return doc;
  }
}
var fmtToTypewind = (s) => s.replace(/-/g, "_").replace(/^\@/, "$");
var objectTemplate = (props) => {
  return `{${props.map(
    ({ prop, type, doc }) => `/** ${doc ? createDoc(doc) : ""} */ ${JSON.stringify(prop)}: ${type};`
  ).join("\n")}}`;
};
var typeTemplate = (name, props) => `
type ${name} = ${objectTemplate(props)}
`;
var rootTypeTemplate = ({
  others,
  types,
  modifiers,
  colors
}) => `type Property = Typewind & string;

${others.join("\n")}

type OpacityMap = {
  [K in Opacity]: Property;
} & Record<string, Property>;
type Colors = {
  ${colors.map((color) => `${color}: OpacityMap`).join(";\n")}
}

type Typewind = ${types.join(" & ")} & {
  ${modifiers.map((variant) => `${variant}(style: Property): Property`).join(";\n")}
} & {
  // [arbitraryVariant: string]: (style: Property) => Property;
} & {
  variant<T extends \`&\${string}\` | \`@\${string}\`>(variant: T, style: Property | string): Property;
  raw(style: string): Property;
}

declare const tw: Typewind;

export { tw };
`;
function getCandidateItem(map, name, rest = void 0) {
  let rule = map.get(name);
  if (!rule && name.includes("-")) {
    const arr = name.split("-");
    const key = arr.slice(0, arr.length - 1).join("-");
    return getCandidateItem(
      map,
      key,
      [arr[arr.length - 1], rest].filter(Boolean).join("-")
    );
  }
  return { rule, rest };
}
async function generateTypes() {
  const ctx = createTypewindContext();
  const classList = ctx.getClassList();
  const opacityMap = ctx.tailwindConfig.theme.opacity;
  const flatColorsList = [];
  for (const [k, v] of Object.entries(ctx.tailwindConfig.theme.colors)) {
    if (typeof v === "object") {
      for (const col in v) {
        flatColorsList.push(k + "-" + col);
      }
    } else {
      flatColorsList.push(k);
    }
  }
  const classesWithStandardSyntax = classList.filter((s) => !/\.|\//.test(s));
  const classesWithCandidateItem = classesWithStandardSyntax.map((s) => {
    return [s, getCandidateItem(ctx.candidateRuleMap, s)];
  });
  const colorSet = /* @__PURE__ */ new Set();
  const standard = typeTemplate(
    "Standard",
    classesWithCandidateItem.map(([s, { rule: rules, rest }]) => {
      let css = "";
      if (rules) {
        for (const rule of rules) {
          const [info, ruleOrFn] = rule;
          if (typeof ruleOrFn === "function") {
            const types = info.options.types;
            const isColor = types.some(
              (t) => t.type == "color"
            );
            if (isColor && rest && flatColorsList.includes(rest)) {
              const key = fmtToTypewind(s) + "$";
              colorSet.add(key);
            }
            const [ruleSet] = ruleOrFn(rest ?? "DEFAULT", {});
            if (ruleSet) {
              css += fmtRuleToCss(ruleSet);
            }
          }
          if (typeof ruleOrFn == "object") {
            css += fmtNode(ruleOrFn) + "\n";
          }
        }
      }
      return { prop: fmtToTypewind(s), type: "Property", doc: css };
    })
  );
  const candidates = [...ctx.candidateRuleMap.entries()];
  const arbitraryStyles = [];
  for (const [name, rules] of candidates) {
    const ident = fmtToTypewind(name) + "_";
    const styles = [];
    for (const [rule, fn] of rules) {
      if (!rule.options || !rule.options.values || Object.keys(rule.options.values).length == 0)
        continue;
      styles.push(
        objectTemplate(
          Object.keys(rule.options.values).map((val) => {
            const [ruleSet] = fn(val, {});
            return {
              prop: val,
              type: "Property",
              doc: fmtRuleToCss(ruleSet)
            };
          })
        )
      );
    }
    arbitraryStyles.push({
      prop: ident,
      type: styles.join(" & ") + " & Record<string, Property>",
      doc: void 0
    });
  }
  const arbitrary = typeTemplate("Arbitrary", arbitraryStyles);
  const modifiers = [...ctx.variantMap.keys(), "important"].filter((s) => s !== "*").map((s) => {
    s = /^\d/.test(s) ? `_${s}` : s;
    return fmtToTypewind(s);
  });
  const root = rootTypeTemplate({
    others: [
      standard,
      arbitrary,
      `type Opacity = ${Object.keys(opacityMap).map((k) => JSON.stringify(k)).join(" | ")}`
    ],
    types: ["Standard", "Arbitrary", "Colors"],
    modifiers,
    colors: [...colorSet].map((k) => JSON.stringify(k))
  });
  fs2.writeFileSync(
    path2.join(__require.resolve("typewind"), "../index.d.ts"),
    root,
    "utf8"
  );
}
function fmtRuleset(rule) {
  return "{" + Object.entries(rule).map(([prop, value]) => {
    if (!value) return "";
    if (typeof value === "object") return `${prop} ${fmtRuleset(value)}`;
    return `${prop}: ${value}`;
  }).join(";") + "}";
}
function fmtNode(node) {
  if (node.type === "atrule") {
    return `\\@${node.name} ${node.params} {${node.nodes.map(fmtNode).join("")}}`;
  }
  if (node.type === "decl") {
    return `${node.prop}: ${node.value};`;
  }
  if (node.type === "rule") {
    return `${node.selector} {${node.nodes.map(fmtNode).join("")}}`;
  }
}
function fmtRuleToCss(ruleSet) {
  const selector = Object.keys(ruleSet)[0];
  return `${selector} ${fmtRuleset(ruleSet[selector])}`;
}
generateTypes().catch((err) => {
  console.error(err);
  process.exit(1);
});
export {
  generateTypes
};

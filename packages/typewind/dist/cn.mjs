// src/cn.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// src/runtime.ts
var typewind_id = Symbol.for("typewind_style");

// src/cn.ts
function cn(...inputs) {
  return twMerge(
    clsx(
      inputs.map((input) => {
        if (!input) return input;
        if (typeof input === "function" && input[typewind_id]) {
          return input.toString();
        }
        return input;
      })
    )
  );
}
export {
  cn
};

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function resolveFile(specifier, context, nextResolve) {
  const url = new URL(specifier);
  const filePath = fileURLToPath(url);
  const candidates = [filePath, `${filePath}.ts`, `${filePath}.tsx`, path.join(filePath, "index.ts")];
  const candidate = candidates.find((item) => fs.existsSync(item) && fs.statSync(item).isFile());
  return nextResolve(candidate ? pathToFileURL(candidate).href : specifier, context);
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return resolveFile(pathToFileURL(path.join(root, specifier.slice(2))).href, context, nextResolve);
  }
  if (specifier.startsWith("file:") && !path.extname(new URL(specifier).pathname)) {
    return resolveFile(specifier, context, nextResolve);
  }
  return nextResolve(specifier, context);
}

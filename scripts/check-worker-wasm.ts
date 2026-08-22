import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// workerdはバイト列からのwasmコンパイルを禁止
const FORBIDDEN_PATTERN = /new\s+WebAssembly\.Module\s*\(/;
const TARGET_EXTENSIONS = [".mjs", ".js"];

const collectFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return collectFiles(path);
      return Promise.resolve(
        TARGET_EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [path] : [],
      );
    }),
  );
  return files.flat();
};

const targetDir = process.argv[2] ?? ".output/server";
const files = await collectFiles(targetDir);
const violations: string[] = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  content.split("\n").forEach((line, index) => {
    if (FORBIDDEN_PATTERN.test(line)) {
      violations.push(`${file}:${index + 1}: ${line.trim().slice(0, 120)}`);
    }
  });
}

if (violations.length > 0) {
  console.error(
    `[check-worker-wasm] forbidden wasm compile detected (${violations.length})`,
  );
  for (const violation of violations) {
    console.error(violation);
  }
  process.exit(1);
}

console.log(`[check-worker-wasm] ok (${files.length} files scanned)`);

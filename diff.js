import { execSync } from "child_process";
import { diff } from "deep-object-diff";

const [fileA, fileB] = process.argv.slice(2);

if (!fileA || !fileB) {
  console.error("Usage: node diff.js <file1.py> <file2.py>");
  process.exit(1);
}

const treeA = JSON.parse(execSync(`python3 engine.py "${fileA}"`).toString());
const treeB = JSON.parse(execSync(`python3 engine.py "${fileB}"`).toString());

const result = {
  functions: {
    added: Object.keys(treeB.functions).filter(k => !(k in treeA.functions)),
    removed: Object.keys(treeA.functions).filter(k => !(k in treeB.functions)),
    modified: diff(treeA.functions, treeB.functions)
  },
  classes: {
    added: Object.keys(treeB.classes).filter(k => !(k in treeA.classes)),
    removed: Object.keys(treeA.classes).filter(k => !(k in treeB.classes)),
    modified: diff(treeA.classes, treeB.classes)
  },
  imports: {
    added: treeB.imports.filter(i => !treeA.imports.some(j => j.module === i.module)),
    removed: treeA.imports.filter(i => !treeB.imports.some(j => j.module === i.module))
  }
};

console.log(`\nDiff: ${fileA}  →  ${fileB}\n${"─".repeat(50)}`);

console.log("\nFunctions:");
console.log("  Added:   ", result.functions.added.length ? result.functions.added.join(", ") : "(none)");
console.log("  Removed: ", result.functions.removed.length ? result.functions.removed.join(", ") : "(none)");

const modifiedFns = Object.keys(result.functions.modified).filter(
  k => result.functions.added.includes(k) === false && result.functions.removed.includes(k) === false
);
console.log("  Modified:", modifiedFns.length ? modifiedFns.join(", ") : "(none)");

console.log("\nClasses:");
console.log("  Added:   ", result.classes.added.length ? result.classes.added.join(", ") : "(none)");
console.log("  Removed: ", result.classes.removed.length ? result.classes.removed.join(", ") : "(none)");

console.log("\nImports:");
console.log("  Added:   ", result.imports.added.length ? result.imports.added.map(i => i.module).join(", ") : "(none)");
console.log("  Removed: ", result.imports.removed.length ? result.imports.removed.map(i => i.module).join(", ") : "(none)");

console.log("\n" + "─".repeat(50));
console.log("\nFull diff (JSON):\n");
console.log(JSON.stringify(result, null, 2));

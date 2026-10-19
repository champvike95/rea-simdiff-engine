import sys
import ast
import json


def parse_py_structure(filepath):
    with open(filepath, "r") as f:
        source = f.read()

    tree = ast.parse(source)

    functions = []
    classes = []
    imports = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
            functions.append({
                "name": node.name,
                "line": node.lineno,
                "args": [a.arg for a in node.args.args],
                "decorators": [ast.unparse(d) for d in node.decorator_list]
            })
        elif isinstance(node, ast.ClassDef):
            methods = [n.name for n in ast.walk(node) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
            classes.append({
                "name": node.name,
                "line": node.lineno,
                "bases": [ast.unparse(b) for b in node.bases],
                "methods": methods
            })
        elif isinstance(node, ast.Import):
            for alias in node.names:
                imports.append({"module": alias.name, "alias": alias.asname})
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                imports.append({
                    "module": f"{node.module}.{alias.name}",
                    "alias": alias.asname
                })

    return {
        "functions": {f["name"]: f for f in functions},
        "classes": {c["name"]: c for c in classes},
        "imports": imports
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    filepath = sys.argv[1]
    result = parse_py_structure(filepath)
    print(json.dumps(result, indent=2))

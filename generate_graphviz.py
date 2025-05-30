import os
import re

SRC_DIR = "src"
DOT_FILE = "doc/geocontrol.dot"

def find_ts_files(src_dir):
    ts_files = []
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith(".ts"):
                ts_files.append(os.path.join(root, file))
    return ts_files

def extract_imports(file_path):
    imports = set()
    import_regex = re.compile(r'import\s+(?:[\w\{\},\s\*]+from\s+)?[\'"](.+)[\'"]')
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            match = import_regex.search(line)
            if match:
                module = match.group(1)
                # Only consider relative imports within src/
                if module.startswith('.'):
                    imports.add(module)
    return imports

def module_name(file_path):
    rel_path = os.path.relpath(file_path, SRC_DIR)
    return rel_path.replace(os.sep, "/").rsplit(".ts", 1)[0]

def resolve_import_path(import_path, current_file):
    # Resolve relative import to module name
    base_dir = os.path.dirname(current_file)
    abs_path = os.path.normpath(os.path.join(base_dir, import_path))
    if os.path.exists(abs_path + ".ts"):
        return os.path.relpath(abs_path + ".ts", SRC_DIR).replace(os.sep, "/").rsplit(".ts", 1)[0]
    elif os.path.exists(abs_path + "/index.ts"):
        return os.path.relpath(abs_path + "/index.ts", SRC_DIR).replace(os.sep, "/").rsplit(".ts", 1)[0]
    return None

def main():
    ts_files = find_ts_files(SRC_DIR)
    dependencies = {}
    modules = set()

    for file in ts_files:
        mod = module_name(file)
        modules.add(mod)
        imports = extract_imports(file)
        resolved_imports = set()
        for imp in imports:
            resolved = resolve_import_path(imp, file)
            if resolved:
                resolved_imports.add(resolved)
        dependencies[mod] = resolved_imports

    with open(DOT_FILE, "w", encoding="utf-8") as f:
        f.write("digraph dependencies {\n")
        for mod in modules:
            for dep in dependencies[mod]:
                if dep in modules:
                    f.write(f'    "{mod}" -> "{dep}";\n')
        f.write("}\n")

if __name__ == "__main__":
    main()

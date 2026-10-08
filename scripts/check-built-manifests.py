#!/usr/bin/env python3
"""Check the package.json the build wrote into each packages/*/build directory.

This is the manifest npm receives. It fails on what broke the January 2026
releases and wasm 7.5.19: an entry point (main, module, types, browser,
react-native, every exports target) naming a file that is not in the build
directory, a path with ./build/ or a doubled ./cjs/cjs/ in it, numeric keys
inside exports (a string spread into an object), and workspace:/portal:/link:
dependency ranges.

    check-built-manifests.py <repo-dir> [package ...]

Prints one line per package and exits 1 if any package fails.
"""
import json
import pathlib
import sys

ENTRY_FIELDS = ('main', 'module', 'types', 'typings', 'browser', 'react-native')
DEP_FIELDS = ('dependencies', 'peerDependencies', 'optionalDependencies')


def targets(node, path):
    """Yield (json-path, target string) for every string leaf under exports."""
    if isinstance(node, str):
        yield path, node
    elif isinstance(node, dict):
        for key, value in node.items():
            yield from targets(value, f'{path}/{key}')
    elif isinstance(node, list):
        for i, value in enumerate(node):
            yield from targets(value, f'{path}[{i}]')


def numeric_keys(node, path):
    if isinstance(node, dict):
        for key, value in node.items():
            if key.isdigit():
                yield f'{path}/{key}'
            yield from numeric_keys(value, f'{path}/{key}')


def check(build):
    problems = []
    manifest = build / 'package.json'
    if not manifest.is_file():
        return ['no build/package.json']
    pkg = json.loads(manifest.read_text())

    def check_path(where, target):
        if not isinstance(target, str) or not target.startswith('.'):
            return
        if '/build/' in target or target.startswith('./build') or '/cjs/cjs/' in target:
            problems.append(f'{where}: suspicious path {target}')
        if '*' in target:
            base = build / target.split('*', 1)[0]
            if not base.parent.exists():
                problems.append(f'{where}: {target} has no directory')
            return
        if not (build / target).is_file():
            problems.append(f'{where}: {target} does not exist')

    for field in ENTRY_FIELDS:
        value = pkg.get(field)
        if isinstance(value, str):
            check_path(field, value)
    for where, target in targets(pkg.get('exports'), 'exports'):
        check_path(where, target)
    for where in numeric_keys(pkg.get('exports'), 'exports'):
        problems.append(f'{where}: numeric key (a string spread into an object)')
    for field in DEP_FIELDS:
        for dep, rng in (pkg.get(field) or {}).items():
            if str(rng).startswith(('workspace:', 'portal:', 'link:', 'file:')):
                problems.append(f'{field}.{dep}: {rng}')
    return problems


def main():
    repo = pathlib.Path(sys.argv[1])
    names = sys.argv[2:]
    builds = [repo / 'packages' / n / 'build' for n in names] if names else sorted(repo.glob('packages/*/build'))
    failed = 0
    for build in builds:
        problems = check(build)
        name = build.parent.name
        if problems:
            failed += 1
            print(f'FAIL {name}')
            for p in problems[:12]:
                print(f'     {p}')
            if len(problems) > 12:
                print(f'     ... {len(problems) - 12} more')
        else:
            print(f'ok   {name}')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()

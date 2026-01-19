#!/usr/bin/env node
// Post-build cleanup script to remove unsafe patterns flagged by web-ext lint
// This runs after webpack build to sanitize the output

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../packages/extension/build');

const replacements = [
  // Replace Function("return this")() with globalThis
  {
    search: /Function\s*\(\s*["']return this["']\s*\)\s*\(\s*\)/g,
    replace: 'globalThis'
  },
  // Replace Function("return this") (without call) with a function returning globalThis
  {
    search: /Function\s*\(\s*["']return this["']\s*\)/g,
    replace: '(function(){return globalThis})'
  }
];

const jsFiles = fs.readdirSync(BUILD_DIR).filter(f => f.endsWith('.js'));

let totalReplacements = 0;

jsFiles.forEach(file => {
  const filePath = path.join(BUILD_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let fileReplacements = 0;

  replacements.forEach(({ search, replace }) => {
    const matches = content.match(search);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(search, replace);
    }
  });

  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`  ${file}: ${fileReplacements} replacement(s)`);
    totalReplacements += fileReplacements;
  }
});

if (totalReplacements > 0) {
  console.log(`\n✓ Cleaned ${totalReplacements} unsafe Function patterns`);
} else {
  console.log('✓ No unsafe Function patterns found');
}

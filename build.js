const fs = require('fs');
const path = require('path');

const root = __dirname;
const dist = path.join(root, 'dist');

function copyFile(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('  ', path.relative(root, src), '->', path.relative(root, dest));
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(srcDir, e.name);
    const d = path.join(destDir, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else {
      fs.copyFileSync(s, d);
      console.log('  ', path.relative(root, s), '->', path.relative(root, d));
    }
  }
}

console.log('Build -> dist/');
if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true });

copyFile(path.join(root, 'index.html'), path.join(dist, 'index.html'));
copyFile(path.join(root, 'styles.css'), path.join(dist, 'styles.css'));
copyFile(path.join(root, 'app.js'), path.join(dist, 'app.js'));
copyDir(path.join(root, 'data'), path.join(dist, 'data'));

console.log('Listo.');

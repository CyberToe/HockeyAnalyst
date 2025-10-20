const fs = require('fs');
const path = require('path');

// Create the target directory
fs.mkdirSync('api/backend-dist', { recursive: true });

// Recursive copy function
const copyDir = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
};

// Copy the backend dist directory
copyDir('backend/dist', 'api/backend-dist');
console.log('Backend files copied successfully');

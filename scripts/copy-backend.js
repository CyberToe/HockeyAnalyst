const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendDist = path.join('backend', 'dist');

// Ensure backend/dist exists; if not, build it using backend tsconfig
if (!fs.existsSync(backendDist)) {
  console.log('backend/dist not found. Building backend...');
  try {
    // Ensure backend dependencies are installed in Vercel build environment
    execSync('npm ci', { cwd: path.join(process.cwd(), 'backend'), stdio: 'inherit' });
    // Use npx tsc from within backend directory
    execSync('npx tsc', { cwd: path.join(process.cwd(), 'backend'), stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to build backend with TypeScript:', err.message || err);
    process.exit(1);
  }
}

if (!fs.existsSync(backendDist)) {
  console.error('Error: backend/dist directory still does not exist after build.');
  process.exit(1);
}

// Create the target directory
const target = path.join('api', 'backend-dist');
fs.mkdirSync(target, { recursive: true });

// Recursive copy function
const copyDir = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
};

// Copy the backend dist directory
copyDir(backendDist, target);
console.log('Backend files copied successfully');

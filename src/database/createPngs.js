const fs = require('fs');
const path = require('path');

// Minimal 1x1 transparent PNG buffer
const minimalPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const imgDir = path.join(__dirname, '../../public/assets/images');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Write PNG files if not already present
['college-logo.png', 'default-avatar.png', 'default-student.png'].forEach(file => {
  const p = path.join(imgDir, file);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, minimalPngBuffer);
  }
});

console.log('PNG placeholders initialized.');

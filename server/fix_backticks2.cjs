const fs = require('fs');
const path = require('path');
const dirs = ['./controllers', './utils', './middleware', './routes'];

dirs.forEach(d => {
  if (fs.existsSync(d)) {
    fs.readdirSync(d).forEach(f => {
      const fullPath = path.join(d, f);
      if (f.endsWith('.js')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const newContent = content.split("\\`").join("`");
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent);
          console.log('Fixed', fullPath);
        }
      }
    });
  }
});

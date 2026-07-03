const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

const clientDir = path.join(__dirname, 'client');
const files = walk(clientDir);

let count = 0;
files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        
        const search1 = 'window.location.hostname}:5000';
        const replace1 = 'window.location.hostname}';
        
        if (content.includes(search1)) {
            content = content.split(search1).join(replace1);
            modified = true;
        }

        const search2 = 'localhost:5000';
        const replace2 = 'localhost';
        
        if (content.includes(search2)) {
            content = content.split(search2).join(replace2);
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(file, content, 'utf8');
            count++;
            console.log('Fixed', file);
        }
    }
});

console.log(`Fixed ${count} files.`);

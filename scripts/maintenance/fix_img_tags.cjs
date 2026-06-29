const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const dir = path.resolve(__dirname, '../../src');

walkDir(dir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Find <img tags
    // We want to add loading="lazy" and decoding="async" if not present
    // First, let's normalize by removing existing loading="..." and decoding="..."
    // from the <img tag to avoid duplicates, then add them correctly.

    // Regex to match the opening <img tag and all its attributes up to the closing > or />
    const imgRegex = /<img([\s\S]*?)(\/?)>/g;

    content = content.replace(imgRegex, (match, p1, p2) => {
        // Remove existing loading="lazy" or decoding="async" (with varying spacing)
        let attrs = p1.replace(/\s+loading=["'][^"']*["']/g, '');
        attrs = attrs.replace(/\s+decoding=["'][^"']*["']/g, '');
        
        // Return the tag with the attributes added
        return `<img loading="lazy" decoding="async" ${attrs}${p2}>`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
});

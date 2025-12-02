// New file
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
    const headers = {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none'
    };

    // Prevent directory traversal
    const safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // SPA Fallback: serve index.html for non-asset routes
                const extname = path.extname(filePath);
                if (!extname || extname === '.html') {
                    serveIndex(res, headers);
                } else {
                    res.writeHead(404, headers);
                    res.end('Not Found');
                }
            } else {
                res.writeHead(500, headers);
                res.end(`Server Error: ${err.code}`);
            }
            return;
        }

        if (stats.isDirectory()) {
            // Try serving index.html inside the directory
            const indexFilePath = path.join(filePath, 'index.html');
            fs.stat(indexFilePath, (err, indexStats) => {
                if (!err && indexStats.isFile()) {
                    serveFile(res, indexFilePath, headers);
                } else {
                    // Fallback to root index.html (SPA)
                    serveIndex(res, headers);
                }
            });
        } else {
            serveFile(res, filePath, headers);
        }
    });
}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop');
});

function serveFile(res, filePath, headers) {
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, headers);
            res.end(`Error reading file: ${err.code}`);
        } else {
            res.writeHead(200, { ...headers, 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

function serveIndex(res, headers) {
    fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err, content) => {
        if (err) {
            res.writeHead(500, headers);
            res.end('Error loading index.html');
        } else {
            res.writeHead(200, { ...headers, 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
        }
    });
}

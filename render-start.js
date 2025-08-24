import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PORT = process.env.PORT || 3000;
const distPath = join(__dirname, 'dist');

console.log(`🚀 Starting server...`);
console.log(`📍 Port: ${PORT}`);
console.log(`📁 Dist path: ${distPath}`);
console.log(`🔍 Dist exists: ${existsSync(distPath)}`);

if (!existsSync(distPath)) {
  console.error(`❌ Dist folder not found at: ${distPath}`);
  console.error(`📂 Current directory: ${__dirname}`);
  console.error(`📋 Directory contents:`, readdirSync(__dirname));
  process.exit(1);
}

console.log(`📋 Dist contents:`, readdirSync(distPath));

// MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = createServer((req, res) => {
  console.log(`📥 Request: ${req.method} ${req.url}`);
  
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = join(distPath, filePath);
  
  console.log(`🔍 Looking for file: ${filePath}`);

  // Security: prevent directory traversal
  if (!filePath.startsWith(distPath)) {
    console.log(`❌ Security violation: ${filePath}`);
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    // Try index.html for SPA routing
    const indexPath = join(distPath, 'index.html');
    if (existsSync(indexPath)) {
      console.log(`🔄 Serving index.html for SPA routing`);
      filePath = indexPath;
    } else {
      console.log(`❌ Index.html not found in: ${distPath}`);
      res.writeHead(404);
      res.end('File not found');
      return;
    }
  }

  const ext = extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(filePath);
    console.log(`✅ Serving: ${filePath} (${contentType})`);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

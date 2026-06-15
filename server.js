const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const RESPONSES_FILE = path.join(__dirname, 'responses.json');

// Ensure responses.json exists with an empty array if not present
if (!fs.existsSync(RESPONSES_FILE)) {
  fs.writeFileSync(RESPONSES_FILE, JSON.stringify([]));
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;

  console.log(`${method} ${url}`);

  // --- API Endpoints ---
  
  // POST /api/rsvp - Save guest response
  if (url === '/api/rsvp' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newRsvp = JSON.parse(body);
        
        // Read existing responses
        fs.readFile(RESPONSES_FILE, 'utf8', (err, data) => {
          let rsvps = [];
          if (!err && data) {
            try {
              rsvps = JSON.parse(data);
            } catch (e) {
              rsvps = [];
            }
          }
          
          // Remove previous response by same name to prevent duplicates
          rsvps = rsvps.filter(item => item.name.toLowerCase() !== newRsvp.name.toLowerCase());
          
          // Add new response
          rsvps.push(newRsvp);
          
          // Save back to file
          fs.writeFile(RESPONSES_FILE, JSON.stringify(rsvps, null, 2), 'utf8', (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Failed to write data' }));
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: rsvps.length }));
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // GET /api/responses - Get all RSVP responses
  if (url === '/api/responses' && method === 'GET') {
    fs.readFile(RESPONSES_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to read data' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data || '[]');
    });
    return;
  }

  // POST /api/clear - Clear all responses
  if (url === '/api/clear' && method === 'POST') {
    fs.writeFile(RESPONSES_FILE, JSON.stringify([]), 'utf8', (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to clear data' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  // --- Static File Server ---
  
  // Normalize request path
  let filePath = path.join(__dirname, url === '/' ? 'index.html' : url.split('?')[0]);
  
  // Security check: ensure path is within directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

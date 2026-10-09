const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const server = http.createServer((request, response) => {
  const isLogo = request.url === '/uad.png';
  const isAiko = request.url === '/aiko.svg';
  const isWordmark = request.url === '/uad-wordmark.png';
  const file = isLogo || isWordmark ? path.resolve(__dirname, '../../public/branding', isWordmark ? 'uad-wordmark.png' : 'uad.png') : path.join(__dirname, isAiko ? 'aiko.svg' : 'preview.html');
  response.setHeader('Content-Type', isLogo || isWordmark ? 'image/png' : isAiko ? 'image/svg+xml' : 'text/html; charset=utf-8');
  const content = fs.readFileSync(file);
  response.end(isAiko ? content.toString().replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') : content);
});
server.listen(3002, '127.0.0.1', () => console.log('Concept preview: http://127.0.0.1:3002'));

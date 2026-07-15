const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
    try {
        const file = fs.readFileSync('C:\\Users\\Admin\\AppData\\Local\\mkcert\\rootCA.pem');
        res.writeHead(200, {
            'Content-Type': 'application/x-pem-file', 
            'Content-Disposition': 'attachment; filename="rootCA.pem"',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(file);
    } catch (e) {
        res.writeHead(500);
        res.end(e.message);
    }
}).listen(8080, '0.0.0.0', () => {
    console.log('File server running at http://0.0.0.0:8080/');
});

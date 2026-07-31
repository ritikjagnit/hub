const fs = require('fs');
const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, role: 'admin' }, 'projectmanagement_secure_jwt_token_secret_998877');
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
let body = '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n';
body += 'Content-Type: text/plain\r\n\r\n';
body += 'Hello World\r\n';
body += '--' + boundary + '--\r\n';

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/projects/1/upload',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(body)
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});

req.on('error', console.error);
req.write(body);
req.end();

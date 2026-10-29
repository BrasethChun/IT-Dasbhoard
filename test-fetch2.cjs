const http = require('http');

http.get('http://localhost:3000/api/notes', {
}, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log("Response /api/notes:", resp.statusCode, data.substring(0, 50)); });
}).on("error", (err) => { console.log("Error: " + err.message); });

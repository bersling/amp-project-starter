const express = require('express');
const server = express();
server.use('/', express.static(__dirname + '/dist', {extensions: ['html']}));

const port = process.argv[2] || 8082;
server.listen(port, function() {
  console.log(`listening on port ${port}`)
});

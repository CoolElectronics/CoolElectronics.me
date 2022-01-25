// MAIN SCRIPT

const port = 7326;


const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/about', function(req, res) {
  res.render('pages/about');
});

app.listen(7326);


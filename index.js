// MAIN SCRIPT

const port = 7326;


const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const app = express();

app.use(compression());
app.use(cookieParser());

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    console.log(req.cookies);
    res.render('pages/index');
});

app.get('/sign', function(req, res) {
    res.render('pages/sign');
});
app.get('/games', function(req, res) {
    res.render('pages/games');
});

app.listen(7326);
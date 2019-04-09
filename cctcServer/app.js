var express = require('express'),
    api = express(),
    port = process.env.PORT || 3000;
const db = require('./Database.js')
var connection = require('./connection');


var logger = require('./logger');
var ICUs = require('./routes/icus');
var Organizations = require('./routes/organizations');

express.json();
connection.init();
api.use(express.json())
api.use(function (request, response, next) {

    response.setHeader('Access-Control-Allow-Origin', 'https://sreat.ca');//change this later
    response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    response.header('Access-Control-Allow-Methods', 'POST, PATCH, GET, PUT, DELETE, OPTIONS');
    next();
});

api.use(logger);
api.use('/icus', ICUs);
api.use('/organizations', Organizations);


api.get('/', function(req, res){
    res.send('API Working')
  })
  
api.listen(port, function(){
    console.log('Server listening on ', port);
  })
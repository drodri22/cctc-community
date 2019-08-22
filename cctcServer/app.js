var express = require('express'),
    api = express(),
    port = process.env.PORT || 3000;
const db = require('./Database.js')
var connection = require('./connection');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');
const checkScopes = jwtAuthz([ 'profile', 'email' ], { });//checks all checkAllScopes: false, customScopeKey:"permissions", failWithError:true
var logger = require('./logger');
var ICUs = require('./routes/icus');
var Organizations = require('./routes/organizations');
var Revisions = require('./routes/revisions');
var Tokens = require('./routes/tokens');

const authCheck = jwt({
  secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: "https://dev-c5y4cncb.eu.auth0.com/.well-known/jwks.json"
    }),
    // This is the identifier we set when we created the API
    audience: 'https://www.critcareapi.com',
    issuer: "https://dev-c5y4cncb.eu.auth0.com/", // e.g., https://you.auth0.com/
    algorithms: ['RS256']
});

express.json();
connection.init();
api.use(express.json())
api.use(function (request, response, next) {

    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, content-type");
    response.header('Access-Control-Allow-Methods', 'POST, PATCH, GET, PUT, DELETE, OPTIONS');
    next();
});

api.use(logger);
api.use('/icus', ICUs);
api.use('/organizations', Organizations);
api.use('/revisions',authCheck, Revisions);
api.use('/tokens', Tokens);


api.get('/',authCheck, checkScopes, function(req, res){
    res.send('API Working')
  })
  
api.listen(port, function(){
    console.log('Server listening on ', port);
  })
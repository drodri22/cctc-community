var mysql = require("mysql");
var config = require("./config.json")
var exports = module.exports = {};
var con;

exports.connect = function(callback){
    con = mysql.createConnection({
        host: config.db_host,
        user: config.db_user,
        password: config.db_password
    });
    con.connect(function(err){
        callback(err);
    });
}

exports.fetchToken = function(branchId, callback){
    con.query("SELECT tokens.token FROM SR_Eat_Database.Tokens as tokens where id = " + mysql.escape(branchId), function (error, results, fields) {
      
        destinationToken = results[0].token;
        console.log("Token: " + destinationToken);
        callback(destinationToken);
    });
}

var mysql = require('mysql');
var config = require("./config.json")

function Connection() {
  this.pool = null;

  this.init = function() {
    
    this.pool = mysql.createPool({
      connectionLimit: 100,
      host: config.db_host,
      user: config.db_user,
      password: config.db_password,
      database: config.database
    });

  };

  this.acquire = function(callback) {
    this.pool.getConnection(function(err, connection) {
      callback(err, connection);
    });
  };
}

module.exports = new Connection();
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({ extended: false });
var parseJSON = bodyParser.json();
var connection = require('../connection');
const myrequest = require('request');

router.route('/')
    .post(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (err, con) {
            con.query("SELECT email from Person WHERE PersonID=?", [request.body["PersonID"]], function (err, rows, fields) {
                    if (err != null && !response.headersSent) { response.send({ error: "Error Querying for Person's Email", err: err }); con.release(); return; };
                    if (rows.length == 0 && !response.headersSent) { response.send({ error: "No Person found under given ID", err: "No Person found under given ID" }); con.release(); return; };
                    let token = new Date().getTime();
                    con.query("INSERT INTO Token (PersonID, Value) VALUES (?,?) ON DUPLICATE KEY UPDATE Value=?;",[request.body["PersonID"],token,token], function (err, updateRows, fields) {
                        if (err != null && !response.headersSent) { response.send({ error: "Error Updating Token", err: err }); con.release(); return; };
                        response.send({ person: rows[0] });
                    });
                });
        });
    })

    .get(parseUrlencoded, parseJSON, function (request, response) {

    })
    .put(parseUrlencoded, parseJSON, function (request, response) {

    });
router.route('/:token')
    .get(parseUrlencoded, parseJSON, function (request, response) {//gets a person for one time link, need to actually gen tokens and check expire/delete them
        connection.acquire(function (err, con) {
            con.query("SELECT Person.*, roles FROM Person INNER JOIN Token ON Person.PersonID=Token.PersonID LEFT JOIN " +
                "(SELECT PersonID, JSON_ARRAYAGG(JSON_OBJECT('RoleID', RoleID, 'PersonID', PersonID,'ICUID', ICUID,'role', role,'HospID', HospID,'Description', Description)) roles " +
                "FROM critcaremaster.Role GROUP BY PersonID) rol ON Person.PersonID = rol.PersonID WHERE Token.Value=?", [request.params["token"]], function (err, rows, fields) {
                    if (err != null && !response.headersSent) { response.send({ error: "Couldn't retrieve person from token", err: err }); con.release(); return; };
                    if (rows.length == 0 && !response.headersSent) { response.send({ error: "No Person found", err: "No person found using specified token, either expired or deleted" }); con.release(); return; };
                    rows[0].roles = JSON.parse(rows[0].roles);
                    rows[0].specialties = JSON.parse(rows[0].specialties);
                    response.send({ person: rows[0] });
                });
        });
    })
    .post(parseUrlencoded, parseJSON, function (request, response) {

    });

module.exports = router;
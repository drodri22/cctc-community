var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({ extended: false });
var parseJSON = bodyParser.json();
var connection = require('../connection');//will opening multiple of these cause a problem???
const myrequest = require('request');

router.route('/')
    .post(parseUrlencoded, parseJSON, function (request, response) {//import with branch id, authorization and sub. if can find a second menu, with just branch id, then just add stuff not new menu

    })

    .get(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (err, con) {
            con.query('SELECT * FROM ICU', [], function (err, rows, fields) {

                response.send(rows);
                con.release();
            });
        });
    })
    .put(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (err, con) {
            con.query('SELECT * FROM ICU WHERE urlIdentifier = ?', [request.body.urlIdentifier], function (err, rows, fields) {
                if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };
                if (rows.length == 0) { response.send({ error: "Not Found" }); con.release(); return; }
                con.query("SELECT pers.*, roles FROM (SELECT p.* FROM critcaremaster.Person p INNER JOIN (SELECT * FROM critcaremaster.Role WHERE ICUID = ?) r ON p.PersonID = r.PersonID " +
                    "GROUP BY p.PersonID) pers LEFT JOIN " +
                    "(SELECT PersonID, JSON_ARRAYAGG(JSON_OBJECT('RoleID', RoleID, 'PersonID', PersonID,'ICUID', ICUID,'role', role,'HospID', HospID,'Description', Description)) roles " +
                    "FROM critcaremaster.Role GROUP BY PersonID) rol ON pers.PersonID = rol.PersonID;", [rows[0].ICUID], function (err2, staff, fields) {
                        if (err2 != null && !response.headersSent) { response.send({ error: err2 }); con.release(); return; };
                        for(let pers of staff)
                        {
                            pers.roles=JSON.parse(pers.roles);
                            pers.specialties=JSON.parse(pers.specialties);
                        }
                        rows[0].staff=staff;
                        response.send(rows[0]);
                        con.release();
                    });
            })

        });
    });
router.route('/:ICUID')
    .get(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (err, con) {

            con.query('SELECT * FROM Categories WHERE MenuID = ?', [request.params["MenuID"]], function (err, catrows, fields) {

            });
        });
    })
    .post(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (errInitial, con) {
            con.query('SELECT * FROM Branches WHERE url_identifier = ?', [request.params["MenuID"]], function (err1, branch, fields) {

            });
        });
    });

module.exports = router;
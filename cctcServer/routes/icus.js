var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({ extended: false });
var parseJSON = bodyParser.json();
var connection = require('../connection');//will opening multiple of these cause a problem???
const myrequest = require('request');

router.route('/')
    .post(parseUrlencoded, parseJSON, function (request, response) {
        var icu=request.body.ICUName.toLowerCase();
        var hosp = request.body.hospitalName.toLowerCase();
        var sql = "SELECT ICU.* FROM ICU";
        if(hosp!='') {
            sql += " INNER JOIN Hospital ON ICU.HospitalID = Hospital.HospitalID WHERE LOWER(Hospital.name) LIKE '%"+hosp+"%'";
            if(icu!='')
            {
                sql+=" AND LOWER(ICU.name) LIKE '%"+icu+"%'"
            }
        }
        else {
            sql+=" WHERE LOWER(ICU.name) LIKE '%"+icu+"%'";
        }
        console.log(sql);
        connection.acquire(function (err1, con) {
            if (err1 != null) {
                response.send([]);
                return;
            }
            con.query(sql, [], function (err, rows, fields) {
                if (err != null) {
                    response.send([]);
                    con.release();
                    return;
                }
                response.send(rows);
                con.release();
            });
        });
        
        
    })

    .get(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (err1, con) {
            if (err1 != null) {
                response.send({error:err1});
                return;
            }
            con.query('SELECT * FROM ICU', [], function (err, rows, fields) {
                if (err != null) {
                    response.send({error:err});
                    con.release();
                    return;
                }
                response.send(rows);
                con.release();
            });
        });
    })
    .put(parseUrlencoded, parseJSON, function (request, response) {//get the icu info based on url identifier
        connection.acquire(function (err, con) {
            con.query('SELECT * FROM ICU WHERE urlIdentifier = ?', [request.body.urlIdentifier], function (err, rows, fields) {
                if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };
                if (rows.length == 0) { response.send({ error: "Not Found" }); con.release(); return; }
                con.query("SELECT pers.*, roles FROM (SELECT p.* FROM critcaremaster.Person p INNER JOIN (SELECT * FROM critcaremaster.Role WHERE ICUID = ?) r ON p.PersonID = r.PersonID " +
                    "GROUP BY p.PersonID) pers LEFT JOIN " +
                    "(SELECT PersonID, JSON_ARRAYAGG(JSON_OBJECT('RoleID', RoleID, 'PersonID', PersonID,'ICUID', ICUID,'role', role,'HospID', HospID,'Description', Description)) roles " +
                    "FROM critcaremaster.Role GROUP BY PersonID) rol ON pers.PersonID = rol.PersonID;", [rows[0].ICUID], function (err2, staff, fields) {
                        if (err2 != null && !response.headersSent) { response.send({ error: err2 }); con.release(); return; };
                        for (let pers of staff) {
                            pers.roles = JSON.parse(pers.roles);
                            pers.specialties = JSON.parse(pers.specialties);
                        }
                        rows[0].staff = staff;
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
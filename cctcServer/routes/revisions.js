var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({ extended: false });
var parseJSON = bodyParser.json();
var connection = require('../connection');//will opening multiple of these cause a problem???
const myrequest = require('request');

var jwtDecode = require('jwt-decode');
const jwtAuthz = require('express-jwt-authz');
const checkScopes = jwtAuthz(['approve:all', 'approve:region', 'approve:icu', 'approve:hospital', 'approve:province'], { customScopeKey: "permissions" });//checks all checkAllScopes: true, customScopeKey:"permissions", failWithError:true

router.route('/')
    .post(parseUrlencoded, parseJSON, function (request, response) {
        var newV = request.body.revision.newVersion;
        for (var propName in newV) {
            if (newV[propName] === null || newV[propName] === undefined) {
                delete newV[propName];
            }
        }
        var rolesToAdd = [];
        var rolesToRemove = [];
        var currentRevision = request.body.revision;
        var setToAdd = new Set();
        var setToRemove = new Set();
        var setFromNew = new Set();
        var setFromOld = new Set();
        if (currentRevision.newVersion.roles == null) {
            currentRevision.newVersion.roles = [];
        }
        if (currentRevision.oldVersion.roles == null) {
            currentRevision.oldVersion.roles = [];
        }
        for (let role of currentRevision.newVersion.roles) {
            setFromNew.add(role.role);
        }
        for (let role of currentRevision.oldVersion.roles) {
            setFromOld.add(role.role);
        }
        for (let role of currentRevision.newVersion.roles) {
            if (!setFromOld.has(role.role)) {
                setToAdd.add(role);
            }
        }

        for (let role of currentRevision.oldVersion.roles) {
            if (!setFromNew.has(role.role)) {
                setToRemove.add(role);
            }
        }
        var temp = Array.from(setToAdd);
        for (let role of temp) {
            rolesToAdd.push(role);
        }
        temp = Array.from(setToRemove);
        for (let role of temp) {
            rolesToRemove.push(role);
        }

        if (rolesToAdd.length != 0)
            newV.rolesToAdd = rolesToAdd;
        if (rolesToRemove.length != 0)
            newV.rolesToRemove = rolesToRemove;

        if (newV.roles != null) {
            delete newV['roles'];
        }
        var check = true;

        if (newV.specialties.length == request.body.revision.oldVersion.specialties.length) {
            newV.specialties.sort();
            request.body.revision.oldVersion.specialties.sort();
            for (let i = 0; i < newV.specialties.length; i++) {
                if (newV.specialties[i] != request.body.revision.oldVersion.specialties[i]) {
                    check = false;
                    break;
                }
            }
        }
        else { check = false }
        if (check) {
            delete newV['specialties'];
        }
        if (Object.keys(newV).length == 1) {
            response.send({ Message: "empty revision" });
            return;
        }
        connection.acquire(function (err, con) {
            let decoded = jwtDecode(request.headers.authorization);
            let email = decoded["https://www.critcareapi.com/email"];
            let name = decoded["https://www.critcareapi.com/name"];
            con.query('Select province, regionName FROM Hospital WHERE HospitalID = ?', [request.body.HospitalID], function (err2, rows, fields) {
                if (err != null && !response.headersSent) { response.send({ error: "Error retrieving Hospital", message: err2 }); con.release(); return; };
                if (rows.length == 0 && !response.headersSent) { response.send({ error: "No Hospital matching current ID found" }); con.release(); return; };
                con.query('INSERT INTO Revision(dateCreated, newVersion, oldVersion, reviewed, creator,creatorEmail,HospitalID, ICUID, province, regionName) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    [request.body.revision.dateCreated, JSON.stringify(newV), request.body.revision.oldVersion.PersonID, false, name, email, request.body.HospitalID, request.body.ICUID,
                    rows[0].province, rows[0].regionName],
                    function (err, headerrows, fields) {

                        if (err != null && !response.headersSent) { response.send({ error: "There was an error creating the revision.", message: err }); con.release(); return; };
                        response.send({ Message: "done" });
                        con.release();
                    });
            });

        });
    })

    .get(checkScopes, parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(async function (err, con) {
            let decoded = jwtDecode(request.headers.authorization);
            let permissions = decoded.permissions;
            let zone = "Canada";
            let query = '';
            if (permissions.includes("approve:province")) {//gets appropriate query to filter icus and zone to display to user
                query = ' AND province = "' + decoded["https://www.critcareapi.com/assignment"]+'"';
                zone = decoded["https://www.critcareapi.com/assignment"];
            }
            else if (permissions.includes("approve:region")) {
                query = ' AND regionName = "' + decoded["https://www.critcareapi.com/assignment"]+'"';
                zone = decoded["https://www.critcareapi.com/assignment"];
            }
            else if (permissions.includes("approve:hospital")) {
                query = " AND HospitalID = " + decoded["https://www.critcareapi.com/assignment"];
                let response = await getDetails(null, decoded["https://www.critcareapi.com/assignment"], con);
                if(response.error!= null)
                {
                    response.send({error:"Couldn't retrieve Hospital information", message:response.error});
                    con.release();
                    return;
                }
                zone=response.zone;
            }
            else if (permissions.includes("approve:icu")) {
                query = " AND ICUID = " + decoded["https://www.critcareapi.com/assignment"];
                let response = await getDetails(decoded["https://www.critcareapi.com/assignment"], null, con);
                if(response.error!= null)
                {
                    response.send({error:"Couldn't retrieve ICU information", message:response.error});
                    con.release();
                    return;
                }
                zone=response.zone;
            }

            con.query('SELECT * FROM Revision WHERE reviewed = ?'+query, [false], function (err, rows, fields) {
                if (err != null && !response.headersSent) { response.send({ error: "Couldn't retrieve revisions", message:err }); con.release(); return; };
                var ids = [];
                var versMap = new Map();
                for (let i = 0; i < rows.length; i++) {
                    rows[i].newVersion = JSON.parse(rows[i].newVersion);
                    ids.push(rows[i].oldVersion);
                }
                if (rows.length == 0) {
                    response.send({revisions:[], zone:zone});
                    con.release();
                    return;
                }
                con.query('SELECT * FROM Person WHERE PersonID in (?)', [ids], function (err, persrows, fields) {
                    if (err != null && !response.headersSent) { response.send({ error: "Couldn't retrieve personal information related to revision", message:err }); con.release(); return; };
                    for (let i = 0; i < persrows.length; i++) {
                        versMap.set(persrows[i].PersonID, i);
                        persrows[i].specialties = JSON.parse(persrows[i].specialties);
                    }
                    for (let i = 0; i < rows.length; i++) {
                        rows[i].oldVersion = persrows[versMap.get(rows[i].oldVersion)];
                    }
                    response.send({revisions:rows, zone:zone});
                    con.release();
                });

            })

        });
    })
    .put(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (err, con) {
            con.query('SELECT * FROM Revision WHERE reviewed = ?', [false], function (err, rows, fields) {
                if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };
                response.send(rows);
                con.release();
            })

        });
    });
router.route('/:ID')
    .get(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (err, con) {

            con.query('SELECT * FROM Categories WHERE MenuID = ?', [request.params["MenuID"]], function (err, catrows, fields) {

            });
        });
    })
    .post(parseUrlencoded, parseJSON, function (request, response) {
        var fields = request.body.fields;
        var toRemove = request.body.rolesToRemove;
        var toAdd = request.body.rolesToAdd;
        console.log(request.body);
        response.send({message:"done"});
        return;
        var query = 'UPDATE Person SET ';
        var first = true;
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].status != 2)
                continue;
            if (fields[i].key == "specialties")
                fields[i].value = JSON.stringify(fields[i].value);
            if (fields[i].key != "rolesToAdd" && fields[i].key != "rolesToRemove") {
                if (!first) {
                    query += ', ';
                }
                if (fields[i].value === true || fields[i].value === false) {
                    query += fields[i].key + '=' + fields[i].value;
                }
                else {
                    query += fields[i].key + "='" + fields[i].value + "'";
                }
                first = false;
            }
        }
        query += ' WHERE PersonID = ' + request.params["ID"];
        if (!first) {
            connection.acquire(function (err1, con) {
                if (err1 != null && !response.headersSent) { response.send({ error: err1 }); con.release(); return; };
                con.query(query, [], function (err, rows, fields) {
                    if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };
                    con.release();
                });
            });
        }
        console.log(query);
        var values = [];
        for (let i = 0; i < toAdd.length; i++) {
            if (toAdd[i].status == 2)
                values.push([toAdd[i].value.role, toAdd[i].value.ICUID, toAdd[i].value.PersonID]);
        }
        if (values.length > 0) {
            connection.acquire(function (err1, con) {
                if (err1 != null && !response.headersSent) { response.send({ error: err1 }); con.release(); return; };
                con.query("INSERT INTO Role (role, ICUID, PersonID) VALUES ?", [values], function (err, rows, fields) {
                    if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };
                    con.release();
                });
            });
        }
        var removeIDs = [];
        for (let i = 0; i < toRemove.length; i++) {
            if (toRemove[i].status == 2) {
                removeIDs.push(toRemove[i].value.RoleID);
            }
        }
        if (removeIDs.length > 0) {
            connection.acquire(function (err1, con) {
                if (err1 != null && !response.headersSent) { response.send({ error: err1 }); con.release(); return; };
                con.query("DELETE FROM Role WHERE RoleID in (?)", [removeIDs], function (err, rows, fields) {
                    if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };
                    con.release();
                });
            });
        }

        connection.acquire(function (err1, con) {
            if (err1 != null && !response.headersSent) { response.send({ error: err1 }); con.release(); return; };
            con.query("UPDATE Revision SET reviewed = true WHERE RevisionID=?", [request.body.revision], function (err, rows, fields) {
                if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };
                con.release();
                response.send({ Message: "done" });
            });
        });
        //console.log(request.params["ID"]);

    });
async function getDetails(ICUID, HospitalID, con) {
    return new Promise(resolve => {
        if (ICUID == null) {
            con.query('SELECT name,province FROM Hospital WHERE HospitalID = ?', [HospitalID], function (err, rows, fields) {
                if(err!=null)
                    resolve( {error:err});
                resolve( {zone:rows[0].name+", "+rows[0].province});
            });
        }
        else {
            con.query('SELECT Hospital.name,Hospital.province, ICUType FROM Hospital INNER JOIN ICU ON Hospital.HospitalID=ICU.HospitalID WHERE ICUID = ?', [ICUID], function (err, rows, fields) {
                if(err!=null)
                    resolve( {error:err});
                resolve( {zone:rows[0].ICUType+", "+rows[0].name+", "+rows[0].province});
            });
        }
    });

}
module.exports = router;
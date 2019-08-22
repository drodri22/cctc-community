var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({ extended: false });
var parseJSON = bodyParser.json();
var connection = require('../connection');
const myrequest = require('request');
var jwtDecode = require('jwt-decode');
const jwtAuthz = require('express-jwt-authz');
const checkScopes = jwtAuthz(['read:all', 'read:province', 'read:hospital','read:region','read:icu'], { customScopeKey: "permissions" });//checks all checkAllScopes: true, customScopeKey:"permissions", failWithError:true
const googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyD32HwZHswPRfgBlf-WQbQu2J0v-87hVRg',
    componentRestrictions: { country: 'CA' }
});
googleMapsClient.componentRestrictions = { country: 'CA' };
router.route('/')
    .post(parseUrlencoded, parseJSON, function (request, response) {//fill database with appropriate data from google
        setTimeout(function () { usegeocode(request.body.page); }, 3000);
        response.send("done");
    })

    .get(parseUrlencoded, parseJSON, function (request, response) {//get all hopsitals with icus as json, used to display the map
        try {
            var decoded = jwtDecode(request.headers.authorization);
            var ref = decoded.sub;
            var permissions = decoded.permissions;
        }
        catch (err) {
            response.send({ error: "Problem Decoding JWT", err: err });
            return null;
        }
        let query="";
        let query2="";
        if (permissions.includes("read:province")) {//gets appropriate query to filter icus and zone to display to user
            query = ' WHERE u.province = "' + decoded["https://www.critcareapi.com/assignment"] + '"';
        }
        else if (permissions.includes("read:region")) {
            query = ' WHERE u.regionName = "' + decoded["https://www.critcareapi.com/assignment"] + '"';
        }
        else if (permissions.includes("read:hospital")) {
            query = " WHERE u.HospitalID = " + decoded["https://www.critcareapi.com/assignment"];
        }
        else if (permissions.includes("read:icu")) {
            query = " WHERE s.ICUID = " + decoded["https://www.critcareapi.com/assignment"];
            query2=" WHERE ICU.ICUID="+ decoded["https://www.critcareapi.com/assignment"];
        }
        connection.acquire(function (err, con) {
            if (err != null && !response.headersSent) { response.send({ error: err }); return; };
            con.query("SELECT JSON_ARRAYAGG(JSON_OBJECT('HospitalID', u.HospitalID, 'name', u.name, 'phone_number', u.phone_number, 'address', u.address, 'pictureRef', u.pictureRef, " +
                "'lat', u.lat, 'lng', u.lng, " +
                "'urlIdentifier', u.urlIdentifier, 'website', u.website, 'city', u.city, 'country', u.country, 'postalCode', u.postalCode, 'province', u.province, 'municipality', u.municipality, " +
                "'regionName', u.regionName, 'switchboard', u.switchboard, 'googlePlaceID', u.googlePlaceID, 'ICUs', s.ICUs)) Hospitals " +
                "FROM critcaremaster.Hospital u LEFT JOIN ( " +
                "SELECT ICUID, HospitalID, JSON_ARRAYAGG(JSON_OBJECT('ICUID', ICUID, 'HospitalID', HospitalID, 'name', name, 'urlIdentifier', urlIdentifier, 'phone_number', phone_number, " +
                "'switchboard', switchboard, 'siteName', siteName, 'ICUType', ICUType " +
                ")) ICUs " +
                "FROM critcaremaster.ICU "+query2+" GROUP BY HospitalID ) s " + // WHERE ICU.ICUID=344
                "ON s.HospitalID = u.HospitalID"+query, [], function (err, rows, fields) {//u.HospitalID=344 //WHERE s.ICUID=344
                    if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };

                    response.send(rows[0].Hospitals);
                    con.release();
                });
        });
    })
    .put(parseUrlencoded, parseJSON, function (request, response) {//
        connection.acquire(function (err, con) {
            var b = request.body;
            con.query('SELECT * FROM Hospital WHERE urlIdentifier = ?', [b.urlIdentifier], function (err, rows, fields) {
                if (err != null && !response.headersSent) { response.send({ error: err }); con.release(); return; };
                if (rows.length == 0) { response.send({ error: "Not Found" }); con.release(); return; }
                con.query('SELECT * FROM ICU WHERE HospitalID = ?', [rows[0].HospitalID], function (err2, icus, fields) {
                    if (err2 != null && !response.headersSent) { response.send({ error: err2 }); con.release(); return; };
                    rows[0].ICUs = icus;
                    response.send(rows[0]);
                    con.release();
                });

            });
        });
    });
router.route('/:HospitalID')
    .get(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (err, con) {

            con.query('SELECT * FROM Hospital WHERE MenuID = ?', [request.params["HospitalID"]], function (err, catrows, fields) {

            });
        });
    })
    .post(parseUrlencoded, parseJSON, function (request, response) {
        connection.acquire(function (errInitial, con) {
            con.query('SELECT * FROM Branches WHERE url_identifier = ?', [request.params["HospitalID"]], function (err1, branch, fields) {

            });
        });
    });
function usegeocode(page) {
    var offset = Number(page) * 10;
    console.log(offset);
    connection.acquire(function (err, con) {
        con.query('SELECT * FROM Hospital LIMIT 10 OFFSET ?', [offset], function (err, rows, fields) {
            if (err != null) { console.log("error getting: " + err); con.release(); return; };
            if (rows.length != 0) {
                var temp = "";
                for (let i = 0; i < rows.length; i++) {
                    temp += rows[i].HopsitalID + " ";
                    var request = {
                        query: rows[i].name + " " + rows[i].province + " Canada",
                        region: "CA"
                        //fields: ['name', 'geometry', 'formatted_address', 'photos', 'url', 'formatted_phone_number'],
                    };

                    googleMapsClient.places(request, function (err3, response) {
                        if (err3 != null) { console.log("google error:" + err3); con.release(); return; };
                        if (!err3 && response.status == 200) {
                            var temp = response.json.results[0].formatted_address.substring(response.json.results[0].formatted_address.length - 7);
                            console.log(rows[i].name + " " + rows[i].province + " Canada");

                            var addArr = response.json.results[0].formatted_address.split(', ');
                            var lat = response.json.results[0].geometry.location.lat;
                            var long = response.json.results[0].geometry.location.lng;
                            var photo = null;
                            if (response.json.results[0].photos != null && response.json.results[0].photos.length > 0) {
                                photo = response.json.results[0].photos[0].photo_reference;
                            }
                            var placeID = response.json.results[0].place_id;
                            var city = null;
                            var address = null;
                            if (addArr.length == 2) {
                                city = addArr[0];
                            }
                            else {
                                address = addArr[0];
                                city = addArr[1];
                            }
                            if (temp.includes(",")) {
                                temp = null;
                            }
                            var temp2 = 'UPDATE Hospital SET address = ' + address + ', city = ' + city + ', lat = ' + lat + ', long = ' + long + ', pictureRef = ' + photo +
                                ', googlePlaceID=' + placeID + ', postalCode=' + temp + ' WHERE HopsitalID = ' + rows[i].HopsitalID + '';
                            console.log(temp2);
                            con.query('UPDATE Hospital SET address = ?, city = ?, lat = ?, lng = ?, pictureRef = ?, googlePlaceID=?, postalCode=? WHERE HospitalID = ?',
                                [address, city, lat, long, photo, placeID, temp, rows[i].HopsitalID],
                                function (err2, rows2, fields2) {
                                    if (err2 != null) { console.log("error updating: " + err2); con.release(); return; };
                                    console.log("done: " + rows[i].HopsitalID);
                                    if (i == rows.length - 1) {
                                        con.release();
                                        console.log("released");
                                    }
                                })


                        }
                        else {
                            console.log("Error with: " + rows[i].HopsitalID);
                        }
                    });
                }
                console.log(temp);

                setTimeout(function () { usegeocode(Number(page) + 1); }, 5000);
            }
            else {
                console.log("done");
            }

        });
    });

}
module.exports = router;
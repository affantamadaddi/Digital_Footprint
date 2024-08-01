const User = require('../model/user');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const gmail = google.gmail('v1');


module.exports = (req,res,next) => {
    const SCOPES = ['https://mail.google.com/'];
    const TOKEN_PATH = './dev/token.json';

    fs.readFile('./dev/credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), getRecentEmail);
    });


    /**
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
        const {client_secret, client_id, redirect_uris} = credentials.web;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);
    
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
        });
    }
    
    /**
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    /**
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */

    function getRecentEmail(auth) {}
    var code = 'temp';

    function getNewToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        res.redirect(authUrl)
            oAuth2Client.getToken(code, (err, token) => {
            oAuth2Client.setCredentials(token);
            callback(oAuth2Client);
            });
    }
}
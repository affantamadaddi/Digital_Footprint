const Router = require('express').Router();
const User = require('../model/user');
const readline = require('readline');
const fs = require('fs');
const {google} = require('googleapis');
const gmail = google.gmail('v1');

module.exports = (req, res, next) => {
    let code = req.query.code;
    let codeType = typeof code;
    let email = req.query.email;
    let contacts = req.query.contacts;
    contacts = contacts.replaceAll(' ','').split(',');
    const TOKEN_PATH = './dev/token.json';
    var SCOPES = ['https://mail.google.com/'];
        /**
         * Create an OAuth2 client with the given credentials, and then execute the
         * given callback function.
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
         * Get and store new token after prompting for user authorization, and then
         * execute the given callback with the authorized OAuth2 client.
         * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
         * @param {getEventsCallback} callback The callback for the authorized client.
         */
        
         function getNewToken(oAuth2Client, callback) {
            if(codeType !== 'undefined') {
              oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                  if (err) return console.error(err);
                  console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
              });
            }
          }

        /**
         * Lists the labels in the user's account.
         *
         * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
         */
         function makeBody(to, from, subject, message) {
            var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
                "MIME-Version: 1.0\n",
                "Content-Transfer-Encoding: 7bit\n",
                "to: ", to, "\n",
                "from: ", from, "\n",
                "subject: ", subject, "\n\n",
                message
            ].join('');
          
            var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
                return encodedMail;
          }
          function sendMessage(auth, recipient) {
            var contacts = req.query.contacts;
            contacts = contacts.replaceAll(' ','').split(',');
            var sub = 'Data erasure request - from'+email;
            var msg = "Hi, I've used your service in the past. However, I'm now making the conscious decision to reduce my digital footprint and as a result I ask you to please delete any personal data of mine you have stored on your systems.\nI have initiated this request myself and it was sent from my own personal inbox (see From address of this email). I would appreciate your cooperation and an email confirming when the deletion has been completed.\nMy personal details are:\nEmail:"+email+"\nI received an email from your company which indicates your systems hold my personal data.\nThanks";
            for(i=0; i<contacts.length; i++) {
                var raw = makeBody(contacts[i], email, sub, msg);
                const gmail = google.gmail({version: 'v1', auth});
                gmail.users.messages.send({
                    auth: auth,
                    userId: 'me',
                    resource: {
                        raw: raw
                    }
                
                }, function(err, response) {
                    if(err)
                        console.log(err)
                });
            }
          }
          
          fs.readFile('./dev/credentials.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return;
            }
            // Authorize a client with the loaded credentials, then call the
            // Gmail API.
            authorize(JSON.parse(content), sendMessage);
          });
        var sub = 'Data erasure request - from'+email;
        var msg = "Hi, I've used your service in the past. However, I'm now making the conscious decision to reduce my digital footprint and as a result I ask you to please delete any personal data of mine you have stored on your systems.\nI have initiated this request myself and it was sent from my own personal inbox (see From address of this email). I would appreciate your cooperation and an email confirming when the deletion has been completed.\nMy personal details are:\nEmail:"+email+"\nI received an email from your company which indicates your systems hold my personal data.\nThanks";
        res.render('details',{email: email, sub: sub, msg: msg})
}
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const gmail = google.gmail('v1');
const User = require('../model/user');
const Blockchain = require('./blockchain');
const block = new Blockchain();
const mongoose = require('mongoose')
mongoose
.connect('mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false',{
    //For removing the warnings
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.log(err);
})

// If modifying these scopes, delete token.json.
const SCOPES = ['https://mail.google.com/'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), getRecentEmail);
});

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
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
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
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

var nextPageToken = null;
var companyArray = [];
var companyEmail = [];
var tempMail = [];
var lastBlock = null;


function addUser(email) {
  User.count()
  .then(count => {
    return count;
  })
  .then(count => {
    User.findOne({email: email})
    .then(result => {
      if(result) {
        return 0;
      } else {
      User.findOne({index: count})
      .then(result => {
          lastBlock = result;
          var previousBlockHash = lastBlock.hash;
          var currentBlockData = {
            email: email
          }
          var nonce = block.proofOfWork(previousBlockHash, currentBlockData);
          var blockHash = block.hashBlock(previousBlockHash, currentBlockData, nonce);
          User.count()
          .then(result => {
              return result + 1;
          })
          .then(index => { 
              const newBlock = {
                  index: index,
                  timeStamp: Date.now(),
                  email: email,
                  companyName: companyArray,
                  companyEmails: companyEmail,
                  nonce: nonce,
                  previousBlockHash: previousBlockHash,
                  hash:  blockHash
              };
              var user = new User(newBlock);
              user.save()
          })
        })
      }
    })
  })
}

var email = 'ibrahimarab821@gmail.com'
addUser(email);



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

function sendMessage(auth) {
  var raw = makeBody('ibmarab@gmail.com', 'ibrahimarab821@gmail.com', 'This is your subject', 'I got this working finally!!!');
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.messages.send({
      auth: auth,
      userId: 'me',
      resource: {
          raw: raw
      }
  
  }, function(err, response) {
      return(err || response)
  });
}

fs.readFile('credentials.json', function processClientSecrets(err, content) {
  if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  authorize(JSON.parse(content), sendMessage);
});








function getRecentEmail(auth) {
  // Only get the recent email - 'maxResults' parameter
gmail.users.messages.list({auth: auth, userId: 'me', pageToken: nextPageToken, maxResults: '500'}, function(err, response) {
      if (err) {
          console.log('The API returned an error: ' + err);
          return;
      }
    // Get the message id which we will need to retreive tha actual message next.
    for(var i = 0; i < 500; i++) {
      var message_id = response['data']['messages'][i]['id'];
        // Retreive the actual message using the message id
        gmail.users.messages.get({auth: auth, userId: 'me', 'id': message_id}, function(err, response) {
            if (err) {
                return;
            }
            var responseType = typeof response.data.payload.headers.find(o => o.name === 'From');
            if(responseType === 'object') {
              var fromArray = response.data.payload.headers.find(o => o.name === 'From').value.split("<")
              var fromName = fromArray[0].replace('"','').replace('"','')
              var fromEmail = "";
              if(fromArray[1] == null) {
                return;
              } else {
                fromEmail = fromArray[1].replace('>','')
                if(fromEmail.indexOf('@gmail.com') === -1 && fromEmail.indexOf('invitations@linkedin.com') === -1 
                && fromEmail.indexOf('google.com') === -1 && fromEmail.indexOf('@secab.org') === -1) {
                  var nameAndEmail = fromName+fromEmail;
                  var domain = fromEmail.substring(fromEmail.indexOf('@') + 1);
                  if(!companyEmail.includes(nameAndEmail) && !tempMail.includes(fromEmail)) {
                    companyEmail.push(fromName+'contact@'+domain)
                    const https = require('https')
                    const url = "https://api.hunter.io/v2/domain-search?domain="+domain+"&api_key=1a753bee8b21b9d1927eaf662593c6915bb85409";
                    https.get(url, res => {
                      let data = '';
                      res.on('data', chunk => {
                        data += chunk;
                      });
                      res.on('end', () => {
                        data = JSON.parse(data);
                        var email = data.data;
                        var type = typeof email
                        if(type !== 'undefined') {
                          console.log(data.data.emails[0].value)
                          companyEmail.push(fromName+data.data.emails[0].value)
                        }
                      })
                    }).on('error', err => {
                      console.log(err.message);
                    })
                    companyEmail.push(nameAndEmail)
                  }
                  if(!companyArray.includes(fromName) && !tempMail.includes(fromEmail)) {
                    companyArray.push(fromName)
                  }
                  tempMail.push(fromEmail)
                }
              }
            }
            // message_raw = response.data.payload.parts[0].body.data;
            // data = messae_raw;  
            // buff = new Buffer(data, 'base64');  
            // text = buff.toString();
        });
    }
    nextPageToken = response.data.nextPageToken;
    User.find({email: 'ibrahimarab821@gmail.com'})
    .updateOne({companyEmails: companyEmail})
    .updateOne({companyName: companyArray})
    .then(() => {
      return 0;
    })
    getRecentEmail(auth)
  });
}

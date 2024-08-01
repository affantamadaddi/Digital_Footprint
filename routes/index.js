const Router = require('express').Router();
const User = require('../model/user');
const fs = require('fs');
const {google} = require('googleapis');
const gmail = google.gmail('v1');
const Blockchain = require('../dev/blockchain');
const block = new Blockchain();

module.exports = Router.use((req, res, next) => {
    let code = req.query.code;
    let codeType = typeof code;
    if(codeType !== 'undefined' || fs.existsSync('./dev/token.json')) {
        code = code + '&scope=https://mail.google.com/';
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
         * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
         */
        var email = null;
        var nextPageToken = null;
        var companyArray = [];
        var companyEmail = [];
        var tempMail = [];
        var lastBlock = null;
        var runTime = 0;

        function getRecentEmail(auth) {
          if(runTime < 2) {
            gmail.users.getProfile({
                auth: auth,
                userId: 'me'
                }, function(err, result) {
                if(err) {
                    console.log('Error in finding email - Qouta limit reached'+err)
                    if(result) {
                      email = result.data.emailAddress;
                      User.find({email: email})
                                .then(data => {
                                  res.render('apps', {code: code, data: data, email: email});
                                    fs.writeFile('./dev/test.js', 'Hello', 
                                                (err) => {
                                                    if(err)
                                                        console.log(err)
                                    });
                                })
                    }
                    runTime = 10;
                    return;
                }
                if(result) {
                    email = result.data.emailAddress;
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
                                .then(res => {
                                    console.log('New Block added')
                                })
                            })
                            })
                        }
                        })
                    })
                    }
                    addUser(email);
                    gmail.users.messages.list({auth: auth, userId: 'me', pageToken: nextPageToken, maxResults: '500'}, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            User.find({email: email})
                            .then(data => {
                                res.render('apps', {code: code, data: data, email: email});
                                fs.writeFile('./dev/test.js', 'Hello', 
                                                (err) => {
                                                    if(err)
                                                        console.log(err)
                                });
                            })
                            return;
                        }
                        console.log('Fetching apps...'+runTime)
                      // Get the message id which we will need to retreive tha actual message next.
                      for(var i = 0; i < 500; i++) {
                        var message_response = typeof response['data']['messages'][i];
                        if(message_response === 'object') {
                        var message_id = response['data']['messages'][i]['id'];
                          // Retreive the actual message using the message id
                          gmail.users.messages.get({auth: auth, userId: 'me', 'id': message_id}, function(err, response) {
                              if (err) {
                                User.find({email: email})
                                .then(data => {
                                    res.render('apps', {code: code, data: data, email: email})
                                    fs.writeFile('./dev/test.js', 'Hello', 
                                                (err) => {
                                                    if(err)
                                                        console.log(err)
                                    });
                                })
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
                                  && fromEmail.indexOf('google.com') === -1 && fromEmail.indexOf('@secab.org') === -1
                                  && fromEmail.indexOf('googlemail.com') === -1) {
                                    var nameAndEmail = fromName+fromEmail;
                                    var domain = fromEmail.substring(fromEmail.indexOf('@') + 1);
                                    if(!companyEmail.includes(nameAndEmail) && !tempMail.includes(fromEmail)) {
                                      companyEmail.push(fromName+'contact@'+domain)
                                    //   const https = require('https')
                                    //   const url = "https://api.hunter.io/v2/domain-search?domain="+domain+"&api_key=1a753bee8b21b9d1927eaf662593c6915bb85409";
                                    //   https.get(url, res => {
                                    //     let data = '';
                                    //     res.on('data', chunk => {
                                    //       data += chunk;
                                    //     });
                                    //     res.on('end', () => {
                                    //       data = JSON.parse(data);
                                    //       var email = data.data;
                                    //       var type = typeof email
                                    //       if(type !== 'undefined') {
                                    //         console.log(data.data.emails[0].value)
                                    //         companyEmail.push(fromName+data.data.emails[0].value)
                                    //       }
                                    //     })
                                    //   }).on('error', err => {
                                    //     console.log(err.message);
                                    //   })
                                      companyEmail.push(nameAndEmail)
                                    }
                                    if(!companyArray.includes(fromName) && !tempMail.includes(fromEmail)) {
                                      companyArray.push(fromName)
                                    }
                                    tempMail.push(fromEmail)
                                  }
                                }
                              }
                          });
                        }
                      }
                      nextPageToken = response.data.nextPageToken;
                      User.find({email: email})
                      .updateOne({companyEmails: companyEmail})
                      .updateOne({companyName: companyArray})
                      .then(() => {
                        return 0;
                      })
                      runTime++;
                      getRecentEmail(auth)
                    });
                }
            });
          } else {
            function run() {
              console.log(email)
            User.find({email: email})
                            .then(data => {
                                res.render('apps', {code: code, data: data, email: email});
                            })
            }
            setTimeout(run, 1000);
          }
        }
    } else {
        res.render('index');
    }
})
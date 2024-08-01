const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];
const { v4: uuid } = require('uuid');
const User = require('../model/user');
const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;

function Blockchain() {
    this.chain = [];
    //The genisis block (First block of the blockchain)
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    User.findOne({email: 'dummymail@email.com'})
    .then(result => {
        if(result) {
            return 0;
        } else {
            this.createNewBlock('dummymail@email.com',[],[],100,'0','0')
        }
    })
}

Blockchain.prototype.createNewBlock = function(email, companyArray, companyEmail, nonce, previousBlockHash, hash) {
    var index = 0;
    User.count()
    .then(result => {
        index = result + 1;
        return index;
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
            hash: hash
        };
        var user = new User(newBlock);
        user.save()
        .then(() => {
            console.log('Genisis Block created')
        })
        return newBlock;
    })
}


Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockHash, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockHash);
    const hash = sha256(dataAsString);

    return hash;
}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockHash) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockHash, nonce);
    while(hash.substring(0,4) != '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockHash, nonce);
    }

    return nonce;
}


Blockchain.prototype.chainIsValid = function() {
    var testResults = [];
    User.count()
    .then(length => {
        for(let i = 2; i <= length; i++) {
            User.find({index: i})
            .then(result => {
                let nonce = result[0].nonce;
                let currentBlockHash = {
                    email: result[0].email
                }
                let previousBlockHash = null;
                User.find({index: i-1})
                .then(prev => {
                    previousBlockHash = prev[0].hash;
                    let blockHash = this.hashBlock(previousBlockHash, currentBlockHash, nonce);
                    if(result[0].previousBlockHash !== previousBlockHash || blockHash.substring(0,4) !== '0000') {
                        testResults.push(false);
                    } else {
                        testResults.push(true);
                    }
                    if(testResults.length === length - 1) {
                            if(!testResults.includes(false)) {
                                fs.copyFile('./records/db_record.json', './records/verified_record.json', (err) => {})
                                const dbName = 'test';
                                const client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology:false });
                                client.connect(function(err) {
                                    const db = client.db(dbName);
                                    getDocuments(db, function(docs) {
                                        client.close();
                                        try {
                                            fs.writeFile('./records/db_record.json', JSON.stringify(docs), 
                                            (err) => {
                                                if(err)
                                                    console.log(err)
                                            });
                                        }
                                        catch(err) {
                                            console.log('Error writing to file', err)
                                        }
                                    });
                                })
                                const getDocuments = function(db, callback) {
                                    const query = { };
                                    db.collection('users')
                                    .find(query)
                                    .toArray(function(err, result) { 
                                        if (err) throw err; 
                                        callback(result); 
                                    }); 
                                };
                                this.chainIsValid()
                            } else {
                                console.log('Data Manipulated');
                                User.remove()
                                .then(result => {
                                    return console.log('All Documents Deleted');
                                })
                                const client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology:false });
                                client.connect(function(err) {
                                    const db = client.db('test');
                                    const data = fs.readFileSync('./records/verified_record.json');
                                    const docs = JSON.parse(data.toString());
            
                                    db.collection('users')
                                        .insertMany(docs, function(err, result) {
                                            if (err) throw err;
                                            console.log('Verified Data has been Imported Back to Database');
                                            client.close();
                                    })
                                });
                                function restartServer() {
                                    fs.writeFile('./dev/test.js', 'Hello', 
                                                (err) => {
                                                    if(err)
                                                        console.log(err)
                                    });
                                }
                                setTimeout(restartServer, 5000);
                            }
                    }
                })
            })
        }
    })
}

module.exports = Blockchain;
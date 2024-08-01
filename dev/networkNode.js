const express = require('express');
var ejs = require('ejs');
var fs  = require('fs');
const app = express();
const bodyParser = require('body-parser');
const port = process.argv[2];
const mongoose = require('mongoose');
const User = require('../model/user');
const index = require('../routes/index');
const signUp = require('../controllers/signUp');
const details = require('../routes/details');
const path = require('path')
var rootDir = require('../util/path');
const Blockchain = require('./blockchain');
const block = new Blockchain();

rootDir = 'C:/Users/AFFAN TAMADADDI/OneDrive/Desktop/Digital Footprints';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//For making the file available to link with
app.use(express.static(rootDir + '/public'));
app.use('/images', express.static(path.join(rootDir,'images')));

//For running the .ejs files
app.set('view engine','ejs');
app.set('views','views');
app.get('/', index);
app.post('/signup', signUp);
app.get('/details', details);
  
mongoose
.connect('mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false',{
    //For removing the warnings
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    app.listen(port,() => {
        console.log('Server Port is '+port);
    });
    console.log('Connected to MongoDB');
    //block.chainIsValid();
})
.catch(err => {
    console.log(err);
})
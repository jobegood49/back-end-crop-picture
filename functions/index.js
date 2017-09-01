//const functions = require('firebase-functions');
//const admin = require('firebase-admin');
//admin.initializeApp(functions.config().firebase);

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const format = require('util').format;
const fs = require('fs');
const gcs = require('@google-cloud/storage')({
    projectId: 'doppleruploadfile',
    keyFilename: './keyfile.json'
});
const bucket = gcs.bucket('deuploadfile');
const sharp = require('sharp');

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

app.use(bodyParser.json());

const storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        const datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
    }
});

const upload = multer({ // multer settings
    //storage: storage
    storage: multer.memoryStorage()
}).single('photo');

app.get('/', function(req, res, next) {
// render the index page, and pass data to it.
    res.send('working');
});

/** API path that will uploads the files */

app.post('/uploads', function(req, res) {

    upload(req, res, function (err) {

        //blobCreateProcess(req.file.originalname, req.file.buffer, res)

        blobDeleteProcess(req.file.originalname);

        sharp(req.file.buffer)
            .resize(300, 300)
            .crop('east')
            .max()
            //.withoutEnlargement(true)
            .toBuffer()
            .then(data => {
                console.log('resize', data);
                blobCreateProcess(req.file.originalname, data, res)
            })
            .catch((err) => {
                console.error('ERROR:', err);
            });
    });
});

let blobDeleteProcess = function (fileName) {
    let blob = bucket.file(fileName);

    blob
        .delete()
        .then(() => {
            console.log('public');
        })
        .then(() => {
            console.log('blob deleted');
        })
        .catch((err) => {
            console.error('ERROR:', err);
        });
};

let blobCreateProcess = function (fileName, buffer, res) {

    let blob = bucket.file(fileName);

    let blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
        console.error(err);
    });

    blobStream.on('finish', () => {
        console.log('inside blobStream');
        const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
        console.log(publicUrl);

        blob
            .makePublic()
            .then(() => {
                console.log('public');
            })
            .then(() => {
                res.status(200).json({
                    url: publicUrl
                });

            })
            .catch((err) => {
                console.error('ERROR:', err);
            });

    });

    blobStream.end(buffer);

};

//exports.api = functions.https.onRequest(app);

app.listen('3001', function(){
    console.log('running on 3001...');
});

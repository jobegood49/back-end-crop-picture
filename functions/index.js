//const functions = require('firebase-functions');
//const admin = require('firebase-admin');
//admin.initializeApp(functions.config().firebase);

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const format = require('util').format;
const Storage = require('@google-cloud/storage');



app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

var DIR = './uploads/';

app.use(bodyParser.json());


//var upload = multer({dest: DIR}).single('photo');
/* GET home page. */

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
    }
});

var upload = multer({ //multer settings
    //storage: storage
    storage: multer.memoryStorage()
}).single('photo');

app.get('/', function(req, res, next) {
// render the index page, and pass data to it.
    res.send('working');
});

/** API path that will uploads the files */

app.post('/uploads', function(req, res) {
    const fs = require('fs');
    const gcs = require('@google-cloud/storage')({
        projectId: 'doppleruploadfile',
        keyFilename: './keyfile.json'
    });

    const bucket = gcs.bucket('deuploadfile');
    upload(req,res,function(err){
        console.log("req file", req.file);

        const blob = bucket.file(req.file.originalname);

        const blobStream = blob.createWriteStream();

        //console.log(req.file.buffer);

        sharp = require('sharp');

        sharp(req.file.buffer)
            .resize(300, 300)
            .max()
            .toBuffer()
            .then( data => {
                console.log('data', data);

                blobStream.on('error', (err) => {
                    console.error(err);
                });

                blob
                    .makePublic()
                    .then(() => {
                        console.log('public');
                    })
                    .catch((err) => {
                        console.error('ERROR:', err);
                    });

                blobStream.on('finish', () => {
                    // The public URL can be used to directly access the file via HTTP.
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

                    //res.status(200).json({
                    //    url: publicUrl
                    //});
                });

                blobStream.end(data);

                return data;
            })
            .catch( err => console.error(err));

        //blobStream.on('error', (err) => {
        //    console.error(err);
        //});
        //
        //blob
        //    .makePublic()
        //    .then(() => {
        //        console.log('public');
        //    })
        //    .catch((err) => {
        //        console.error('ERROR:', err);
        //    });
        //
        //blobStream.on('finish', () => {
        //    // The public URL can be used to directly access the file via HTTP.
        //    const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
        //    console.log(publicUrl);
        //
        //    blob
        //        .makePublic()
        //        .then(() => {
        //            console.log('public');
        //        })
        //        .then(() => {
        //            res.status(200).json({
        //                url: publicUrl
        //            });
        //
        //        })
        //        .catch((err) => {
        //            console.error('ERROR:', err);
        //        });
        //
        //    //res.status(200).json({
        //    //    url: publicUrl
        //    //});
        //});
        //
        //blobStream.end(req.file.buffer);

    });

});

//exports.api = functions.https.onRequest(app);

app.listen('3001', function(){
    console.log('running on 3001...');
});

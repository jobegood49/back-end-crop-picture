const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

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

//our file upload function.
//router.post('/', function (req, res, next) {
//    var path = '';
//    upload(req, res, function (err) {
//        if (err) {
//            // An error occurred when uploading
//            console.log(err);
//            return res.status(422).send("an Error occured")
//        }
//        // No error occured.
//        path = req.file.path;
//        return res.send("Upload Completed for "+path);
//    });
//})



/** API path that will uploads the files */

app.post('/uploads', function(req, res) {
    const fs = require('fs');
    const gcs = require('@google-cloud/storage')({
        projectId: 'fileupload-177714',
        keyFilename: './keyfile.json'
    });

    const bucket = gcs.bucket('doppleruploadfile');
    upload(req,res,function(err){
        //console.log("hello file 2", req.file);

        const blob = bucket.file(req.file.originalname);

        //const blobStream = blob.createWriteStream();

        //console.log(req.file.buffer);

        const im = require('imagemagick');

        //im.readMetadata({
        //    srcData: req.file.buffer
        //}, function(err, metadata) {
        //    if (err) throw err;
        //    console.log('metadata', metadata.exif.dateTimeOriginal );
        //});
        //
        //im.identify({
        //    srcData: req.file.buffer
        //}, function (err, features) {
        //    if (err) throw err;
        //    console.log('features', features);
        //});

        im.crop({
            srcData: req.file.buffer,
            width: 200,
            height: 200,
            quality: 0.4
        }, function(err, stdout, stderr) {
            if (err) throw err;
            console.log('stdout', stdout);
            //console.log('blob', blob);

            const blobStream = blob.createWriteStream();

            blobStream.on('error', (err) => {
                next(err);
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

            blobStream.end(stdout);
        });

        //console.log('stdout2', stdout);

        //blobStream.on('error', (err) => {
        //    next(err);
        //});

        //blob
        //    .makePublic()
        //    .then(() => {
        //        console.log('public');
        //    })
        //    .catch((err) => {
        //        console.error('ERROR:', err);
        //    });

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

        //blobStream.end(req.file.buffer);

        //if(err){
        //    res.json({error_code:1,err_desc:err});
        //    return;
        //}
        //res.json({error_code:0,err_desc:null});
    });

});

exports.api = functions.https.onRequest(app);

//app.listen('3001', function(){
//    console.log('running on 3001...');
//});
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

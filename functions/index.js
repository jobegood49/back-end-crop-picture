//const functions = require('firebase-functions');
//const admin = require('firebase-admin');
//admin.initializeApp(functions.config().firebase);

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const format = require('util').format;
const jimp = require('jimp');

app.use(function (req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

app.use(bodyParser.json());

//const upload = multer({dest: DIR}).single('photo');
/* GET home page. */

const storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        const datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
    }
});

const upload = multer({ //multer settings
    //storage: storage
    storage: multer.memoryStorage()
}).single('photo');

app.get('/', function (req, res, next) {
// render the index page, and pass data to it.
    res.send('working');
});

/** API path that will uploads the files */

app.post('/uploads', function (req, res) {

    const fs = require('fs');

    const gcs = require('@google-cloud/storage')({
        projectId: 'doppleruploadfile',
        keyFilename: './keyfile.json'
    });
    const bucket = gcs.bucket('deuploadfile');
    upload(req, res, function (err) {

        console.log("req file buffer", req.file.buffer);

        const blob = bucket.file(req.file.originalname);

        //console.log(req.file.buffer);
        jimp.read(req.file.buffer).then((image) => {
            console.log('image before traitement : ', image);
            image = image.scale(0.8);
            console.log('image after traitement : ', image);
            return image.bitmap.data;
        }).then((image) => {
            console.log('then image', image);

            const blobStream = blob.createWriteStream();

            blobStream.on('error', (err) => {
                console.error(err);
            });

            blobStream.on('finish', () => {
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

            blobStream.end(image);

        }).
        catch((err) => {
            console.log(err);
        });

    });

});

//exports.api = functions.https.onRequest(app);

app.listen('3001', function(){
    console.log('running on 3001...');
});
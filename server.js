const baseRoute = '/api/v1';
const database = 'notes';

var express = require('express');
var firebase = require('firebase');
var bodyParser = require('body-parser');
const {Storage} = require('@google-cloud/storage');
const Multer = require('multer');

var app = express();
const storage = new Storage ();
const bucket = storage.bucket("gs://drigo-api-project.appspot.com");
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
  }
});
app.use(bodyParser.json()); //need to parse HTTP request body

const config = {
  apiKey: "AIzaSyBxXx504_IQizuSC0apMup1YEcPmF-FJhs",
  authDomain: "drigo-api-project.firebaseapp.com",
  databaseURL: "https://drigo-api-project.firebaseio.com",
  projectId: "drigo-api-project",
  storageBucket: "drigo-api-project.appspot.com",
  messagingSenderId: "987582613278",
  appId: "1:987582613278:web:7b0e982d1c537e86"
};

firebase.initializeApp(config);

function dbNotes(id) {
  return id == null ?
    firebase.database().ref(`/${database}/`) :
    firebase.database().ref(`/${database}/${id}/`);
}

/*function dbConfig(param) {
  return param == null ?
    firebase.database().ref(`/Config/`) :
    firebase.database().ref(`/Config/${param}/`);
}*/

function getImageUrl(imageFileName) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${imageFileName}?alt=media`;
}

function convertToArray(obj) {
  return Object.keys(obj).map(function(key) {
    return obj[key];
  });
}

function sendSuccess(res, data) {
  console.log('Success => ' + data);
  res.status(200).send({
    status: 'success',
    data: data
  });
}

function sendError(res, error) {
  console.log('Error => ' + error);
  res.status(500).send({
    status: 'error',
    data: error
  });
}

//Fetch instances
app.get(`${baseRoute}/notes`, function (req, res) {

  //TODO: implement get from :id
  console.log(" > HTTP Get Request");
  var ref = dbNotes(null);

  //Attach an asynchronous callback to read the data
  ref.on("value",
    function(snapshot) {
      var ret = snapshot.exists() ? convertToArray(snapshot.val()) : [];
      sendSuccess(res, ret);
      ref.off("value");
    },
    function (errorObject) {
      sendError(res, "The read failed: " + errorObject.code);
      ref.off("value");
    }
  );
});

//Create new instance
app.put(`${baseRoute}/notes`, multer.single('file'), function (req, res) {

  console.log(" > HTTP Put Request");

  var id = Date.now().toString(); //req.body.id; //TODO: controlar ID
  var title = req.body.title;
  var description = req.body.description;
  var datetime = new Date();
  //var imageUrl = req.body.imageUrl;
  var file = req.file;
  var newFileName = `${id}_${file.originalname}`;
  
  if (file) {
    uploadImageToStorage(file, newFileName).then((success) => {
      //The file's uploads was successful. So, store the date into firebase
      console.log('Image uploded. Starting to storange the data...');
      var ref = dbNotes(id);
      ref.set({Id: id, Title: title, Description: description, Datetime: datetime, File: newFileName},
            function(error) {
              if (error)
                sendError(res, 'Failed to save record:' + error);
              else
                sendSuccess(res, id);
            });
    }).catch((error) => {
      sendError(res, `Failed to upload the file. Message: ${error}`);
    });
  }
});

/*//Update existing instance
app.post(`${baseRoute}/notes`, function (req, res) {

  console.log("HTTP POST Request");

  var userName = req.body.UserName;
  var name = req.body.Name;
  var age = req.body.Age;

  var userReference = getFirebaseReference(userName);
  userReference.update({Name: name, Age: age},
         function(error) {
          if (error) {
            res.send("Data could not be updated." + error);
          }
          else {
            res.send("Data updated successfully.");
          }
          });
});*/

//Delete an instance
app.delete(`${baseRoute}/notes/:id`, function (req, res) {

  console.log(" > HTTP DELETE Request");

  var id = req.params.id;

  //TODO: verify if item exists to return a diferent error ---> VER: https://stackoverflow.com/questions/24824732/test-if-a-data-exist-in-firebase

  dbNotes(id).remove(
    function(error) {
      if (error) 
        sendError(res, 'Error: ' + error)
      else
        sendSuccess(res, `Success. id '${id}' was deleted`);
    });
});

/**
 * Upload the image file to Google Storage
 * @param {File} file object that will be uploaded to Google Storage
 */
const uploadImageToStorage = (file, newFileName) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('No image file');
    }

    let fileUpload = bucket.file(newFileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      reject('Something is wrong! Error: ' + error);
    });

    blobStream.on('finish', () => {
      // The public URL can be used to directly access the file via HTTP.
      const url = getImageUrl(fileUpload.name);
      console.log (`PUBLIC URL: ${url}`);
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
}

var server = app.listen(8080, function () {
  
  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);

  /*console.log("Getting next avaliable id...");
  var ref = dbConfig('nextId');
  ref.on("value",
    function(snapshot) {
      nextId = snapshot.val();
      console.log('Next avaliable id: ' + nextId);
      ref.off("value");

      console.log("Example app listening at http://%s:%s", host, port);
    },
    function (errorObject) {
      throw 'Could not get the next id: ' + errorObject.code;
    }
  );*/
});
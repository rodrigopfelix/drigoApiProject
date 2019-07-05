var express = require('express');
var firebase = require('firebase');
var bodyParser = require('body-parser');

var app = express();
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

//Fetch instances
app.get('/', function (req, res) {

  console.log("HTTP Get Request");
  var userReference = firebase.database().ref("/Users/");

  //Attach an asynchronous callback to read the data
  userReference.on("value",
        function(snapshot) {
          console.log(snapshot.val());
          res.json(snapshot.val());
          userReference.off("value");
          },
        function (errorObject) {
          console.log("The read failed: " + errorObject.code);
          res.send("The read failed: " + errorObject.code);
       });
});

//Create new instance
app.put('/', function (req, res) {

  console.log("HTTP Put Request");

  var userName = req.body.UserName;
  var name = req.body.Name;
  var age = req.body.Age;

  var referencePath = '/Users/'+userName+'/';
  var userReference = firebase.database().ref(referencePath);
  userReference.set({Name: name, Age: age},
         function(error) {
          if (error) {
            res.send("Data could not be saved." + error);
          }
          else {
            res.send("Data saved successfully.");
          }
      });
});

//Update existing instance
app.post('/', function (req, res) {

  console.log("HTTP POST Request");

  var userName = req.body.UserName;
  var name = req.body.Name;
  var age = req.body.Age;

  var referencePath = '/Users/'+userName+'/';
  var userReference = firebase.database().ref(referencePath);
  userReference.update({Name: name, Age: age},
         function(error) {
          if (error) {
            res.send("Data could not be updated." + error);
          }
          else {
            res.send("Data updated successfully.");
          }
          });
});

//Delete an instance
app.delete('/User/:userName', function (req, res) {

  console.log("HTTP DELETE Request");

  var userName = req.params.userName;

  console.log("User to delete: " + userName);
  //TODO: verify if item exists to return a diferent error

  var referencePath = '/Users/'+userName+'/';
  var userReference = firebase.database().ref(referencePath);
  userReference.remove(
         function(error) {
          if (error) {
            res.send("Data could not be deleted." + error);
          }
          else {
            res.send("Data deleted successfully.");
          }
          });
});

var server = app.listen(8080, function () {

   var host = server.address().address;
   var port = server.address().port;

   console.log("Example app listening at http://%s:%s", host, port);
});

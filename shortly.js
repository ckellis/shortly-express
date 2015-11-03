var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/', 
function(req, res) {
  res.render('index');
});

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.use('/links', function(req, res, next) {
  if (req.session) {
    next();
  } else {
    res.redirect('/login');
  }
});

app.get('/links', 
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  })
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

app.get('/login', function(req, res, next) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});
/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login', function(req, res) {
  // {username: username, password: password}

  Users.query({where : {username : req.body.username} })
    .fetchOne()
    .then(function(userModel) {
      console.log(userModel);
      if (userModel.checkPassword(req.body.password)) {
        console.log("OK");
        // give them their links 
      } else {
        res.redirect(301, login);
      }
    })
})
//check if user is currently logged in
  //if yes, give them their list
//if not, prompt login


//if get request to signup button
  // redirect to signup page

app.post('/signup', function(req, res) {
  console.log('in signup');
  console.log(req.body);
  new User({
      username : req.body.username,
      password : req.body.password
    })
    .save()
    .then(function(userModel) {
    return Users.add(userModel);
  })


  .then(function() {
    console.log("New user created")
  })
  .catch(function(err) {
    console.log("OH NO " + err);
  })
})
//if post request to signup
  //check if username exists
    // if not
      //salt password
      //hash password
      //store username, password and salt


//if post request to login
  //look up password and salt
  //add salt, hash 
  //if match, give them their list and cookie
  //if not, prompt login


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

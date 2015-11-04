var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var oAuth = require('oauthio-web');


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

app.use(session({
  secret : 'hello'
}));

var isLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}
var associateWithUser = function(req, link) {
  return new User({username : req.session.user}).fetch()
    .then(function(user) {
       return user.links().attach(link)
    })
}

app.get('/', isLoggedIn, 
function(req, res) {
    res.render('index');
});

app.get('/create', isLoggedIn, 
function(req, res) {
  res.render('index');
});


app.get('/links', isLoggedIn, 
function(req, res) {
  new User({username : req.session.user}).fetch({ withRelated : ['links'] })
    .then(function(joined) {
      res.send(200, joined.relations.links.models);
    });
});

app.get('/logout', isLoggedIn,
  function(req, res) {
    req.session.destroy();
    res.render('login');
  })

app.post('/links', isLoggedIn, 
function(req, res) {
  var uri = req.body.url;
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(link) {
    if (link) {
      associateWithUser(req, link)
      .then(function() {
        res.send(200, link.attributes);
      })
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
            associateWithUser(req, newLink)
            .then(function(){
              res.send(200, newLink)
            });
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
  new User({username : req.body.username}).fetch()
    .then(function(userModel) {
        if (userModel) {
          userModel.checkPassword(req.body.password, function(match) {
            if (match) {
              req.session.regenerate(function(){
                req.session.user = req.body.username;
                res.redirect('/');    
              }) 
            } else {
              res.redirect('/login');              
            }
          });
        } else {
        res.redirect('/signup')
        }
    });
});

app.post('/signup', function(req, res) {
  new User({username : req.body.username}).fetch()
    .then(function(userModel) {
      if (userModel) {
        res.redirect('/login');
      } else {
        new User({
          username : req.body.username,
          password : req.body.password
        })
        .save()
        .then(function(userModel) {
          return Users.add(userModel);
        })
        .then(function() {
          console.log("New user created");
          res.redirect('/login');
        })
        .catch(function(err) {
          console.log("OH NO " + err);
        })
      }
    })
})

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

var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Click = require('./link');
var crypto = require('crypto');
var sha1 = require('sha1')




var User = db.Model.extend({
  tableName : 'users',
  hasTimestamps : true,
  links : function() {
    return this.hasMany(Link);
  },
  initialize : function() {
    this.on('creating', function(model, attrs, options) {
      console.log(model.attributes);
      var hashed = sha1(model.attributes.password);
      console.log(hashed);
      model.set('password', hashed);
    });
  },
  checkPassword : function(password) {
    var shasum = crypto.createHash('sha1');
    shasum.update(password);
    return password === this.get('password'); 
  }
});

module.exports = User;
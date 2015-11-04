var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Click = require('./link');
var crypto = require('crypto');
var sha1 = require('sha1')
var Link = require('./link.js')




var User = db.Model.extend({
  tableName : 'users',
  hasTimestamps : true,
  links : function() {
    return this.belongsToMany(Link);
  },
  initialize : function() {
    this.on('creating', this.hashPassword);
  },
  checkPassword : function(password, callback) {
    bcrypt.compare(password, this.get('password'), function(err, isMatch) {
      callback(isMatch);
    });
  },
  hashPassword: function() {
    var cipher = Promise.promisify(bcrypt.hash);
    return cipher(this.get('password'), null, null).bind(this)
      .then(function(hash) {
        this.set('password', hash);
      })
  }
});

module.exports = User;
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
    this.on('creating', function(model, attrs, options) {
      model.set('password', sha1(model.attributes.password));
    });
  },
  checkPassword : function(password) {
    return this.get('password') == sha1(password); 
  }
});

module.exports = User;
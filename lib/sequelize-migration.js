'use strict';
var lodash = require('lodash');
var schema = require('./sequelize-schema');

var defaults = lodash.reduce(schema(), function(result, value, key) {
  result[key] = key;
  return result;
}, {});

module.exports = {
  up: function(queryInterface, Sequelize, opts) {
    var options = Object.assign({}, defaults, opts || {});
    var prefix = options.prefix || '';
    var dbSchema = schema();

    lodash.each(options, function(item, name) {
      queryInterface.createTable(
        prefix + item,
        Object.assign({}, dbSchema[name], {
          createdAt: Sequelize.DATE,
          updatedAt: Sequelize.DATE,
        })
      );
    });
  },

  down: function(queryInterface, Sequelize, opts) {
    var options = Object.assign({}, defaults, opts || {});
    var prefix = options.prefix || '';
    lodash.each(options, function(item, name) {
      queryInterface.dropTable(prefix + item);
    });
  }
};

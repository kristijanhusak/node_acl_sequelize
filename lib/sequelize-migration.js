'use strict';
var lodash = require('lodash');
var schema = require('./sequelize-schema');

var defaults = lodash.reduce(schema(), function(result, value, key) {
  result[key] = key;
  return result;
}, {});

module.exports = {
  up: function(queryInterface, Sequelize, opts) {
    var options = lodash.assign({}, defaults, opts || {});
    var prefix = options.prefix || '';
    var dbSchema = schema();
    var tables = Object.keys(defaults);

    lodash.each(tables, function(table) {
      queryInterface.createTable(
        prefix + options[table],
        Object.assign({}, dbSchema[table], {
          createdAt: Sequelize.DATE,
          updatedAt: Sequelize.DATE,
        })
      );
    });
  },

  down: function(queryInterface, Sequelize, opts) {
    var options = lodash.assign({}, defaults, opts || {});
    var prefix = options.prefix || '';
    var tables = Object.keys(defaults);

    lodash.each(tables, function(table) {
      queryInterface.dropTable(prefix + options[table]);
    });
  }
};

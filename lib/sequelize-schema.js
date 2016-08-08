'use strict';

var sequelize = require('sequelize');
var buckets = ['meta', 'parents', 'permissions', 'resources', 'roles', 'users'];
var lodash = require('lodash');

module.exports = function() {
  var results = {};
  lodash.each(buckets, function(bucket) {
    if (bucket === 'permissions') {
      results[bucket] = {
        key: {
          type: sequelize.TEXT,
          primaryKey: true
        },
        value: sequelize.JSON
      };
    } else {
      results[bucket] = {
        key: {
          type: sequelize.TEXT,
          primaryKey: true
        },
        value: sequelize.ARRAY(sequelize.TEXT),
      }
    }
  });

  return results;
};

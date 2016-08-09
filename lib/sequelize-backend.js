/**
	Sequelize backend
	Implementation of the storage backend using Sequelize.js
*/
'use strict';

var contract = require('./contract');
var async = require('async');
var _ = require('lodash');
var sequelize = require('sequelize');
var sequelizeSchema = require('./sequelize-schema');
var migration = require('./sequelize-migration');

function toArray(data) {
  if (Array.isArray(data)) {
    return data.map(function(item) {
      return item.toJSON();
    });
  }

  return data && data.toJSON() || null;
}

function SequelizeBackend(db, prefix, options) {
	this.db = db;
  this.buckets = {};
  var opts = _.extend({
    meta: 'meta',
    parents: 'parents',
    permissions: 'permissions',
    resources: 'resources',
    roles: 'roles',
    users: 'users',
    sync: true,
    debug: false
  }, options);

  this.debug = opts.debug;

	this.prefix = typeof prefix !== 'undefined' ? prefix : '';

  var schema = sequelizeSchema();

  _.each(Object.keys(schema), function(bucket) {
    this.buckets[bucket] = this.db.define(bucket, schema[bucket], {
      tableName: this.prefix + opts[bucket]
    })
  }.bind(this));

  if (opts.sync === true) {
    _.each(this.buckets, function(bucket, name) {
      bucket.sync({
        logging: this.debug ? console.log : false
      });
    }.bind(this));
  }
}

SequelizeBackend.prototype = {
	/**
		 Begins a transaction.
	*/
	begin: function() {
		// returns a transaction object
		return [];
	},

	/**
		 Ends a transaction (and executes it)
	*/
	end: function(transaction, cb) {
		contract(arguments)
			.params('array', 'function')
			.end()
		;

		// Execute transaction
		async.series(transaction, function(err) {
			cb(err instanceof Error ? err : undefined);
		});
	},

	/**
		Cleans the whole storage.
	*/
	clean: function(cb) {
		contract(arguments)
			.params('function')
			.end()
		;
		cb(undefined);
	},

	/**
		 Gets the contents at the bucket's key.
	*/
	get: function(bucket, key, cb) {
		contract(arguments)
			.params('string', 'string|number', 'function')
			.end()
		;

    key = String(key);

		if (bucket.indexOf('allows') != -1) {
      this.buckets.permissions
        .findAll({
          where: { key: bucket },
          attributes: ['key', 'value']
        })
        .then(toArray)
				.then(function(result) {
					if (result.length) {
						cb(undefined, (result[0].value[key] ? result[0].value[key] : []));
					} else {
						cb(undefined, []);
					}
				})
			;
		} else {
			this.buckets[bucket]
        .findAll({
          where: { key: key },
          attributes: ['key', 'value']
        })
        .then(toArray)
				.then(function(result) {
					cb(undefined, (result.length ? result[0].value : []));
				})
			;
		}
	},

	/**
		Returns the union of the values in the given keys.
	*/
	union: function(bucket, keys, cb) {
		contract(arguments)
			.params('string', 'array', 'function')
			.end()
		;

		if (bucket.indexOf('allows') != -1) {
			this.buckets.permissions
        .findAll({
          where: { key: bucket },
          attributes: ['key', 'value']
        })
        .then(toArray)
				.then(function(results) {
					if (results.length && results[0].value) {
						var keyArrays = [];
						_.each(keys, function(key) {
							keyArrays.push.apply(keyArrays, results[0].value[key]);
						});
						cb(undefined, _.union(keyArrays));
					} else {
						cb(undefined, []);
					}
				})
			;
		} else {
			this.buckets[bucket]
        .findAll({
          where: { key: { $in: keys } },
          attributes: ['key', 'value']
        })
        .then(toArray)
				.then(function(results) {
					if (results.length) {
						var keyArrays = [];
						_.each(results, function(result) {
							keyArrays.push.apply(keyArrays, result.value);
						});
						cb(undefined, _.union(keyArrays));
					} else {
						cb(undefined, []);
					}
				})
			;
		}
	},

	/**
		Adds values to a given key inside a table.
	*/
	add: function(transaction, bucket, key, values) {
		contract(arguments)
			.params('array', 'string', 'string|number','string|array|number')
			.end()
		;

		var self = this;
		var table = '';
    key = String(key);
		values = Array.isArray(values) ? values : [values]; // we always want to have an array for values

		transaction.push(function(cb) {

			if (bucket.indexOf('allows') != -1) {
				self.buckets.permissions
          .findAll({
            where: { key: bucket },
            attributes: ['key', 'value']
          })
          .then(toArray)
					.then(function(result) {
						var json = {};

						if (result.length === 0) {

							// if no results found do a fresh insert
							json[key] = values;
              return self.buckets.permissions
                .create( {key: bucket, value: json });
							;
						} else {

							// if we have found the key in the table then lets refresh the data
							if (_.has(result[0].value, key)) {
								result[0].value[key] = _.union(values, result[0].value[key]);
							} else {
								result[0].value[key] = values;
							}

							return self.buckets.permissions
                .update({ key: bucket, value: result[0].value }, {
                  where: { key: bucket }
                })
							;
						}
					})
					.then(function() {
						cb(undefined);
					})
				;
			} else {
				self.buckets[bucket]
          .findAll({
            where: { key: key },
            attributes: ['key', 'value']
          })
          .then(toArray)
					.then(function(result) {
						if (result.length === 0) {

							// if no results found do a fresh insert
							return self.buckets[bucket]
								.create({key: key, value: values})
							;
						} else {

							// if we have found the key in the table then lets refresh the data
							return self.buckets[bucket]
                .update({ value: _.union(values, result[0].value) }, {
                  where: { key: key }
                })
							;
						}
					})
					.then(function() {
						cb(undefined);
					})
				;
			}
		});
	},

	/**
		 Delete the given key(s) at the bucket
	*/
	del: function(transaction, bucket, keys) {
		contract(arguments)
			.params('array', 'string', 'string|array')
			.end()
		;

		var self = this;
		var table = '';
		keys = Array.isArray(keys) ? keys : [keys]; // we always want to have an array for keys

		transaction.push(function(cb) {

			if (bucket.indexOf('allows') != -1) {
				self.buckets.permissions
          .findAll({
            where: { key: bucket },
            attributes: ['key', 'value']
          })
          .then(toArray)
					.then(function(result) {
						if (result.length === 0) {

						} else {
							_.each(keys, function(value) {
								result[0].value = _.omit(result[0].value, value);
							});

							if (_.isEmpty(result[0].value)) {
								// if no more roles stored for a resource the remove the resource
                return self.buckets.permissions
                  .destroy({
                    where: { key: bucket }
                  })
								;
							} else {
								return self.buckets.permissions
                  .update({ value: result[0].value }, {
                    where: { key: bucket }
                  })
								;
							}
						}
					})
					.then(function() {
						cb(undefined);
					})
				;
			} else {
				table = self.prefix + bucket;
				self.buckets[bucket]
          .destroy({
            where: {
              key: { $in: keys }
            }
          })
					.then(function() {
						cb(undefined);
					})
				;
			}
		});
	},

	/**
		Removes values from a given key inside a bucket.
	*/
	remove: function(transaction, bucket, key, values) {
		contract(arguments)
			.params('array', 'string', 'string|number','string|number|array')
			.end()
		;

    key = String(key);
		var self = this;
		values = Array.isArray(values) ? values : [values]; // we always want to have an array for values

		transaction.push(function(cb) {

			if (bucket.indexOf('allows') != -1) {
        self.buckets.permissions
          .findAll({
            where: { key: bucket },
            attributes: ['key', 'value']
          })
          .then(toArray)
					.then(function(result) {
						if(result.length === 0) {return;}

						// update the permissions for the role by removing what was requested
						_.each(values, function(value) {
							result[0].value[key] = _.without(result[0].value[key], value);
						});

						//  if no more permissions in the role then remove the role
						if (!result[0].value[key].length) {
							result[0].value = _.omit(result[0].value, key);
						}

						return self.buckets.permissions
              .update({ value: result[0].value }, {
                where: { key: bucket }
              })
						;
					})
					.then(function() {
						cb(undefined);
					})
				;
			} else {
        self.buckets[bucket]
          .findAll({
            where: { key: key },
            attributes: ['key', 'value']
          })
          .then(toArray)
					.then(function(result) {
						if(result.length === 0) {return;}

						var resultValues = result[0].value;
						// if we have found the key in the table then lets remove the values from it
						_.each(values, function(value) {
							resultValues = _.without(resultValues, value);
						});
						return self.buckets[bucket]
              .update({ value: resultValues }, {
                where: { key: key }
              })
						;
					})
					.then(function() {
						cb(undefined);
					})
				;
			}
		});
	}
};

SequelizeBackend.schema = sequelizeSchema;
SequelizeBackend.migration = migration;


exports = module.exports = SequelizeBackend;

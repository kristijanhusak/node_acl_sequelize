var sequelize = require('sequelize');
var SequelizeBackend = require('../');
var tests = require('../node_modules/acl/test/tests');
var assert = require('chai').assert;


function run() {
	Object.keys(tests).forEach(function(test) {
		tests[test]();
	});
}

// var dbUrl = 'postgres://postgres@127.0.0.1:5432/travis_ci_test';
var dbUrl = 'postgres://postgres:SuperSecure1!@192.168.99.100:5432/squire-development'

describe('Sequelize - Postgres', function () {
  before(function (done) {
    var self = this;
    var sequelize = require('sequelize');

    var seq = new sequelize(dbUrl, {
      logging: false
    });

    seq.authenticate().then(function() {
      return seq.dropSchema().then(function() {
        self.backend = new SequelizeBackend(seq, 'acl_');
        done();
      });
    }).catch(done);
  })

  run();

  it('properly runs up migration', function() {
    var migration = [];
    var queryInterfaceStub = {
      createTable: function(tableName, schema) {
        migration.push(tableName);
      }
    }

    var expected = ['meta', 'parents', 'permissions', 'resources', 'roles', 'users'];

    SequelizeBackend.migration.up(queryInterfaceStub, sequelize);

    assert.deepEqual(migration, expected);
  });

  it('allows overriding options in migrations', function() {
    var migration = [];
    var queryInterfaceStub = {
      createTable: function(tableName, schema) {
        migration.push(tableName);
      }
    }

    var expected = ['meta', 'parents_acl', 'permissions', 'resources', 'roles_acl', 'users'];

    SequelizeBackend.migration.up(queryInterfaceStub, sequelize, {
      roles: 'roles_acl',
      parents: 'parents_acl'
    });

    assert.deepEqual(migration, expected);
  });

  it('properly runs down migration', function() {
    var migration = [];
    var queryInterfaceStub = {
      dropTable: function(tableName, schema) {
        migration.push(tableName);
      }
    }

    var expected = ['meta', 'parents', 'permissions', 'resources', 'roles', 'users'];

    SequelizeBackend.migration.down(queryInterfaceStub, sequelize);

    assert.deepEqual(migration, expected);
  });
});

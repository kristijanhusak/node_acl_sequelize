var sequelize = require('sequelize');
var SequelizeBackend = require('../');
var tests = require('../node_modules/acl/test/tests');
var assert = require('chai').assert;


function run() {
	Object.keys(tests).forEach(function(test) {
		tests[test]();
	});
}

describe('Sequelize - Postgres', function () {
  before(function (done) {
    var self = this
      , sequelize = require('sequelize')

    var seq = new sequelize('postgres://postgres@127.0.0.1:5432/travis_ci_test');

    seq.authenticate().then(function() {
      return seq.dropSchema().then(function() {
        self.backend = new SequelizeBackend(seq, 'acl_');
        done();
      });
    }).catch(done);
  })

  run();

  it('properly runs up migration', function() {
    var seq = new sequelize('postgres://postgres@127.0.0.1:5432/travis_ci_test');
    var backend = new SequelizeBackend(seq);
    var migration = [];
    var queryInterfaceStub = {
      createTable: function(tableName, schema) {
        migration.push(tableName);
      }
    }

    var expected = ['meta', 'parents', 'permissions', 'resources', 'roles', 'users'];

    backend.migration.up(queryInterfaceStub, sequelize);

    assert.deepEqual(migration, expected);
  });
});

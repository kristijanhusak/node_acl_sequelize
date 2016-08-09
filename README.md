# ACL Sequelize

[![Build Status](https://travis-ci.org/kristijanhusak/node_acl_sequelize.svg)](https://travis-ci.org/kristijanhusak/node_acl_sequelize)
[![Coverage Status](https://coveralls.io/repos/github/kristijanhusak/node_acl_sequelize/badge.svg)](https://coveralls.io/github/kristijanhusak/node_acl_sequelize)

 [node_acl](https://github.com/OptimalBits/node_acl) implementation for [Sequelize](https://github.com/sequelize/sequelize)
Currently working **only with Postgres**.

## Installation

```
npm install sequelize
npm install pg
npm install acl
npm install acl-sequelize-backend
```


## Setup

```javascript
var NodeAcl = require('acl');
var Sequelize = require('Sequelize');
var SequelizeBackend = require('acl-sequelize-backend');
var db = new Sequelize('postgres://postgres:myawesomepw@127.0.0.1:5432/myawesomedb');

var aclOptions = {};
var tablePrefix = 'acl_';

var acl = new NodeAcl(new SequelizeBackend(db, tablePrefix, aclOptions));
```


## API

### new SequelizeBackend(db, prefix, options)

__Arguments__

```javascript
  db        {Function} Sequelize db instance.
  prefix    {String} Prefix for generated tables
  options   {Object} Options provided to the backend
```

**Options** can contain these fields:

**Note**: These are also the defaults if nothing is provided.

```javascript
var options = {
  meta: 'meta',               // Table name for meta bucket
  parents: 'parents',         // Table name for parents bucket
  permissions: 'permissions', // Table name for permissions bucket
  resources: 'resources',     // Table name for resources bucket
  roles: 'roles',             // Table name for roles bucket
  users: 'users',             // Table name for users bucket
  sync: true,                 // Should tables be automatically created using sequelize sync method
  debug: false                // Enable debug (shows sql on sync if enabled)
};
```

## Migrations

If you want to use migrations to generate tables instead of automatic sync, You can pull them from SequelizeBackend like this:

First, make sure you disable automatic sync when initializing acl:

```javascript
var acl = new NodeAcl(new SequelizeBackend(db, 'acl_', {
    sync: false
}));
```

Then generate migration file and add this to it:

```javascript
// migrations/add_acl.js

var SequelizeBackend = require('acl-sequelize-backend');

module.exports = {
  up: function (queryInterface, Sequelize) {
    var options = { prefix: 'acl_' };
    return SequelizeBackend.migration.up(queryInterface, Sequelize, options);
  },

  down: function (queryInterface, Sequelize) {
    var options = { prefix: 'acl_' };
    return SequelizeBackend.migration.down(queryInterface, Sequelize, options);
  }
};
```

Both `up` and `down` methods accept 3rd parameter `options` which can contain table names for each bucket

```javascript
var options = {
  prefix: '',                 // Prefix for table names
  meta: 'meta',               // Table name for meta bucket
  parents: 'parents',         // Table name for parents bucket
  permissions: 'permissions', // Table name for permissions bucket
  resources: 'resources',     // Table name for resources bucket
  roles: 'roles',             // Table name for roles bucket
  users: 'users'              // Table name for users bucket
};
```

**NOTE: Make sure that table names and prefix provided here match with table names and prefix provided to the backend.**

It is recommended to just use defaults in order to avoid any issues with naming.

## Tests

```
npm test
```




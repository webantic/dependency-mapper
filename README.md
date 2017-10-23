# Dependency Mapper

A module which finds and consolidates declarations of Meteor dependencies by npm modules.

This module is part of a suite:
 - [Dependency Mapper (this module)](https://github.com/webantic/dependency-mapper)
 - [Meteor Loader](https://github.com/webantic/meteor-loader)
 - [Meteor Deps](https://github.com/webantic/meteor-deps)

## Usage

```js

import mapper from '@webantic/dependency-mapper'

// if we're in the same folder as the package.json:
const result = mapper(process.cwd())

/*
  result === {
    ["this module name"]: {
      meteorDependencies: {
        // direct meteor deps of this module
        ["meteor package key"]: ["client" and/or "server"]
      },
      dependencies: {}, // same structure as "result"
      allMeteorDependencies: {
        // direct & indirect deps of this module
        ["meteor package key"]: ["client" and/or "server"]
      }
    }
  }
*/

const thisModuleName = Object.keys(result)[0]
console.log(result[thisModuleName].allMeteorDependencies)
// might print something like {"meteor/meteor": ["client", "server"], "kadira:flow-router": ["client"]}

```

## What does it look for?

The mapper will extract the value of `meteorDependencies` in any `package.json` found. They should have the following format:
```json
{
  "name": "mymodule",
  "version": "1.0.0",
  "dependencies": {
    "@webantic/meteor-deps": "^1.1.9"
  },
  "meteorDependencies": {
    "meteor/meteor": ["client", "server"],
    "kadira:flow-router": ["client"],
    "meteor/reactive-var": "client"
  }
}
```

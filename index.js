var path = require('path')

module.exports = function (absPath) {
  try {
    var json = require(path.join(absPath, 'package.json'))
    return processPackageJson(json, absPath)
  } catch (ex) {
    console.error(ex)
    return {}
  }
}

function forceArray(input) {
  return Array.isArray(input) ? input : [input]
}

function addToSetInPlace(set, item) {
  if (set.indexOf(item) === -1) {
    set.push(item)
    return true
  }

  return false
}

function processPackageJson (json, currentPrefix) {
  var meteorDeps = extractMeteorDeps(json)

  if ('dependencies' in json) {
    for (var moduleName in json.dependencies) {
      if (json.dependencies.hasOwnProperty(moduleName) && moduleName.indexOf('@webantic/') === 0) {
        var newPrefix = path.join(currentPrefix, 'node_modules', moduleName)
        meteorDeps = mergeDependencyMaps(meteorDeps, processPackageJson(getPackageJson(moduleName, currentPrefix), newPrefix))
      }
    }
  }

  return meteorDeps
}

function mergeDependencyMaps (map1, map2) {
  for (var key in map2) {
    if (map2.hasOwnProperty(key)) {
      if (key in map1) {
        map1[key] = forceArray(map1[key])
        forceArray(map2[key]).forEach((value) => addToSetInPlace(map1[key], value))
      } else {
        map1[key] = map2[key]
      }
    }
  }

  return map1
}

function getPackageJson (moduleName, currentPrefix) {
  var absPath = path.resolve(currentPrefix, 'node_modules', moduleName, 'package.json')
  try {
    return process.mainModule.require(absPath)
  } catch (ex) {
    return {}
  }
}

function extractMeteorDeps (json) {
  return ('meteorDependencies' in json)
    ? json.meteorDependencies
    : {}
}



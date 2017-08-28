var array = require('@webantic/util').array
var path = require('path')

module.exports = function processPackageJson (json, currentPrefix) {
  cPrefix = currentPrefix
  let meteorDeps = extractMeteorDeps(json)

  if ('dependencies' in json) {
    for (let moduleName in json.dependencies) {
      if (json.dependencies.hasOwnProperty(moduleName) && moduleName.indexOf('@webantic/') === 0) {
        const newPrefix = path.join(currentPrefix, 'node_modules', moduleName)
        meteorDeps = mergeDependencyMaps(meteorDeps, processPackageJson(getPackageJson(moduleName, currentPrefix), newPrefix))
      }
    }
  }

  return meteorDeps
}

function mergeDependencyMaps (map1, map2) {
  for (let key in map2) {
    if (map2.hasOwnProperty(key)) {
      if (key in map1) {
        map1[key] = array.forceArray(map1[key])
        array.forceArray(map2[key]).forEach((value) => array.addToSetInPlace(map1[key], value))
      } else {
        map1[key] = map2[key]
      }
    }
  }

  return map1
}

function getPackageJson (moduleName, currentPrefix) {
  const absPath = path.resolve(currentPrefix, 'node_modules', moduleName, 'package.json')
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



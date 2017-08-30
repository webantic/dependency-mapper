import * as path from 'path'
import * as debug from 'debug'

const log = debug('dependency-mapper:log:' + module.id)
const error = debug('dependency-mapper:error:' + module.id)

export default function mapper (absPath: string, skipTopLevel?: boolean) {
  let json
  try {
    const packageJsonPath = path.join(absPath, 'package.json')
    log('Requiring ' + packageJsonPath)
    json = Object.assign({}, require(packageJsonPath))
  } catch (ex) {
    error(ex)
    return {}
  }
  return processPackageJson(json, absPath, skipTopLevel)
}

/**
 * Work through a package.json, extracting meteor deps and mapping them to module names
 *
 * @param {any} json The package.json
 * @param {string} [currentPrefix] A path prefix
 * @param {boolean} [skipTopLevel] Whether to add Meteor deps for the top package or not
 * @returns
 */
function processPackageJson (json: any, currentPrefix?: string, skipTopLevel?: boolean) {
  const returnValue: {
    [key: string]: {
      allMeteorDependencies?: anySigObj
      dependencies?: anySigObj
      meteorDependencies?: anySigObj
    }
  } = {}

  // check for a standard prop's presence before proceeding
  if (json.name) {
    returnValue[json.name] = {
      allMeteorDependencies: skipTopLevel ? {} : extractMeteorDeps(json), // "indirect" dependencies
      dependencies: {},
      meteorDependencies: skipTopLevel ? {} : extractMeteorDeps(json) // "direct" dependencies
    }

    // Loop over each npm dependency and, if it starts with "@webantic/", process the package.json
    // This usually has the effect of returning an object with meteorDependencies, dependencies and
    // allMeteorDependencies (which we merge into our current "allMeteorDependencies" to get a complete
    // picture)
    if ('dependencies' in json) {
      for (const moduleName in json.dependencies) {
        if (json.dependencies.hasOwnProperty(moduleName) && moduleName.indexOf('@webantic/') === 0) {
          const newPrefix = path.join(currentPrefix, 'node_modules', moduleName)
          const childValue = processPackageJson(getPackageJson(moduleName, currentPrefix), newPrefix)

          if (moduleName in childValue) {
            returnValue[json.name].dependencies[moduleName] = childValue[moduleName]
            mergeDependencyMaps(
              returnValue[json.name].allMeteorDependencies,
              childValue[moduleName].allMeteorDependencies
            )
          }
        }
      }
    }
  } else {
    returnValue.default = {}
  }

  return returnValue
}

/**
 * Merge two objects together, where each property has a `locus` and `exports`
 *
 * @param {any} map1 The first object, items are merged into this
 * @param {any} map2 The second object, items are extracted from this
 * @returns {any} The combined maps
 */
function mergeDependencyMaps (map1: any, map2: any) {
  for (const key in map2) {
    if (map2.hasOwnProperty(key)) {
      if (key in map1) {
        // locus
        map1[key].locus = forceArray(map1[key].locus)
        forceArray(map2[key].locus).forEach((value) => addToSetInPlace(map1[key].locus, value))
        // exports
        map1[key].exports = forceArray(map1[key].exports)
        forceArray(map2[key].exports).forEach((value) => addToSetInPlace(map1[key].exports, value))
      } else {
        map1[key] = map2[key]
      }
    }
  }

  return map1
}

/**
 * Resolve and retrieve a package.json for a given npm module, relative to currentPrefix
 *
 * @param {string} moduleName The target package.json's module
 * @param {string} currentPrefix The current absPath
 * @returns {Object}
 */
function getPackageJson (moduleName: string, currentPrefix: string) {
  const absPath = path.resolve(currentPrefix, 'node_modules', moduleName, 'package.json')
  try {
    return Object.assign({}, require(absPath))
  } catch (ex) {
    error(ex)
    return {}
  }
}

/**
 * Extract the `meteorDependencies` property
 *
 * @param {Object} json The input object
 * @returns {Object} the extracted property, or an empty object
 */
function extractMeteorDeps (json: {meteorDependencies?: any}) {
  return ('meteorDependencies' in json)
    ? json.meteorDependencies
    : {}
}

/**
 * Ensure input is an array, wrapping it if necessary
 *
 * @param {any} input
 * @returns {any[]}
 */
function forceArray (input: any) {
  return Array.isArray(input) ? input : [input]
}

/**
 * Add an item to an array if it isn't already present
 *
 * @param {any[]} set The array to add the item to
 * @param {any} item The item to add to the array
 * @returns {boolean} whether the item needed to be (and was) added
 */
function addToSetInPlace (set: any[], item: any) {
  if (!(set instanceof Array)) {
    return false
  }

  if (set.indexOf(item) === -1) {
    set.push(item)
    return true
  }

  return false
}

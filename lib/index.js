"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug = require("debug");
var path = require("path");
var log = debug('dependency-mapper:log:' + module.id);
var error = debug('dependency-mapper:error:' + module.id);
/**
 * Take a path to a package.json and recursively extract meteor deps
 *
 * @export
 * @param {string} absPath the abs path to the package.json
 * @param {boolean} [skipTopLevel] If `true` then only dependencies of the package.json at absPath will be processed
 * @returns {IPackageProcesserReturn}
 */
function mapper(absPath, skipTopLevel) {
    var json;
    try {
        var packageJsonPath = path.join(absPath, 'package.json');
        log('Requiring ' + packageJsonPath);
        json = Object.assign({}, require(packageJsonPath));
    }
    catch (ex) {
        error(ex);
        return {};
    }
    return processPackageJson(json, absPath, skipTopLevel);
}
exports.default = mapper;
/**
 * Work through a package.json, extracting meteor deps and mapping them to module names
 *
 * @param {any} json The package.json
 * @param {string} [currentPrefix] A path prefix
 * @param {boolean} [skipTopLevel] Whether to add Meteor deps for the top package or not
 * @returns {IPackageProcesserReturn}
 */
function processPackageJson(json, currentPrefix, skipTopLevel) {
    var returnValue = {};
    // check for a standard prop's presence before proceeding
    if (json.name) {
        returnValue[json.name] = {
            allMeteorDependencies: skipTopLevel ? {} : extractMeteorDeps(json),
            dependencies: {},
            meteorDependencies: skipTopLevel ? {} : extractMeteorDeps(json) // "direct" dependencies
        };
        // Loop over each npm dependency and process the package.json.  This usually has the effect
        // of returning an object with meteorDependencies, dependencies and allMeteorDependencies
        // (which we merge into our current "allMeteorDependencies" to get a complete picture)
        if ('dependencies' in json) {
            for (var moduleName in json.dependencies) {
                if (json.dependencies.hasOwnProperty(moduleName)) {
                    var newPrefix = path.join(currentPrefix, 'node_modules', moduleName);
                    var childValue = processPackageJson(getPackageJson(moduleName, currentPrefix), newPrefix);
                    // if the child module had meteor deps...
                    if (moduleName in childValue) {
                        // ... track & merge
                        returnValue[json.name].dependencies[moduleName] = childValue[moduleName];
                        mergeDependencyMaps(returnValue[json.name].allMeteorDependencies, childValue[moduleName].allMeteorDependencies);
                    }
                }
            }
        }
    }
    else {
        returnValue.default = {};
    }
    return returnValue;
}
/**
 * Merge two objects together
 *
 * @param {any} map1 The first object, items are merged into this
 * @param {any} map2 The second object, items are extracted from this
 * @returns {any} The combined maps
 */
function mergeDependencyMaps(map1, map2) {
    var _loop_1 = function (key) {
        if (map2.hasOwnProperty(key)) {
            if (key in map1) {
                // first, convert values like 'client' to ['client']
                map1[key] = forceArray(map1[key]);
                // ensure map2[key] is an array, then iterate each value, adding missing ones to map1[key]
                forceArray(map2[key]).forEach(function (value) { return addToSetInPlace(map1[key], value); });
            }
            else {
                map1[key] = map2[key];
            }
        }
    };
    for (var key in map2) {
        _loop_1(key);
    }
    return map1;
}
/**
 * Resolve and retrieve a package.json for a given npm module, relative to currentPrefix
 *
 * @param {string} moduleName The target package.json's module
 * @param {string} currentPrefix The current absPath
 * @returns {Object}
 */
function getPackageJson(moduleName, currentPrefix) {
    var absPath = path.resolve(currentPrefix, 'node_modules', moduleName, 'package.json');
    try {
        return Object.assign({}, require(absPath));
    }
    catch (ex) {
        error(ex);
        return {};
    }
}
/**
 * Extract the `meteorDependencies` property
 *
 * @param {Object} json The input object
 * @returns {Object} the extracted property, or an empty object
 */
function extractMeteorDeps(json) {
    return ('meteorDependencies' in json)
        ? json.meteorDependencies
        : {};
}
/**
 * Ensure input is an array, wrapping it if necessary
 *
 * @param {any} input
 * @returns {any[]}
 */
function forceArray(input) {
    return Array.isArray(input) ? input : [input];
}
/**
 * Add an item to an array if it isn't already present
 *
 * @param {any[]} set The array to add the item to
 * @param {any} item The item to add to the array
 * @returns {boolean} whether the item needed to be (and was) added
 */
function addToSetInPlace(set, item) {
    if (!(set instanceof Array)) {
        return false;
    }
    if (set.indexOf(item) === -1) {
        set.push(item);
        return true;
    }
    return false;
}
//# sourceMappingURL=index.js.map
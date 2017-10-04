export interface IPackageProcesserReturn {
    [key: string]: {
        allMeteorDependencies?: IPackageJsonMeteorDeps;
        dependencies?: anySigObj;
        meteorDependencies?: IPackageJsonMeteorDeps;
    };
}
export interface IPackageJsonMeteorDeps {
    [packageName: string]: 'client' | 'server' | Array<'client' | 'server'>;
}
export interface IPackageJsonDependencies {
    [moduleName: string]: string;
}
/**
 * Take a path to a package.json and recursively extract meteor deps
 *
 * @export
 * @param {string} absPath the abs path to the package.json
 * @param {boolean} [skipTopLevel] If `true` then only dependencies of the package.json at absPath will be processed
 * @returns {IPackageProcesserReturn}
 */
export default function mapper(absPath: string, skipTopLevel?: boolean): IPackageProcesserReturn;

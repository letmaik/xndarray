# Development guide

## Getting started

First, install [Node.js](https://nodejs.org/download/).

Now, clone this repository and run the following in a shell in the checked out folder:
```
$ npm install
```

This installs all (development) dependencies in local subfolders.
It can be run at any time should the versions in the package.json change.

## Running tests

Simply run:
```
$ npm test
```

This tests the library with Chrome which will get started for that purpose.

Tests can be automatically re-run on file changes. For that, instead start the long-running test runner:
```
$ npm run karma
```
and minimize the browser windows that popped up. Test output will appear in the shell.

## Building a browser bundle

A stand-alone browser bundle that exposes the global `XNdArray` object can be created with:
```
$ npm run build
```
This will build the xndarray.{src|min}.js files in the root project folder.

Note that the ndarray dependency is included in the bundle.

## Publishing a new version

1. Raise the version number in package.json.
2. If it is a minor or major version change, update the version in README.md.
3. Create a semver git tag (`x.y.z`) and push it.
4. Run `npm publish`.
5. Attach the `xndarray.{src|min}.js` files to the GitHub release.

The last two steps build and publish the package to the npm registry.
This project is registered on http://www.jsdelivr.com such that on every new
npm release, the minified browser bundle is made available automatically on the jsDelivr CDN.

## Code style

The [JavaScript Standard Style](http://standardjs.com) is used in this project.
Conformance can be checked with:
```
$ npm run style
```


'use strict';

import * as path from 'path';
import * as Mocha from 'mocha';
const NYC = require('nyc');
import * as glob from 'glob';

import * as mocks from './mocks';

// Simulates the recommended config option
// extends: "@istanbuljs/nyc-config-typescript",
import * as baseConfig from "@istanbuljs/nyc-config-typescript";

// Recommended modules, loading them here to speed up NYC init
// and minimize risk of race condition
import 'ts-node/register';
import 'source-map-support/register';


// Linux: prevent a weird NPE when mocha on Linux requires the window size from the TTY
// Since we are not running in a tty environment, we just implementt he method statically
const tty = require('tty');
if (!tty.getWindowSize) {
    tty.getWindowSize = (): number[] => {
        return [80, 75];
    };
}

export async function run(): Promise<void> {
	const testsRoot = path.resolve(__dirname, '..');

  // Setup coverage pre-test, including post-test hook to report
  const nyc = new NYC({
    ...baseConfig,
    cwd: path.join(__dirname, '..', '..', '..'),
    reporter: ['text-summary', 'html'],
    all: true,
    silent: false,
    instrument: true,
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true,
    include: [ "out/**/*.js" ],
    exclude: [ "out/test/**" ],
  });
  await nyc.reset();   // Reinitializes .nyc_output folder
  await nyc.wrap();

  // Print a warning for any module that should be instrumented and is already loaded,
  // delete its cache entry and re-require
  // NOTE: This would not be a good solution for production code (possible memory leaks), but can be accepted for unit tests
  Object.keys(require.cache).filter(f => nyc.exclude.shouldInstrument(f)).forEach(m => {
    console.warn('Module loaded before NYC, invalidating:', m);
    delete require.cache[m];
    require(m);
  });

  // Debug which files will be included/excluded
  // console.log('Glob verification', await nyc.exclude.glob(nyc.cwd));

  // await nyc.createTempDirectory();
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
    timeout: 10 * 1000,
	});
  mocha.options.color = true;
  
  // Register all mocks
  mocks.setUp();

  // Add all files to the test suite
  const files = glob.sync('**/*.test.js', { cwd: testsRoot });
  files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

  const failures: number = await new Promise(resolve => mocha.run(resolve));
  await nyc.writeCoverageFile();

  // Capture text-summary reporter's output and log it in console
  console.log(await captureStdout(nyc.report.bind(nyc)));

  if (failures > 0) {
    throw new Error(`${failures} tests failed.`);
  }
}

async function captureStdout(fn) {
  let w = process.stdout.write, buffer = '';
  process.stdout.write = (s) => { buffer = buffer + s; return true; };
  await fn();
  process.stdout.write = w;
  return buffer;
}
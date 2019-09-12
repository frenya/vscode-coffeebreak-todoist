import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

import * as mocks from './mocks';

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
	});
	mocha.useColors(true);

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return e(err);
			}

      // Register all mocks
      mocks.setUp();

			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
          mocks.tearDown();
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
        mocks.tearDown();
				e(err);
			}
		});
	});
}

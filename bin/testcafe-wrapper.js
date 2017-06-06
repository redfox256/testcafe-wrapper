#!/usr/bin/env node

const pjson             = require(__dirname + '/../package.json');
const utils             = require('./utils');
const testrail          = require('./testrail');
const generator         = require('./generator');
const fs                = require('fs-extra');
const path              = require('path');
const createTestCafe    = require('testcafe');
const chalk             = require('chalk');
const program           = require('commander');
const stream            = require('stream');

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();
const __workdir = process.env.INIT_CWD + "/";

(async () => {
    program
        .version(pjson.version)
        .option('--verbose',            'Enable verbose logging')
        .option('-e, --skip-js-errors', 'Ignore javascript errors on the page')
        .option('--speed <n>',          'Specifies the speed of test execution - ranges from 0.1 (slowest) - 1 (fastest) - by default tests run at its fastest', parseFloat)
        .option('-p, --proxy',          'Enable proxy')
        .option('-x, --dont-generate',  'Will not generate test files but instead run any tests in the generated directory')
        .option('-y, --dont-run',       'Will generate test files but not run them')
        .option('-t, --testrail',       'Enable Testrail integration')
        .option('chrome',               'Test in Chrome')
        .option('firefox',              'Test in Firefox')
        .option('ie',                   'Test in Internet Explorer')
        .parse(process.argv);

    utils.log_custom(chalk.cyan('\n###########' +
                           '\n Arguments' +
                           '\n###########\n\n' + JSON.stringify(program.options, null, 4)));

    if (program.testrail) {
        const testrail_config = await testrail.readConfigFile();
        if (!testrail_config) {
            utils.log_error('ERROR: Cannot find testrail-conf.json');
            return;
        }
    }

    let unit_test_files = [];
	await generator.createDirectoryStructure();
	if (!program.dontGenerate) {
		unit_test_files = await generator.runGenerator();
	}

	if (!program.dontRun) {
        // const output_dir        = __workdir + 'tests/';
        // unit_test_files.push(output_dir + 'login_test.js');
        // unit_test_files.push(output_dir + 'basicDetail_test.js');
		run(unit_test_files);
	}

})();

class JSONStream extends stream.Writable {
     async _write(chunk, encoding, next) {
        const results = JSON.parse(chunk.toString());
        utils.log_gray(results);

        await testrail.processTestRailResults(results);

        next();
    }
}

function run(unit_test_files) {
    let testcafe = null;
    let browsers = [];
    createTestCafe('localhost', 1337, 1338)
        .then(tc => {
            testcafe     = tc;
            const runner = testcafe.createRunner();

            runner.src(unit_test_files);

            if (program.ie) browsers.push('ie');
            if (program.firefox) browsers.push('firefox');
            if (program.chrome || browsers.length == 0) browsers.push('chrome');

			utils.log_gray('\n####################################' +
				'\nRunning test files in: ' + browsers +
				'\n####################################\n\n' + unit_test_files);

            runner.browsers(browsers)

            if (program.testrail) {
                const stream = new JSONStream();
                runner.reporter('json', stream);
            }

            if (program.proxy) runner.useProxy('10.100.10.10:3128');

            return runner.run({
                skipJsErrors: program.skipJsErrors,
                speed: program.speed || 1
            });
        })
        .then(failedCount => {
            if (failedCount > 0) utils.log_error('[FAILED] Total Tests Failed: ' + failedCount);
            else utils.log_custom(chalk.green("[SUCCESS] All Tests Passed"));
            testcafe.close();
        })
        .catch(error => {
            utils.log_error(error)
            testcafe.close();
        });
}

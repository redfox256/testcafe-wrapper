#!/usr/bin/env node

const pjson             = require(__dirname + '/../package.json');
const _                 = require('lodash');
const yaml              = require('js-yaml');
const fs                = require('fs-extra');
const path              = require('path');
const createTestCafe    = require('testcafe');
const chalk             = require('chalk');
const program           = require('commander');
const beautify          = require('js-beautify').js_beautify;

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();
const __workdir = process.env.INIT_CWD + "/";

// output directories
const output_dir        = __workdir + 'tests/';
const page_objects_dir  = output_dir + 'page_objects/'
const data_dir  				= output_dir + 'data/'

// load templates
const page_object_template  = fs.readFileSync(__dirname + '/../templates/page_object.js', 'utf8');
const unit_test_template    = fs.readFileSync(__dirname + '/../templates/unit_test.js', 'utf8');
const data_template    			= fs.readFileSync(__dirname + '/../templates/data.js', 'utf8');

// allow mustache like templates
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

// load the unit test template
const compiled_unit_test_template 	= _.template(unit_test_template);
// load the page object template
const compiled_page_object_template = _.template(page_object_template);
// load the data template
const compiled_data_template 				= _.template(data_template);

// array to keep track of all the unit test filenames
let unit_test_files = [];

let filenames_list;
let file_content;
let po_temp;
let ut_temp;
let data_temp;

(async () => {
    program
        .version(pjson.version)
        .option('--verbose',            'Enable verbose logging')
        .option('-e, --skip-js-errors', 'Ignore javascript errors on the page')
        .option('--speed <n>',          'Specifies the speed of test execution - ranges from 0.1 (slowest) - 1 (fastest) - by default tests run at its fastest', parseFloat)
        .option('-p, --proxy',          'Enable proxy')
        .option('-x, --dont-generate',  'Will not generate test files but instead run any tests in the generated directory')
        .option('-y, --dont-run',       'Will generate test files but not run them')
        .option('chrome',               'Test in Chrome')
        .option('firefox',              'Test in Firefox')
        .option('ie',                   'Test in Internet Explorer')
        .parse(process.argv);


    if (program.verbose) console.log(chalk.cyan('\n###########' +
                                        '\n Arguments' +
                                        '\n###########\n\n' + JSON.stringify(program.options, null, 4)));


	// delete our directory structure should it exist - we will recreate it below
	// TODO check why this doesnt work
	// fs.emptyDir(output_dir, () => { log('done cleaning up ' + output_dir); });
	// fs.emptyDir(page_objects_dir, () => { log('done cleaning up ' + page_objects_dir); });

	await createDirectoryStructure();
	if (!program.dontGenerate) {
		await readYamlDirectory(__workdir + 'data/');
		// loop through all the yaml files
		for (fileIndex in filenames_list) {
			const file = filenames_list[fileIndex];
			if (file.substr(-5) === '.yaml') {
				const filename_no_ext = file.substr(0, file.length -5);

				await readYamlFile(__workdir + 'data/' + file);
				await processDataFile(filename_no_ext, file_content);
				await writeFile(data_dir + filename_no_ext + '.js', data_temp);
			}
		}

		await readYamlDirectory(__workdir);
		// loop through all the yaml files
		for (fileIndex in filenames_list) {
			const file = filenames_list[fileIndex];
			if (file.substr(-5) === '.yaml') {
				const filename_no_ext = file.substr(0, file.length -5);

				await readYamlFile(__workdir + file);
				await processFile(filename_no_ext, file_content);
				await writeFile(page_objects_dir + filename_no_ext + '.js', po_temp);
				const unit_test_filename = output_dir + filename_no_ext + '_test.js';
				await writeFile(unit_test_filename, ut_temp);

				// add the unit test files location to our array
				unit_test_files.push(unit_test_filename);
			}
		}
	}


	if (!program.dontRun) {
        // unit_test_files.push(output_dir + 'login_test.js');
        // unit_test_files.push(output_dir + 'basicDetail_test.js');
		run();
	}

})();

async function readYamlDirectory(directory) {
	return new Promise(function (resolve, reject) {
		fs.readdir(directory, function(err, filenames) {
			if (err) {
			  log_error(err);
			  reject(err);
			}

			log(filenames);
			filenames_list = filenames;
			resolve(filenames);
		});
	});
}

async function createDirectoryStructure() {
	fs.ensureDir(output_dir, () => { log('created directory ' + output_dir); });
	fs.ensureDir(page_objects_dir, () => { log('created directory ' + page_objects_dir); });
	fs.ensureDir(data_dir, () => { log('created directory ' + data_dir); });
}

async function readYamlFile(file) {
	return new Promise(function (resolve, reject) {
		file_content = null;
		fs.readFile(file, 'utf-8', function(err, content) {
			if (err) {
			  log_error(err);
			  reject(err);
			}
			file_content = content;
			resolve(file_content);
		});
  });
}

async function processFile(filename, content) {
    try {
        // load our data file
        let data = yaml.safeLoad(content);
        data.filename = filename;

        // pretty print our json to the console - can be disabled
        const indentedJson = JSON.stringify(data, null, 4);
        if (program.verbose) {
        console.log('\n#######################################################' +
                    '\n YAML parsed to JSON output for file ' + chalk.inverse(filename + '.yaml') +
                    '\n#######################################################\n\n' + chalk.yellow(indentedJson) + '\n');
        }

        // here we save the page object files
        po_temp = compiled_page_object_template(data);

        // here we save the unit test files
        ut_temp = compiled_unit_test_template(data);

    } catch (e) {
        log_error(e);
    }
}

async function processDataFile(filename, content) {
    try {
        // load our data file
        let data = yaml.safeLoad(content);
        data.filename = filename;

        // pretty print our json to the console - can be disabled
        const indentedJson = JSON.stringify(data, null, 4);
        if (program.verbose) {
        console.log('\n#######################################################' +
                    '\n YAML parsed to JSON output for file ' + chalk.inverse(filename + '.yaml') +
                    '\n#######################################################\n\n' + chalk.yellow(indentedJson) + '\n');
        }

        // here we save the page object files
        data_temp = compiled_data_template(data);

    } catch (e) {
        log_error(e);
    }
}

async function writeFile(dest, src) {
	return new Promise(function (resolve, reject) {
		fs.writeFile(dest, beautify(src, { preserve_newlines: false, break_chained_methods: true }), function(err) {
			if(err) {
				log_error('[error] ' + dest);
				reject(log_error(err));
			}

			resolve(log('[success] ' + dest));
		});
	});
}

function run() {
    let testcafe = null;
    let browsers = [];
    createTestCafe('localhost', 1337, 1338)
        .then(tc => {
            testcafe     = tc;
            const runner = testcafe.createRunner();

            runner
                .src(unit_test_files);

            if (program.ie) browsers.push('ie');
            if (program.firefox) browsers.push('firefox');
            if (program.chrome || browsers.length == 0) browsers.push('chrome');

			log('\n####################################' +
				'\nRunning test files in: ' + browsers +
				'\n####################################\n\n' + unit_test_files);

            runner.browsers(browsers)

            if (program.proxy) runner.useProxy('10.100.10.10:3128');

            return runner.run({
                skipJsErrors: program.skipJsErrors,
                speed: program.speed || 1
            });
        })
        .then(failedCount => {
            log_error('Tests failed: ' + failedCount);
            testcafe.close();
        })
        .catch(error => {
            log_error(error)
            testcafe.close();
        });

}

function log(msg) {
    if (program.verbose) {
        return console.log(chalk.green(msg));
    }
}

function log_file(content) {
    if (program.verbose) {
        return console.log(chalk.gray(content));
    }
}

function log_error(err) {
    return console.log(chalk.red.bold(err));
}

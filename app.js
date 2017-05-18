const _                 = require('lodash');
const yaml              = require('js-yaml');
const fs                = require('fs-extra');
const path              = require('path');
const createTestCafe    = require('testcafe');
const chalk             = require('chalk');
const program           = require('commander');
const beautify          = require('js-beautify').js_beautify;

// output directories
const output_dir        = __dirname + '/tests';
const page_objects_dir  = output_dir + '/page_objects'

// load templates
const page_object_template  = fs.readFileSync('templates/page_object.js', 'utf8');
const unit_test_template    = fs.readFileSync('templates/unit_test.js', 'utf8');

// allow mustache like templates
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

// load the unit test template
const compiled_unit_test_template = _.template(unit_test_template);

// load the page object template
const compiled_page_object_template = _.template(page_object_template);

// array to keep track of all the unit test filenames
let unit_test_files       = [];
let success_saved_files   = [];
let error_saved_files     = [];

// start the generator
init();

function processFile(filename, content) {
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
        const po_temp = compiled_page_object_template(data);
        writeFile(page_objects_dir + '/' + filename + '.js', po_temp);

        // here we save the unit test files
        const unit_test_output = output_dir + '/' + filename + '_test.js'
        const ut_temp = compiled_unit_test_template(data);
        writeFile(unit_test_output, ut_temp);

        // add the unit test files location to our array
        unit_test_files.push(unit_test_output);

    } catch (e) {
        log_error(e);
    }
}

function init() {
    program
        .version('0.0.1')
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

    fs.readdir(__dirname, function(err, filenames) {
        if (err) {
          return log_error(err);
        }

        if (!program.dontGenerate) {
            // create the directory structure
            fs.ensureDir(output_dir, () => { log('created directory ' + output_dir); });
            fs.ensureDir(page_objects_dir, () => { log('created directory ' + page_objects_dir); });

            // delete our directory structure should it exist - we will recreate it below
            // TODO check why this doesnt work
            // fs.emptyDir(output_dir, () => { log('done cleaning up ' + output_dir); });
            // fs.emptyDir(page_objects_dir, () => { log('done cleaning up ' + page_objects_dir); });

            // loop through all the yaml files
            filenames
                .filter(function(file) { return file.substr(-4) === '.yml'; })
                .forEach(function(filename) {
                      fs.readFile(__dirname + '/' + filename, 'utf-8', function(err, content) {
                        if (err) {
                          return log_error(err);
                        }
                        processFile(filename.substr(0, filename.length -4), content);
                      });
                });
        }

        if (!program.dontRun) {
            run();
        }
    });
}

function writeFile(dest, src) {
    fs.writeFile(dest, beautify(src, { max_preserve_newlines: 1 }), function(err) {
        if(err) {
            log_error('[error] ' + dest);
            return log_error(err);
        }

        log('[success] ' + dest);
    });
}

function run() {
    log('\n###################' +
        '\nRunning test files:' +
        '\n###################\n\n' + unit_test_files);
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

            log("Testing in the following browsers: " + browsers);

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

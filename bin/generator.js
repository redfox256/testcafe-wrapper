const utils             = require('./utils');
const _                 = require('lodash');
const yaml              = require('js-yaml');
const fs                = require('fs-extra');
const path              = require('path');
const chalk             = require('chalk');
const beautify          = require('js-beautify').js_beautify;

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();
const __workdir = process.env.INIT_CWD + "/";

// output directories
const output_dir        = __workdir + 'tests/';
const page_objects_dir  = output_dir + 'page_objects/'
const data_dir  		= output_dir + 'data/'

// load templates
const page_object_template  = fs.readFileSync(__dirname + '/../templates/page_object.js', 'utf8');
const unit_test_template    = fs.readFileSync(__dirname + '/../templates/unit_test.js', 'utf8');
const data_template    		= fs.readFileSync(__dirname + '/../templates/data.js', 'utf8');

// allow mustache like templates
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

// load the unit test template
const compiled_unit_test_template 	= _.template(unit_test_template);
// load the page object template
const compiled_page_object_template = _.template(page_object_template);
// load the data template
const compiled_data_template 		= _.template(data_template);

let po_temp;
let ut_temp;
let data_temp;

module.exports = {

    runGenerator: async function() {
        const dataFiles = await this.readYamlDirectory(__workdir + 'data/');
        // loop through all the data yaml files
        for (fileIndex in dataFiles) {
            const file = dataFiles[fileIndex];
            if (file.substr(-5) === '.yaml') {
                const filename_no_ext = file.substr(0, file.length -5);

                const file_content = await this.readYamlFile(__workdir + 'data/' + file);
                this.processDataFile(filename_no_ext, file_content);
                await this.writeFile(data_dir + filename_no_ext + '.js', data_temp);
            }
        }

        // array to keep track of all the unit test filenames
        let unit_test_files = [];

        const yamlFiles = await this.readYamlDirectory(__workdir);
        // loop through all the unit test yaml files
        for (fileIndex in yamlFiles) {
            const file = yamlFiles[fileIndex];
            if (file.substr(-5) === '.yaml') {
                const filename_no_ext = file.substr(0, file.length -5);

                const file_content = await this.readYamlFile(__workdir + file);
                this.processTestFile(filename_no_ext, file_content);
                await this.writeFile(page_objects_dir + filename_no_ext + '.js', po_temp);
                const unit_test_filename = output_dir + filename_no_ext + '_test.js';
                await this.writeFile(unit_test_filename, ut_temp);

                // add the unit test files location to our array
                unit_test_files.push(unit_test_filename);
            }
        }

        return unit_test_files;
    },

    createDirectoryStructure: async function() {
        return new Promise(function (resolve, reject) {
        	fs.ensureDir(page_objects_dir, () => { utils.log_green('created directory ' + page_objects_dir); });
            fs.ensureDir(output_dir, () => { utils.log_green('created directory ' + output_dir); });
        	fs.ensureDir(data_dir, () => { utils.log_green('created directory ' + data_dir); });
            resolve(true);
        })
        .catch((err) => {
            utils.log_error(err);
        });
    },

    readYamlDirectory: async function(directory) {
    	return new Promise(function (resolve, reject) {
    		fs.readdir(directory, function(err, filenames) {
    			if (err) {
    			  utils.log_error(err);
    			  reject(err);
    			}

    			utils.log_gray(filenames);
    			resolve(filenames);
    		});
    	})
        .catch((err) => {
            utils.log_error(err);
        });
    },

    readYamlFile: async function(file) {
    	return new Promise(function (resolve, reject) {
    		fs.readFile(file, 'utf-8', function(err, content) {
    			if (err) {
    			  utils.log_error(err);
    			  reject(err);
    			}
    			resolve(content);
    		});
        })
        .catch((err) => {
            utils.log_error(err);
        });
    },

    processFile: function(filename, content) {
        try {
            // load our data file
            let data = yaml.safeLoad(content);
            data.filename = filename;

            // pretty print our json to the console - can be disabled
            const indentedJson = JSON.stringify(data, null, 4);
            utils.log_custom('\n#######################################################' +
                        '\n YAML parsed to JSON output for file ' + chalk.inverse(filename + '.yaml') +
                        '\n#######################################################\n\n' + chalk.yellow(indentedJson) + '\n');

            return data;

        } catch (e) {
            utils.log_error(e);
        }
    },

    processTestFile: function(filename, content) {
        try {
            const data = this.processFile(filename, content);

            // here we save the page object files
            po_temp = compiled_page_object_template(data);

            // here we save the unit test files
            ut_temp = compiled_unit_test_template(data);

        } catch (e) {
            utils.log_error(e);
        }
    },

    processDataFile: function(filename, content) {
        try {
            const data = this.processFile(filename, content);

            // here we save the page object files
            data_temp = compiled_data_template(data);

        } catch (e) {
            utils.log_error(e);
        }
    },

    writeFile: async function(dest, src) {
    	return new Promise(function (resolve, reject) {
    		fs.writeFile(dest, beautify(src, { preserve_newlines: false, break_chained_methods: true }), function(err) {
    			if(err) {
    				utils.log_error('[error] ' + dest);
    				reject(false);
    			}

                utils.log_green('[success] ' + dest);
    			resolve(true);
    		});
    	})
        .catch((err) => {
            utils.log_error(err);
        });
    }


};

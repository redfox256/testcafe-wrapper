const utils     = require('./utils');
const request   = require('superagent');
const moment    = require('moment');
const fs        = require('fs-extra');
const chalk     = require('chalk');
const nconf     = require('nconf');

process.env.INIT_CWD = process.cwd();
const __workdir = process.env.INIT_CWD + "/";

const parent_section_name          = 'Automation Testing';
const parent_section_description   = 'Automate where possible';

async function sendRequest(method, url, data) {
    return new Promise(function (resolve, reject) {
        let req;
        let uri = nconf.get('host') + 'index.php?/api/v2/' + url;
        if (method === 'POST') {
            req = request
                    .post(uri)
                    .send(data);
        }
        else {
            req = request.get(uri);
        }

        req.set('content-type', 'application/json')
            .auth(nconf.get('username'), nconf.get('password'))
            .end(function(err, res) {
                if (err) {
                    utils.log_error(err);
                    reject(err);
                }
                resolve(res.body);
            });
    })
    .catch((err) => {
        utils.log_custom(chalk.red.bold(err));
    });
}

module.exports = {

    readConfigFile: async function() {
    	return new Promise(function (resolve, reject) {
            nconf.argv()
               .env()
               .file({ file: __workdir + 'conf/testrail-conf.json' });

           if (nconf.get('host')) return resolve(true);
           else return resolve(false);
        })
        .catch((err) => {
            utils.log_custom(err);
            return false;
        });
    },

    processTestRailResults: async function(results) {
        const test_run = await this.addTestRun(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
        const parent_section = await this.addSection(parent_section_name, parent_section_description);
        for (fixture_index in results.fixtures) {
            const fixture = results.fixtures[fixture_index];
            const fixture_section = await this.addSection(fixture.name, '', parent_section.id);
            for (test_index in fixture.tests) {
                const test = fixture.tests[test_index];
                const test_case = await this.addTestCase(fixture_section.id, test.name);
                let statusId = test.skipped ? 6 : test.errs.length == 0 ? 1 : 5;
                await this.addTestCaseResult(test_run.id, test_case.id, statusId, test.errs[0], test.durationMs);
            }
        }
    },

    getSections: async function() {
        const sections = await sendRequest('GET', 'get_sections/' + nconf.get('projectId'));
        return sections;
    },

    getAutomationSection: async function(section_name) {
        const sections = await this.getSections();
        if (sections) {
            for (index in sections) {
                const section = sections[index];
                if (section.name === section_name) {
                    return section;
                }
            }
        }

        return;
    },

    addSection: async function(section_name, section_description, parent_section_id) {
        const section = await this.getAutomationSection(section_name);
        if (section) {
            return section;
        }

        var data = {
            "name": section_name,
            "description": section_description,
            "parent_id": parent_section_id
        };

        return await sendRequest('POST', 'add_section/' + nconf.get('projectId'), data);
    },

    getTestCaseForSection: async function(section_id, case_title) {
        const test_cases = await sendRequest('GET', 'get_cases/' + nconf.get('projectId') + '&section_id=' + section_id);
        if (test_cases) {
            for (index in test_cases) {
                const test_case = test_cases[index];
                if (test_case.title === case_title) {
                    return test_case;
                }
            }
        }

        return;
    },

    addTestCase: async function(sectionId, title) {
        const test_case = await this.getTestCaseForSection(sectionId, title);
        if (test_case) {
            return test_case;
        }

        var data = {
            "title": title,
            "type_id": 3, // automated
            "priority_id": 2 // medium
        };

        return await sendRequest('POST', 'add_case/' + sectionId, data);
    },

    addTestCaseResult: async function(runId, caseId, statusId, comment, duration) {
        const minutes = moment.duration(duration).get('minutes');
        const seconds = moment.duration(duration).get('seconds');
        let elapsed = minutes > 0 ? (minutes + 'm ') : '';
        elapsed = seconds > 0 ? (elapsed + seconds + 's') : '';

        var data = {
            "status_id": statusId,
            "comment": comment,
            "elapsed": elapsed
        };

        return await sendRequest('POST', 'add_result_for_case/' + runId + "/" + caseId, data);
    },

    addTestRun: async function(run_name) {
        var data = {
            "name": run_name
        };

        return await sendRequest('POST', 'add_run/' + nconf.get('projectId'), data);
    }

};

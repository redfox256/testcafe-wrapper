const chalk             = require('chalk');
const program           = require('commander');

module.exports = {

    log_green: function(msg) {
        if (program.verbose) {
            return console.log(chalk.green(msg));
        }
    },

    log_gray: function(msg) {
        if (program.verbose) {
            return console.log(chalk.gray(msg));
        }
    },

    log_error: function(msg) {
        return console.log(chalk.red.bold(msg));
    },

    log_custom: function(msg) {
        if (program.verbose) {
            return console.log(msg);
        }
    }

};

var Formatters = require('../../').formatters;
var _ = require('underscore');

function testName (input) {
    if (_.isArray(input)) {
        return testName(input[0]) + ' with args: ' + input.slice(1);
    } else {
        return typeof input + ' ' + input;
    }
}

describe('Formatters', function () {

    describe('boolean', function () {

        describe('formats to false', function () {
            var inputs = [
                false,
                'false',
                ''
            ];

            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Formatters.boolean(i).should.not.be.ok;
                });
            });
        });

        describe('formats to true', function () {
            var inputs = [
                true,
                'true'
            ];

            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Formatters.boolean(i).should.be.ok;
                });
            });
        });

    });

});

var Validators = require('../../').validators;

var PostcodeData = require('../helpers/postcodes');

var isCoverageTest = require.cache[require.resolve('istanbul')];
var describeUnlessCoverage = isCoverageTest ? describe.skip : describe;

describe('Postcode validation', function () {

    it('correctly validates empty string', function () {
        Validators.postcode('').should.be.ok;
    });

    it('correctly rejects invalid postcodes', function () {
        Validators.postcode('A11AA A11AA').should.not.be.ok;
        Validators.postcode('N443 6DFG').should.not.be.ok;
        Validators.postcode('ABCD1234').should.not.be.ok;
    });

    describeUnlessCoverage('Full postcode test - loads full UK postcode database, may take some time', function () {

        var testData;

        var test = function (pc) {
            try {
                Validators.postcode(pc).should.be.ok;
            } catch (e) {
                // echo out the failing postcode
                global.console.error('Failed postcode:', pc);
                throw e;
            }
        };

        before(function (done) {
            PostcodeData.load(function (err, data) {
                testData = data;
                done(err);
            });
        });

        it('correctly validates uk postcodes with a single space', function () {
            testData.forEach(function (testPostcode) {
                var pc = testPostcode.replace(/ \s+/, ' ');
                test(pc);
            });
        });

        it('correctly validates uk postcodes with no spaces', function () {
            testData.forEach(function (testPostcode) {
                var pc = testPostcode.replace(/\s+/g, '');
                test(pc);
            });
        });
    });

});

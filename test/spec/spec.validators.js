var Validators = require('../../').validators;
var validationHelper = require('../../lib/validation');
var _ = require('underscore');

function testName(input) {
    if (_.isArray(input)) {
        return testName(input[0]) + ' with args: ' + input.slice(1);
    } else {
        return typeof input + ' ' + input;
    }
}

describe('Validators', function () {

    var clock;

    before(function () {
        var now = new Date('2014-11-05T15:09:00Z'); //time of writing
        clock = sinon.useFakeTimers(now.getTime());
    });
    after(function () {
        clock.restore();
    });

    describe('required', function () {

        describe('invalid values', function () {
            var inputs = [
                undefined,
                ''
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.required(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                true,
                false,
                1,
                0,
                'a'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.required(i).should.be.ok;
                });
            });
        });

    });

    describe('url', function () {

        describe('invalid values', function () {
            var inputs = [
                true,
                false,
                undefined,
                null,
                12345,
                'something',
                'www.something.com123'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.url(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '',
                'www.something.com',
                'http://www.something.com',
                'test.co.uk/somepage.html',
                'www.example.com/contact.php?name=someName'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.url(i).should.be.ok;
                });
            });
        });

    });

    describe('email', function () {

        describe('invalid values', function () {
            var inputs = [
                10,
                null,
                'asdf.com',
                'asdf.',
                'asdf@com.',
                'asdf@.com.',
                '@.com',
                '@com.',
                'test.com@',
                'test@test@test.com'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.email(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '',
                't@i.co',
                'test@example.com',
                'test+suffix@gmail.com',
                'test+suffix@digital.cabinet-office.gov.uk',
                'test.suffix@digital.cabinet-office.gov.uk'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.email(i).should.be.ok;
                });
            });
        });

    });

    describe('minlength', function () {

        describe('invalid values', function () {
            var inputs = [
                [undefined, 1],
                [100, 1],
                ['asdf', 10],
                ['asdf', 5]
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.minlength.apply(null, i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                ['', 9],
                ['asdfasdfasdf', 10],
                ['t']
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.minlength.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('maxlength', function () {

        describe('invalid values', function () {
            var inputs = [
                [undefined, 1],
                [100, 10],
                ['asdfasdfasdf', 10],
                ['asdf', 3],
                ['t']
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.maxlength.apply(null, i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                ['', 9],
                ['asdfasdf', 10],
                ['123', 4]
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.maxlength.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('exactlength', function () {

        describe('invalid values', function () {
            var inputs = [
                [undefined, 9],
                ['123', 2],
                ['123', 4]
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.exactlength.apply(null, i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                ['', 9],
                ['123', 3]
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.exactlength.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('equal', function () {

        describe('invalid values', function () {
            var inputs = [
                ['1', 1],
                [true, 'true'],
                [0, '0'],
                ['a', 'b', 'c', 'd'],
                ['a'],
                [['a', 'b', 'c'], 'a', 'b']
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.equal.apply(null, i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                ['', 'Adam Smith'],
                ['John Smith', 'John Smith'],
                [10, 10],
                [true, true],
                ['a', 'b', 'c', 'a'],
                [['a', 'b'], 'a', 'b']
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.equal.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('phonenumber', function () {

        describe('invalid values', function () {
            var inputs = [
                123,
                'abc',
                'abc123',
                '123+456',
                '(0)+123456',
                '0123456789123456'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.phonenumber(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '',
                '123',
                '123456',
                '1234567890',
                '+1234567890',
                '(+12)34567890',
                '123-456-789',
                '012345678912345'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.phonenumber(i).should.be.ok;
                });
            });
        });

    });

    describe('ukmobilephone', function () {

        describe('invalid values', function () {
            var inputs = [
                '+447812123456',
                '+4407812123456',
                '+44(0)7812123456',
                '447812123456',
                '0781212345',
                '078121234567',
                '07812 123 456',
                '07812-123-456',
                '07812/123/456',
                '(07812)123456',
                'mymobile',
                '078121223456',
                78121223456
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.ukmobilephone(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '',
                '07812123456'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.ukmobilephone(i).should.be.ok;
                });
            });
        });

    });

    describe('date', function () {

        describe('invalid values', function () {
            var inputs = [
                'abc',
                '1981-02-29',
                '1981-13-29',
                '1981-00-00',
                '1980/01/01',
                '2000-02-'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.date(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '',
                '1980-02-29'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.date(i).should.be.ok;
                });
            });
        });

    });

    describe('date-year', function () {

        describe('invalid values', function () {
            var inputs = [
                '',
                '01',
                'abc',
                'ABC123',
                '2oo5',
                '-2015',
                2015,
                -2015
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators['date-year'](i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '0000',
                '0001',
                '2015',
                '9999'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators['date-year'](i).should.be.ok;
                });
            });
        });

    });

    describe('date-month', function () {

        describe('invalid values', function () {
            var inputs = [
                '',
                '0',
                '13',
                'Jan',
                '1',
                '-1',
                1,
                -12
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators['date-month'](i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '01',
                '12'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators['date-month'](i).should.be.ok;
                });
            });
        });

    });

    describe('date-day', function () {

        describe('invalid values', function () {
            var inputs = [
                '0',
                '32',
                '001',
                '-1',
                1,
                -10
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators['date-day'](i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '01',
                '28',
                '29',
                '30',
                '31'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators['date-day'](i).should.be.ok;
                });
            });
        });

    });

    describe('before', function () {

        // note date is set to 2014-11-05T15:09:00Z in all tests

        describe('invalid values', function () {
            var inputs = [
                '2014-11-06',
                '2014-11-06',
                ['2014-11-05', 1, 'day'],
                ['1993-11-06', 21, 'years'],
                ['2013-09-01', 1, 'year', 3, 'months'],
                ['2016-03-01', -1, 'year', -3, 'months']
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    if (typeof i === 'string') {
                        Validators.before(i).should.not.be.ok;
                    } else {
                        Validators.before.apply(null, i).should.not.be.ok;
                    }
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '',
                '1980-02-29',
                '2014-11-05',
                ['2014-11-04', 1, 'day'],
                ['1993-11-05', 21, 'years'],
                ['2013-07-01', 1, 'year', 3, 'months'],
                ['2016-01-01', -1, 'year', -3, 'months']
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    if (typeof i === 'string') {
                        Validators.before(i).should.be.ok;
                    } else {
                        Validators.before.apply(null, i).should.be.ok;
                    }
                });
            });
        });

    });

    describe('after', function () {

        // note date is set to 2014-11-05T15:09:00Z in all tests

        describe('invalid values', function () {
            var inputs = [
                '2014-11-05',
                ['2014-12-16', '2014-12-16'],
                ['2013-12-15', '2013-12-16'],
                ['2014-11-04', 1, 'day'],
                ['1993-11-05', 21, 'years'],
                ['2013-07-01', 1, 'year', 3, 'months'],
                ['2016-01-01', -1, 'year', -3, 'months']
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    if (typeof i === 'string') {
                        Validators.after(i).should.not.be.ok;
                    } else {
                        Validators.after.apply(null, i).should.not.be.ok;
                    }
                });
            });
        });

        describe('valid inputs', function () {
            var inputs = [
                ['', '2014-12-15'],
                ['2014-12-16', '2014-12-15'],
                ['2014-11-05', 1, 'day'],
                ['1993-11-06', 21, 'years'],
                ['2013-09-01', 1, 'year', 3, 'months'],
                ['2016-03-01', -1, 'year', -3, 'months']
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.after.apply(null, i).should.be.ok;
                });
            });
        });

    });

    describe('alphanum', function () {

        describe('invalid values', function () {
            var inputs = [
                null,
                undefined,
                9,
                '-.'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.alphanum(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '',
                'abc123',
                'ABC123'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.alphanum(i).should.be.ok;
                });
            });
        });

    });

    describe('numeric', function () {

        describe('invalid values', function () {
            var inputs = [
                null,
                undefined,
                true,
                0,
                'a'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.numeric(i).should.not.be.ok;
                });
            });
        });

        describe('valid values', function () {
            var inputs = [
                '',
                '1'
            ];
            _.each(inputs, function (i) {
                it(testName(i), function () {
                    Validators.numeric(i).should.be.ok;
                });
            });
        });

    });

    describe('custom validators', function () {
        var fields, validator;

        beforeEach(function () {
            fields = {
                'field-1': {
                    validate: [function doSomething() {
                        return true;
                    }]
                },
                'field-2': {
                    validate: [function () {
                        return true;
                    }]
                },
                'field-3': {
                    validate: [function fail() {
                        return false;
                    }]
                },
                'field-4': {
                    validate: [function checkVal(val) {
                        return val === true;
                    }]
                }
            };
            validator = validationHelper(fields);
        });

        it('accepts custom validators', function () {
            expect(validator('field-1', null)).to.be.undefined;
        });

        it('throws an error if an anonymous function is passed', function () {
            try {
                validator('field-2');
            } catch (err) {
                err.should.be.an('error')
                    .and.have.property('message')
                    .and.be.equal('Custom validator needs to be a named function');
            }
        });

        it('uses the name of the function as the error type', function () {
            validator('field-3').should.have.property('type')
                .and.be.equal('fail');
        });

        it('validates using the passed values', function () {
            expect(validator('field-4', true)).to.be.undefined;
        });
    });

});

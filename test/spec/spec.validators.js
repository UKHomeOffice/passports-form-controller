'use strict';

const Validators = require('../../').validators;
const validationHelper = require('../../lib/validation');

function testName(input) {
  if (Array.isArray(input)) {
    return testName(input[0]) + ' with args: ' + input.slice(1);
  }
  return typeof input + ' ' + input;
}

describe('Validators', () => {
  let clock;

  before(() => {
    // time of writing
    const now = new Date('2014-11-05T15:09:00Z');
    clock = sinon.useFakeTimers(now.getTime());
  });

  after(() => {
    clock.restore();
  });

  describe('required', () => {

    describe('invalid values', () => {
      const inputs = [
        undefined,
        ''
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.required(i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        true,
        false,
        1,
        0,
        'a'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.required(i).should.be.ok;
        });
      });
    });

  });

  describe('url', () => {

    describe('invalid values', () => {
      const inputs = [
        true,
        false,
        undefined,
        null,
        12345,
        'something',
        'www.something.com123'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.url(i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '',
        'www.something.com',
        'http://www.something.com',
        'test.co.uk/somepage.html',
        'www.example.com/contact.php?name=someName'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.url(i).should.be.ok;
        });
      });
    });

  });

  describe('email', () => {

    describe('invalid values', () => {
      const inputs = [
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
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.email(i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '',
        't@i.co',
        'test@example.com',
        'test+suffix@gmail.com',
        'test+suffix@digital.cabinet-office.gov.uk',
        'test.suffix@digital.cabinet-office.gov.uk'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.email(i).should.be.ok;
        });
      });
    });

  });

  describe('minlength', () => {

    describe('invalid values', () => {
      const inputs = [
        [undefined, 1],
        [100, 1],
        ['asdf', 10],
        ['asdf', 5]
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.minlength.apply(null, i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        ['', 9],
        ['asdfasdfasdf', 10],
        ['t']
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.minlength.apply(null, i).should.be.ok;
        });
      });
    });

  });

  describe('maxlength', () => {

    describe('invalid values', () => {
      const inputs = [
        [undefined, 1],
        [100, 10],
        ['asdfasdfasdf', 10],
        ['asdf', 3],
        ['t']
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.maxlength.apply(null, i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        ['', 9],
        ['asdfasdf', 10],
        ['123', 4]
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.maxlength.apply(null, i).should.be.ok;
        });
      });
    });

  });

  describe('exactlength', () => {

    describe('invalid values', () => {
      const inputs = [
        [undefined, 9],
        ['123', 2],
        ['123', 4]
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.exactlength.apply(null, i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        ['', 9],
        ['123', 3]
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.exactlength.apply(null, i).should.be.ok;
        });
      });
    });

  });

  describe('equal', () => {

    describe('invalid values', () => {
      const inputs = [
        ['1', 1],
        [true, 'true'],
        [0, '0'],
        ['a', 'b', 'c', 'd'],
        ['a'],
        [['a', 'b', 'c'], 'a', 'b']
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.equal.apply(null, i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        ['', 'Adam Smith'],
        ['John Smith', 'John Smith'],
        [10, 10],
        [true, true],
        ['a', 'b', 'c', 'a'],
        [['a', 'b'], 'a', 'b']
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.equal.apply(null, i).should.be.ok;
        });
      });
    });

  });

  describe('phonenumber', () => {

    describe('invalid values', () => {
      const inputs = [
        123,
        'abc',
        'abc123',
        '123+456',
        '(0)+123456',
        '0123456789123456'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.phonenumber(i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '',
        '123',
        '123456',
        '1234567890',
        '+1234567890',
        '(+12)34567890',
        '123-456-789',
        '012345678912345'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.phonenumber(i).should.be.ok;
        });
      });
    });

  });

  describe('ukmobilephone', () => {

    describe('invalid values', () => {
      const inputs = [
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
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.ukmobilephone(i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '',
        '07812123456'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.ukmobilephone(i).should.be.ok;
        });
      });
    });

  });

  describe('date', () => {

    describe('invalid values', () => {
      const inputs = [
        'abc',
        '1981-02-29',
        '1981-13-29',
        '1981-00-00',
        '1980/01/01',
        '2000-02-'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.date(i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '',
        '1980-02-29'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.date(i).should.be.ok;
        });
      });
    });

  });

  describe('date-year', () => {

    describe('invalid values', () => {
      const inputs = [
        '',
        '01',
        'abc',
        'ABC123',
        '2oo5',
        '-2015',
        2015,
        -2015
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators['date-year'](i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '0000',
        '0001',
        '2015',
        '9999'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators['date-year'](i).should.be.ok;
        });
      });
    });

  });

  describe('date-month', () => {

    describe('invalid values', () => {
      const inputs = [
        '',
        '0',
        '13',
        'Jan',
        '1',
        '-1',
        1,
        -12
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators['date-month'](i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '01',
        '12'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators['date-month'](i).should.be.ok;
        });
      });
    });

  });

  describe('date-day', () => {
    describe('invalid values', () => {
      const inputs = [
        '0',
        '32',
        '001',
        '-1',
        1,
        -10
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators['date-day'](i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '01',
        '28',
        '29',
        '30',
        '31'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators['date-day'](i).should.be.ok;
        });
      });
    });

  });

  describe('before', () => {

    // note date is set to 2014-11-05T15:09:00Z in all tests

    describe('invalid values', () => {
      const inputs = [
        '2014-11-06',
        ['2017-11-05', '2016-01-01'],
        ['2014-11-05', 1, 'day'],
        ['1993-11-06', 21, 'years'],
        ['2013-09-01', 1, 'year', 3, 'months'],
        ['2016-03-01', -1, 'year', -3, 'months']
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          if (typeof i === 'string') {
            Validators.before(i).should.not.be.ok;
          } else {
            Validators.before.apply(null, i).should.not.be.ok;
          }
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '',
        '1980-02-29',
        ['2014-11-05', '2017-01-01'],
        ['2014-11-04', 1, 'day'],
        ['1993-11-05', 21, 'years'],
        ['2013-07-01', 1, 'year', 3, 'months'],
        ['2016-01-01', -1, 'year', -3, 'months']
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          if (typeof i === 'string') {
            Validators.before(i).should.be.ok;
          } else {
            Validators.before.apply(null, i).should.be.ok;
          }
        });
      });
    });

  });

  describe('after', () => {

    // note date is set to 2014-11-05T15:09:00Z in all tests

    describe('invalid values', () => {
      const inputs = [
        '2014-11-05',
        ['2014-12-16', '2014-12-16'],
        ['2013-12-15', '2013-12-16'],
        ['2014-11-04', 1, 'day'],
        ['1993-11-05', 21, 'years'],
        ['2013-07-01', 1, 'year', 3, 'months'],
        ['2016-01-01', -1, 'year', -3, 'months']
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          if (typeof i === 'string') {
            Validators.after(i).should.not.be.ok;
          } else {
            Validators.after.apply(null, i).should.not.be.ok;
          }
        });
      });
    });

    describe('valid inputs', () => {
      const inputs = [
        ['', '2014-12-15'],
        ['2014-12-16', '2014-12-15'],
        ['2014-11-05', 1, 'day'],
        ['1993-11-06', 21, 'years'],
        ['2013-09-01', 1, 'year', 3, 'months'],
        ['2016-03-01', -1, 'year', -3, 'months']
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.after.apply(null, i).should.be.ok;
        });
      });
    });

  });

  describe('alphanum', () => {

    describe('invalid values', () => {
      const inputs = [
        null,
        undefined,
        9,
        '-.'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.alphanum(i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '',
        'abc123',
        'ABC123'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.alphanum(i).should.be.ok;
        });
      });
    });

  });

  describe('numeric', () => {

    describe('invalid values', () => {
      const inputs = [
        null,
        undefined,
        true,
        0,
        'a'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.numeric(i).should.not.be.ok;
        });
      });
    });

    describe('valid values', () => {
      const inputs = [
        '',
        '1'
      ];
      inputs.forEach(i => {
        it(testName(i), () => {
          Validators.numeric(i).should.be.ok;
        });
      });
    });

  });

  describe('custom validators', () => {
    let fields;
    let validator;

    beforeEach(() => {
      fields = {
        'field-1': {
          validate: [function doSomething() {
            return true;
          }]
        },
        'field-2': {
          validate: [function() {
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

    it('accepts custom validators', () => {
      expect(validator('field-1', null)).to.be.undefined;
    });

    it('throws an error if an anonymous function is passed', () => {
      try {
        validator('field-2');
      } catch (err) {
        err.should.be.an('error')
        .and.have.property('message')
        .and.be.equal('Custom validator needs to be a named function');
      }
    });

    it('uses the name of the function as the error type', () => {
      validator('field-3').should.have.property('type')
      .and.be.equal('fail');
    });

    it('validates using the passed values', () => {
      expect(validator('field-4', true)).to.be.undefined;
    });
  });

});

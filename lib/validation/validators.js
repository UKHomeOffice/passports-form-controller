'use strict';

const moment = require('moment');
const _ = require('lodash');

// validator methods should return false (or falsy value) for *invalid* input
// and true (or truthy value) for *valid* input.
const dateFormat = 'YYYY-MM-DD';
let Validators;

module.exports = Validators = {

  string(value) {
    return typeof value === 'string';
  },

  regex(value, match) {
    return Validators.string(value) && !!value.match(match);
  },

  required(value) {
    return value !== undefined && value !== '';
  },

  url(value) {
    return value === '' ||
      Validators.regex(value, /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
  },

  email(value) {
    return value === '' || Validators.regex(value, /^[a-z0-9\._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,6}$/i);
  },

  minlength(value, length) {
    length = length || 0;
    return Validators.string(value) && (value === '' || value.length >= length);
  },

  maxlength(value, length) {
    return Validators.string(value) && (value === '' || value.length <= length);
  },

  exactlength(value, length) {
    return Validators.string(value) && (value === '' || value.length === length);
  },

  alphanum(value) {
    return Validators.regex(value, /^[a-zA-Z0-9]*$/);
  },

  numeric(value) {
    return Validators.regex(value, /^\d*$/);
  },

  equal(value) {
    const values = [].slice.call(arguments, 1);
    value = _.castArray(value);
    return values.length && _.every(value, item =>
      item === '' || values.indexOf(item) > -1
    );
  },

  phonenumber(value) {
    return value === '' || Validators.regex(value, /^\(?\+?[\d()-]{0,15}$/);
  },

  ukmobilephone(value) {
    return value === '' || Validators.regex(value, /^(07)\d{9}$/);
  },

  date(value) {
    return value === '' || Validators.regex(value, /\d{4}\-\d{2}\-\d{2}/) && moment(value, dateFormat).isValid();
  },

  'date-year'(value) {
    return Validators.regex(value, /^\d{4}$/);
  },

  'date-month'(value) {
    return Validators.regex(value, /^\d{2}$/) && parseInt(value, 10) > 0 && parseInt(value, 10) < 13;
  },

  'date-day'(value) {
    return Validators.regex(value, /^\d{2}$/) && parseInt(value, 10) > 0 && parseInt(value, 10) < 32;
  },

  // eslint-disable-next-line no-inline-comments, spaced-comment
  before(value, date/*, [diff, unit][, diff, unit]*/) {
    let valueDate = moment(value, dateFormat);
    let comparator;
    if (arguments.length === 2) {
      comparator = date;
    } else {
      comparator = moment();
      const args = [].slice.call(arguments, 1);
      let diff;
      let unit;
      while (args.length) {
        diff = args.shift();
        unit = args.shift() || 'years';
        valueDate = valueDate.add(diff, unit);
      }
    }
    return value === '' || Validators.date(value) && valueDate.isBefore(comparator);
  },

  after(value, date) {
    let valueDate = moment(value, dateFormat);
    let comparator;
    if (arguments.length === 2) {
      comparator = date;
    } else {
      comparator = moment();
      const args = [].slice.call(arguments, 1);
      let diff;
      let unit;
      while (args.length) {
        diff = args.shift();
        unit = args.shift() || 'years';
        valueDate = valueDate.add(diff, unit);
      }
    }
    return value === '' || Validators.date(value) && valueDate.isAfter(comparator);
  },

  postcode(value) {
    // eslint-disable-next-line max-len
    return value === '' || Validators.regex(value, /^(([GIR] ?0[A]{2})|((([A-Z][0-9]{1,2})|(([A-Z][A-HJ-Y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-HJ-Y][0-9]?[A-Z])))) ?[0-9][A-Z]{2}))$/i);
  }
};

var moment = require('moment');

// validator methods should return false (or falsy value) for *invalid* input
// and true (or truthy value) for *valid* input.
var Validators,
    dateFormat = 'YYYY-MM-DD';

module.exports = Validators = {

    string: function string(value) {
        return typeof value === 'string';
    },

    regex: function regex(value, match) {
        return Validators.string(value) && !!value.match(match);
    },

    required: function required(value) {
        return value !== undefined && value !== '';
    },

    email: function email(value) {
        return value === '' || Validators.regex(value, /^[a-z0-9\._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,6}$/i);
    },

    minlength: function minlength(value, length) {
        length = length || 0;
        return Validators.string(value) && (value === '' || value.length >= length);
    },

    maxlength: function maxlength(value, length) {
        return Validators.string(value) && (value === '' || value.length <= length);
    },

    exactlength: function exactlength(value, length) {
        return Validators.string(value) && (value === '' || value.length === length);
    },

    alphanum: function alphanum(value) {
        return Validators.regex(value, /^[a-zA-Z0-9]*$/);
    },

    numeric: function numeric(value) {
        return Validators.regex(value, /^\d*$/);
    },

    equal: function equal(value) {
        var values = [].slice.call(arguments, 1);
        return values.length && (value === '' || values.indexOf(value) > -1);
    },

    phonenumber: function phonenumber(value) {
        return value === '' || Validators.regex(value, /^\(?\+?[\d()-]{0,15}$/);
    },

    ukmobilephone: function ukmobilephone(value) {
        return value === '' || Validators.regex(value, /^(07)\d{9}$/);
    },

    date: function date(value) {
        return value === '' || Validators.regex(value, /\d{4}\-\d{2}\-\d{2}/) && moment(value, dateFormat).isValid();
    },

    before: function before(value/*, [diff, unit][, diff, unit]*/) {
        var args = [].slice.call(arguments, 1);
        var date = moment(value, dateFormat);
        var diff, unit;
        while (args.length) {
            diff = args.shift();
            unit = args.shift() || 'years';
            date = date.add(diff, unit);
        }
        return value === '' || Validators.date(value) && date.isBefore(moment());
    },

    after: function after(value, date) {
        var test = moment(value, dateFormat);
        var comparator;
        if (arguments.length === 2) {
            comparator = date;
        } else {
            comparator = moment();
            var args = [].slice.call(arguments, 1);
            var diff, unit;
            while (args.length) {
                diff = args.shift();
                unit = args.shift() || 'years';
                test = test.add(diff, unit);
            }
        }
        return value === '' || Validators.date(value) && test.isAfter(comparator);
    },

    postcode: function postcode(value) {
        return value === '' || Validators.regex(value, /^(([GIR] ?0[A]{2})|((([A-Z][0-9]{1,2})|(([A-Z][A-HJ-Y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-HJ-Y][0-9]?[A-Z])))) ?[0-9][A-Z]{2}))$/i);
    }

};

var _ = require('underscore');

var formatters = require('./formatters');

function format(f, value) {
    if (typeof f === 'string' && formatters[f]) {
        return formatters[f](value);
    } else if (_.isArray(f)) {
        _.each(f, function (v) {
            if (formatters[v]) {
                value = formatters[v](value);
            }
        });
    }
    return value;
}

function formatter(fields, _default) {
    return function (key, value) {
        if (!Array.isArray(value)) {
            value = [value];
        }
        if (_default && !(fields[key] && fields[key]['ignore-defaults'])) {
            value = value.map(function (item) {
                return format(_default, item);
            });
        }
        if (fields[key] && fields[key].formatter) {
            value = value.map(function (item) {
                return format(fields[key].formatter, item);
            });
        }
        if (value.length === 1) {
            value = value[0];
        }
        return value;
    };
}

module.exports = formatter;

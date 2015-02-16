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
        if (_default && !(fields[key] && fields[key]['ignore-defaults'])) {
            value = format(_default, value);
        }
        if (fields[key] && fields[key].formatter) {
            value = format(fields[key].formatter, value);
        }
        return value;
    };
}

module.exports = formatter;

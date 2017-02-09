var _ = require('underscore');

function format(f, value, formatters) {
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

function formatter(fields, _default, formatters) {
    formatters = formatters || require('./formatters');
    return function (key, value) {
        if (!Array.isArray(value)) {
            value = [value];
        }
        if (_default && !(fields[key] && fields[key]['ignore-defaults'])) {
            value = value.map(function (item) {
                return format(_default, item, formatters);
            });
        }
        if (fields[key] && fields[key].formatter) {
            value = value.map(function (item) {
                return format(fields[key].formatter, item, formatters);
            });
        }
        if (value.length === 1) {
            value = value[0];
        }
        return value;
    };
}

module.exports = formatter;

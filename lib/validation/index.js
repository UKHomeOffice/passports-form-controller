var _ = require('underscore'),
    debug = require('debug')('hmpo:validation');

var validators = require('./validators');

function applyValidator(validator, value, key) {

    function validate() {
        debug('Applying %s validator with value "%s"', validator.type, value);
        var args = [value];
        if (!_.isArray(validator.arguments)) {
            validator.arguments = [ validator.arguments ];
        }
        args = args.concat(validator.arguments);
        if (!validators[validator.type].apply(null, args)) {
            return _.extend({ key: key }, validator, { arguments: validator.arguments });
        }
    }

    if (typeof validator === 'string') {
        validator = {
            type: validator
        };
    }
    if (validators[validator.type]) {
        return validate();
    } else {
        throw new Error('Undefined validator:' + validator.type);
    }
}

function validator(fields) {
    return function (key, value, values, emptyValue) {
        emptyValue = emptyValue === undefined ? '' : emptyValue;

        function shouldValidate() {
            var dependent = fields[key].dependent;

            if (typeof dependent === 'string') {
                dependent = {
                    field: dependent,
                    value: true
                };
            }
            if (!dependent || (dependent && !fields[dependent.field]) || (dependent && values[dependent.field] === dependent.value)) {
                return true;
            } else {
                return false;
            }
        }

        if (fields[key]) {
            fields[key].validate = fields[key].validate || [];
            if (shouldValidate()) {
                var f = fields[key].validate;

                if (typeof f === 'string') {
                    f = [f];
                }

                if (fields[key].options) {
                    f.push({
                        type: 'equal',
                        arguments: _.map(fields[key].options, function (o) {
                            return typeof o === 'string' ? o : o.value;
                        })
                    });
                }

                debug('Applying validation on field %s with %s', key, value);
                return _.reduce(f, function (err, validator) {
                    return err || applyValidator(validator, value, key);
                }, null);
            } else {
                values[key] = emptyValue;
                debug('Skipping validation for field %s', key);
            }
        }
    };
}

validator.validators = validators;

module.exports = validator;

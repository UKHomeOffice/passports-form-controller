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

    function customValidate() {
        debug('Applying custom %s validator with value %s', validator.name, value);
        if (!validator(value)) {
            return _.extend({ key: key }, { type: validator.name });
        }
    }

    if (typeof validator === 'string') {
        validator = {
            type: validator
        };
    }
    if (validators[validator.type]) {
        return validate();
    } else if (typeof validator === 'function') {
        if (validator.name) {
            return customValidate();
        } else {
            throw new Error('Custom validator needs to be a named function');
        }
    } else {
        throw new Error('Undefined validator:' + validator.type);
    }
}

function validator(fields) {

    _.each(fields, function (field, key) {
        if (typeof fields[key].validate === 'string') {
            fields[key].validate = [fields[key].validate];
        }

        if (fields[key].options) {
            fields[key].validate = fields[key].validate || [];
            fields[key].validate.push({
                type: 'equal',
                arguments: _.map(fields[key].options, function (o) {
                    return typeof o === 'string' ? o : o.value;
                })
            });
        }
    });

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
            if (shouldValidate()) {
                debug('Applying validation on field %s with %s', key, value);
                return _.reduce(fields[key].validate, function (err, validator) {
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

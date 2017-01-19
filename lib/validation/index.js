var _ = require('underscore'),
    debug = require('debug')('hmpo:validation');

var validators = require('./validators');

function applyValidator(validator, values, key) {
    var value = values[key];

    function validate() {
        debug('Applying %s validator with value "%s"', validator.type, value);
        if (!validators[validator.type].apply(null, getArgs())) {
            // validation failed, return error
            return _.extend({ key: key }, validator, { arguments: validator.arguments });
        }
    }

    function customValidate() {
        debug('Applying custom %s validator with value %s', validator.name, value);
        // custom validators can flag for extra arguments by using named values { fn, arguments }
        if (validator.fn) {
            if (!validator.fn.apply(null, getArgs())) {
                // validation failed, return error
                return _.extend({ key: key }, { type: validator.fn.name }, { arguments: validator.arguments });
            }
        } else if (!validator(value)) {
            // validation failed, return error
            return _.extend({ key: key }, { type: validator.name });
        }
    }

    function getArgs() {
        var args = [value];
        if (!_.isArray(validator.arguments)) {
            validator.arguments = [ validator.arguments ];
        }
        // allow validators to flag that they want values
        var valuesFlag = _.findIndex(validator.arguments, { values: true });
        if (valuesFlag > -1) {
            validator.arguments[valuesFlag] = values;
        }
        return args.concat(validator.arguments);
    }

    if (typeof validator === 'string') {
        validator = {
            type: validator,
        };
    }
    // call validator
    if (validators[validator.type]) {
        return validate();
    } else if (typeof validator === 'function' || typeof validator.fn === 'function') {
        if (validator.name || validator.fn.name) {
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
            if (!dependent
                || (dependent && !fields[dependent.field])
                || (dependent && (Array.isArray(values[dependent.field])
                    ? values[dependent.field].indexOf(dependent.value) > -1
                    : values[dependent.field] === dependent.value))
            ) {
                return true;
            } else {
                return false;
            }
        }

        if (fields[key]) {
            if (shouldValidate()) {
                debug('Applying validation on field %s with %s', key, value);
                return _.reduce(fields[key].validate, function (err, validator) {
                    return err || applyValidator(validator, values, key);
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

var _ = require('underscore'),
    debug = require('debug')('hmpo:validation');

var validators = require('./validators');

function applyValidator(validator, value, key, values) {

    function validate() {
        debug('Applying %s validator with value "%s"', validator.type, value);

        // set args for the validator
        var args = [value];
        if (!_.isArray(validator.arguments)) {
            validator.arguments = (typeof validator.arguments === 'undefined') ? [] : [ validator.arguments ];
        }
        args = args.concat(validator.arguments);

        // set validator
        var validation = validators[validator.type];

        /* istanbul ignore next */
        if (validators[validator.type].options && validators[validator.type].options.values === true) {

            // validators can use 'options' to request the form values
            args.push(values);

            // validation rules are applied in 'validate'
            validation = validators[validator.type].validate;
        }

        // apply validation
        if (!validation.apply(null, args)) {
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
                    return err || applyValidator(validator, value, key, values);
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

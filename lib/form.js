var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore'),
    debug = require('debug')('hmpo:form'),
    dataFormatter = require('./formatting'),
    dataValidator = require('./validation'),
    ErrorClass = require('./error');

var Form = function Form(options) {
    if (!options) {
        throw new Error('Options must be provided');
    }
    if (!options.template) {
        throw new Error('A template must be provided');
    }
    options.defaultFormatters = options.defaultFormatters || ['trim', 'singlespaces', 'hyphens'];
    options.fields = options.fields || {};
    this.options = options;
    this.Error = ErrorClass;
};

util.inherits(Form, EventEmitter);

_.extend(Form.prototype, {
    requestHandler: function () {
        return function (req, res, callback) {
            var method = req.method.toLowerCase();
            if (typeof this[method] === 'function') {
                this[method](req, res, function (err) {
                    if (err) {
                        this.errorHandler(err, req, res, callback);
                    } else {
                        callback();
                    }
                }.bind(this));
            } else {
                res.send(405, 'Method ' + method + ' not allowed.');
            }
        }.bind(this);
    },
    get: function (req, res, callback) {
        var errors = this.getErrors(req, res);
        this._getValues(req, res, function (err, values) {
            if (err) {
                return callback(err);
            }
            req.form = { values: values || {} };
            debug('Rendering form for ' + req.path);
            if (_.isEmpty(this.options.fields) && this.options.next) {
                this.emit('complete', req, res);
            }
            _.extend(res.locals, {
                errors: errors,
                errorlist: _.map(errors, _.identity),
                values: values,
                options: this.options
            }, this.locals(req, res));
            this.render(req, res, callback);
        }.bind(this));
    },
    post: function (req, res, callback) {
        debug('Received POST for ' + req.path);
        this.setErrors(null, req, res);
        this._process(req, res, function (err) {
            if (err) {
                return callback(err);
            }
            this._validate(req, res, function (err) {
                if (err) {
                    debug('Validation failed for ' + req.path);
                    debug(err);
                    callback(err);
                } else {
                    debug('Validation passed for ' + req.path);
                    this.saveValues(req, res, function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            this.successHandler(req, res);
                        }
                    }.bind(this));
                }
            }.bind(this));
        }.bind(this));
    },
    locals: function (/*req, res*/) {
        return {};
    },
    render: function (req, res/*, callback*/) {
        res.render(this.options.template);
    },
    // placeholder methods for persisting error messages between POST and GET
    getErrors: function (/*req, res*/) {
        return {};
    },
    setErrors: function (/*err, req, res*/) {},
    _validate: function (req, res, callback) {
        debug('Validating...');

        var formatter = dataFormatter(this.options.fields, this.options.defaultFormatters);

        var validator = dataValidator(this.options.fields),
            errors = {};

        _.each(req.form.values, function (value, key) {
            var emptyValue = formatter(key, '');

            var error = validator(key, value, req.form.values, emptyValue);
            if (error) {
                if (error.group) {
                    errors[error.group] = new this.Error(error.group, error);
                } else {
                    errors[error.key] = new this.Error(error.key, error);
                }
            }
        }, this);

        if (!_.isEmpty(errors)) {
            callback(errors);
        } else {
            this.validate(req, res, callback);
        }
    },
    validate: function (req, res, callback) {
        callback();
    },
    _process: function (req, res, callback) {
        req.form = { values: {} };
        var formatter = dataFormatter(this.options.fields, this.options.defaultFormatters);
        _.each(this.options.fields, function (value, key) {
            req.form.values[key] = formatter(key, req.body[key] || '');
        });
        this.process(req, res, callback);
    },
    process: function (req, res, callback) {
        callback();
    },
    _getValues: function (req, res, callback) {
        this.getValues(req, res, callback);
    },
    getValues: function (req, res, callback) {
        callback();
    },
    saveValues: function (req, res, callback) {
        callback();
    },
    getNextStep: function (req) {
        var next = this.options.next || req.path;
        return req.baseUrl + next;
    },
    getErrorStep: function (err, req) {
        var redirect = req.path;
        var redirectedError = _.find(err, function (error) {
            return error.redirect;
        });
        if (redirectedError) {
            redirect = redirectedError.redirect;
        }
        return req.baseUrl + redirect;
    },
    isValidationError: function (err) {
        return !_.isEmpty(err) && _.all(err, function (e) { return e instanceof this.Error; }, this);
    },
    errorHandler: function (err, req, res, callback) {
        if (this.isValidationError(err)) {
            this.setErrors(err, req, res);
            res.redirect(this.getErrorStep(err, req));
        } else {
            // if the error is not a validation error then throw and let the error handler pick it up
            return callback(err);
        }
    },
    successHandler: function (req, res) {
        this.emit('complete', req, res);
        res.redirect(this.getNextStep(req, res));
    }
});

module.exports = Form;

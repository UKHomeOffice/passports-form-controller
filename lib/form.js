var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore'),
    debug = require('debug')('hmpo:controller:form'),
    dataFormatter = require('./formatting'),
    dataValidator = require('./validation');

var Form = function Form(options) {
    if (!options) {
        throw new Error('Options must be provided');
    }
    // default template is the same as the pathname
    options.template = options.template || options.path.replace(/^\//, '');
    if (options.path === '/' && options.template === '') {
        options.template = 'index';
    }
    if (!options.template) {
        throw new Error('A template must be provided');
    }
    options.defaultFormatters = options.defaultFormatters || ['trim', 'singlespaces', 'hyphens'];
    options.fields = options.fields || {};
    this.options = options;
    this.Error = Form.Error;
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
            debug('Rendering form for ' + req.path);
            if (_.isEmpty(this.options.fields) && this.options.next) {
                this.emit('complete', req, res);
            }
            res.render(this.options.template, _.extend({
                errors: errors,
                errorlist: _.map(errors, _.identity),
                values: values,
                nextPage: this.getNextStep(req, res),
                action: values.action || (req.baseUrl + req.path),
                options: this.options,
                urlSuffix: req.params.action ? '/' + req.params.action : ''
            }, this.locals(req, res)));
        }.bind(this));
    },
    post: function (req, res, callback) {
        debug('Received POST for ' + req.path);
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
    locals: function (req, res) {
        return {};
    },
    getErrors: function (req/*, res*/) {
        var errors = _.last(req.flash('errors')),
            keys = Object.keys(this.options.fields).concat(this.options.allowedErrors);
        return _.pick(errors, keys);
    },
    _validate: function (req, res, callback) {
        debug('Validating...');

        var validator = dataValidator(this.options.fields),
            errors = {};

        _.each(req.form.values, function (value, key) {
            var error = validator(key, value, req.form.values);
            if (error) {
                errors[key] = new this.Error(error.key, error);
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
        this.getValues(req, res, function (err, values) {
            callback(err, _.extend({}, values, _.last(req.flash('values'))));
        });
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
        return !_.isEmpty(err) &&  _.all(err, function (e) { return e instanceof this.Error; }, this);
    },
    errorHandler: function (err, req, res, callback) {
        if (this.isValidationError(err)) {
            req.flash('errors', err);
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

Form.Error = require('./error');

module.exports = Form;
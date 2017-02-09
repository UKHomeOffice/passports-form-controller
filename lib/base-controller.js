/*eslint no-unused-vars: [2, {"vars": "all", "args": "none"}]*/
var util = require('util'),
    express = require('express'),
    EventEmitter = require('events').EventEmitter,
    clone = require('lodash.clonedeep');

var _ = require('underscore'),
    debug = require('debug')('hmpo:form'),
    dataFormatter = require('./formatting'),
    dataValidator = require('./validation'),
    ErrorClass = require('./base-error');

var Form = function Form(options) {
    if (!options) {
        throw new Error('Options must be provided');
    }
    if (!options.template) {
        debug('No template provided');
    }
    options.defaultFormatters = options.defaultFormatters || ['trim', 'singlespaces', 'hyphens'];
    options.fields = options.fields || {};
    this.options = options;
    this.Error = ErrorClass;

    this.router = express.Router({ mergeParams: true });
};

util.inherits(Form, EventEmitter);

_.extend(Form.prototype, {
    requestHandler: function () {
        var methods = ['get', 'post', 'put', 'delete'];
        _.each(methods, function (method) {
            if (typeof this[method] === 'function') {
                this.router[method]('*', this[method].bind(this));
            } else {
                this.router[method]('*', function (req, res, next) {
                    var err = new Error('Method not supported');
                    err.statusCode = 405;
                    next(err);
                });
            }
        }, this);
        this.router.use(this.errorHandler.bind(this));
        return this.router;
    },
    use: function () {
        this.router.use.apply(this.router, arguments);
    },
    get: function (req, res, callback) {
        var router = express.Router({ mergeParams: true });
        router.use([
            this._configure.bind(this),
            this._getErrors.bind(this),
            this._getValues.bind(this),
            this._locals.bind(this),
            this._checkEmpty.bind(this),
            this.render.bind(this)
        ]);
        router.use(function (err, req, res, next) {
            callback(err);
        });
        router.handle(req, res, callback);
    },
    post: function (req, res, callback) {
        this.setErrors(null, req, res);
        var router = express.Router({ mergeParams: true });
        router.use([
            this._configure.bind(this),
            this._process.bind(this),
            this._validate.bind(this),
            this.saveValues.bind(this),
            this.successHandler.bind(this)
        ]);
        router.use(function (err, req, res, next) {
            callback(err);
        });
        router.handle(req, res, callback);
    },
    _locals: function (req, res, callback) {
        _.extend(res.locals, {
            errors: req.form.errors,
            errorlist: _.map(req.form.errors, _.identity),
            values: req.form.values,
            options: req.form.options,
            action: req.baseUrl !== '/' ? req.baseUrl + req.path : req.path
        });
        _.extend(res.locals, this.locals(req, res));
        callback();
    },
    locals: function (/*req, res*/) {
        return {};
    },
    render: function (req, res, callback) {
        if (!req.form.options.template) {
            callback(new Error('A template must be provided'));
        } else {
            res.render(req.form.options.template);
        }
    },
    _getErrors: function (req, res, callback) {
        req.form.errors = this.getErrors(req, res);
        callback();
    },
    // placeholder methods for persisting error messages between POST and GET
    getErrors: function (/*req, res*/) {
        return {};
    },
    setErrors: function (/*err, req, res*/) {},
    _validate: function (req, res, callback) {
        debug('Validating...');

        var errors = {};

        var formatter = dataFormatter(req.form.options.fields, req.form.options.defaultFormatters, req.form.options.formatters);
        var validator = dataValidator(req.form.options.fields);

        _.each(req.form.values, function (value, key) {
            var error = this.validateField(key, req, validator, formatter);
            if (error) {
                if (error.group) {
                    errors[error.group] = new this.Error(error.group, error, req, res);
                } else {
                    errors[error.key] = new this.Error(error.key, error, req, res);
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
    validateField: function (key, req, validator, formatter) {
        formatter = formatter || dataFormatter(req.form.options.fields, req.form.options.defaultFormatters, req.form.options.formatters);
        validator = validator || dataValidator(req.form.options.fields);
        var emptyValue = formatter(key, '');
        return validator(key, req.form.values[key], req.form.values, emptyValue);
    },
    _process: function (req, res, callback) {
        req.form.values = req.form.values || {};
        var formatter = dataFormatter(req.form.options.fields, req.form.options.defaultFormatters, req.form.options.formatters);
        _.each(req.form.options.fields, function (value, key) {
            req.form.values[key] = formatter(key, req.body[key] || '');
        });
        this.process(req, res, callback);
    },
    process: function (req, res, callback) {
        callback();
    },
    _configure: function (req, res, callback) {
        req.form = req.form || {};
        req.form.options = clone(this.options);
        this.configure(req, res, callback);
    },
    configure: function (req, res, callback) {
        callback();
    },
    _getValues: function (req, res, callback) {
        this.getValues(req, res, function (err, values) {
            req.form.values = values || {};
            callback(err);
        });
    },
    getValues: function (req, res, callback) {
        callback();
    },
    saveValues: function (req, res, callback) {
        callback();
    },
    _getForkTarget: function (req, res) {
        function evalCondition(condition) {
            return _.isFunction(condition) ?
                condition(req, res) :
                condition.value === req.form.values[condition.field];
        }

        // If a fork condition is met, its target supercedes the next property
        return req.form.options.forks.reduce(function (result, value) {
            return evalCondition(value.condition) ?
                value.target :
                result;
        }, req.form.options.next);
    },
    getForkTarget: function (req, res) {
        return this._getForkTarget(req, res);
    },
    _checkEmpty: function (req, res, callback) {
        if (_.isEmpty(req.form.options.fields) && req.form.options.next) {
            this.emit('complete', req, res);
        }
        callback();
    },
    getNextStep: function (req, res) {
        var next = req.form.options.next || req.path;
        if (req.form.options.forks && Array.isArray(req.form.options.forks)) {
            next = this._getForkTarget(req, res);
        }
        if (req.baseUrl !== '/') {
            next = req.baseUrl + next;
        }
        return next;
    },
    getErrorStep: function (err, req) {
        var redirect = req.path;
        var redirectError = _.all(err, function (error) {
            return error.redirect;
        });

        if (redirectError) {
            redirect = _.find(err, function (error) {
                return error.redirect;
            }).redirect;
        }
        if (req.baseUrl !== '/' && !redirect.match(/^https?:\/\//)) {
            redirect = req.baseUrl + redirect;
        }
        return redirect;
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

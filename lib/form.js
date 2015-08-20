/*eslint no-unused-vars: [2, {"vars": "all", "args": "none"}]*/
var util = require('util'),
    express = require('express'),
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

    this.formatter = dataFormatter(this.options.fields, this.options.defaultFormatters);
    this.validator = dataValidator(this.options.fields);

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
        req.form = req.form || {};
        var router = express.Router({ mergeParams: true });
        router.use([
            this._getErrors.bind(this),
            this._getValues.bind(this),
            this._locals.bind(this),
            this.render.bind(this)
        ]);
        router.use(function (err, req, res, next) {
            callback(err);
        });
        if (_.isEmpty(this.options.fields) && this.options.next) {
            this.emit('complete', req, res);
        }
        router.handle(req, res, callback);
    },
    post: function (req, res, callback) {
        this.setErrors(null, req, res);

        req.form = req.form || {};
        var router = express.Router({ mergeParams: true });
        router.use([
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
            options: this.options,
            action: req.baseUrl !== '/' ? req.baseUrl + req.path : req.path
        });
        _.extend(res.locals, this.locals(req, res));
        callback();
    },
    locals: function (/*req, res*/) {
        return {};
    },
    render: function (req, res, callback) {
        res.render(this.options.template);
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

        _.each(req.form.values, function (value, key) {
            var error = this.validateField(key, req);
            if (error) {
                if (error.group) {
                    errors[error.group] = new this.Error(error.group, error, req);
                } else {
                    errors[error.key] = new this.Error(error.key, error, req);
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
    validateField: function (key, req) {
        var emptyValue = this.formatter(key, '');
        return this.validator(key, req.form.values[key], req.form.values, emptyValue);
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
    getNextStep: function (req) {
        var next = this.options.next || req.path;
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
        if (req.baseUrl !== '/') {
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

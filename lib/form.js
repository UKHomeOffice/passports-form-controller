'use strict';

/*eslint no-unused-vars: [2, {"vars": "all", "args": "none"}]*/
var util = require('util'),
    express = require('express'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore'),
    debug = require('debug')('hmpo:form'),
    helpers = require('./util/helpers'),
    dataFormatter = require('./formatting'),
    dataValidator = require('./validation'),
    components = require('./components'),
    ErrorClass = require('./error');

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

    // update field config with any settings provided by components
    debug('Fields before:', this.options.fields);
    components.set(this.options.fields);
    debug('Fields updated:', this.options.fields);

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
            this._components.bind(this),
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
            this._components.bind(this),
            this.saveValues.bind(this),
            this.successHandler.bind(this)
        ]);
        router.use(function (err, req, res, next) {
            callback(err);
        });
        router.handle(req, res, callback);
    },
    _getErrors: function (req, res, callback) {
        // allow errors to be setup at the step level, then pass to field level
        // (see https://github.com/UKHomeOffice/passports-form-wizard/blob/master/lib/controller.js#L26)
        let formErrors = this.getErrors(req, res);
        let fieldErrors = this.fieldHooks('getErrors', [req, res, formErrors]);
        req.form.errors = _.extend({}, formErrors, fieldErrors);

        // Alternatively, it might be preferable for fields to go first,
        // then pass the result to the step for the final say. This would
        // require some updates to how the wizard handles getErrors.
        callback();
    },
    // placeholder methods for persisting error messages between POST and GET
    getErrors: function (/*req, res*/) {
        return {};
    },
    setErrors: function (/*err, req, res*/) {},
    _getValues: function (req, res, callback) {
        // apply field-level handling before values are passed to the step level
        this.fieldHooks('getValues', [req, res, {}], (response) => {
            let values = _.last(response) || {}; // the last set of values is the one that has passed through all of the field-level getValues

            // set values to req.form so that they can be used at step level
            req.form.fieldValues = values;

            // tempting to pass values via the session model:
            // req.sessionModel.set(values);
            // but this relies on a session model that we don't know about yet

            this.getValues(req, res, (err, values) => {
                delete req.form.fieldValues;
                req.form.values = values || {};
                callback(err);
            });
        });
    },
    getValues: function (req, res, callback) {
        callback();
    },
    // Allow components to provide custom methods. Called:
    // - before res locals are set (GET requests)
    // - before values are saved to session (POST requests)
    _components: function (req, res, callback) {
        let methods = [];
        let type = req.method.toLowerCase();
        _.each(this.options.fields, (field, key) => {
            _.each(field.components, (component) => {
                let fns = helpers.getArray(component.controller, type);
                _.each(fns, (fn) => {
                    methods.push(helpers.makePromise(fn, [req, res, key]));
                });
            });
        });
        Promise.all(methods).then(values => {
            return callback();
        });
    },
    _locals: function (req, res, callback) {
        // todo: this.fieldHooks('locals', [req, res, {}], (response) => { ... }

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
        // no need for field-level handling here, this is page level stuff

        if (!this.options.template) {
            callback(new Error('A template must be provided'));
        } else {
            res.render(this.options.template);
        }
    },
    _process: function (req, res, callback) {
        req.form = { values: {} };
        var formatter = dataFormatter(this.options.fields, this.options.defaultFormatters);
        _.each(this.options.fields, function (value, key) {
            req.form.values[key] = formatter(key, req.body[key] || '');
        });
        this.process(req, res, callback);
        // todo: (callback) { this.fieldHooks('process', [req, res, {}], (response) => { ... }
    },
    process: function (req, res, callback) {
        callback();
    },
    _validate: function (req, res, callback) {
        debug('Validating...');

        var errors = {};

        _.each(req.form.values, function (value, key) {
            var error = this.validateField(key, req);
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
            // todo: (callback) { this.fieldHooks('validate', [req, res, {}], (response) => { ... }
        }
    },
    validate: function (req, res, callback) {
        callback();
    },
    validateField: function (key, req) {
        var emptyValue = this.formatter(key, '');
        return this.validator(key, req.form.values[key], req.form.values, emptyValue);
    },
    saveValues: function (req, res, callback) {
        callback();
    },
    successHandler: function (req, res) {
        this.emit('complete', req, res);
        res.redirect(this.getNextStep(req, res));
    },
    _getForkTarget: function (req, res) {
        function evalCondition(condition) {
            return _.isFunction(condition) ?
                condition(req, res) :
                condition.value === req.form.values[condition.field];
        }

        // If a fork condition is met, its target supercedes the next property
        return this.options.forks.reduce(function (result, value) {
            return evalCondition(value.condition) ?
                value.target :
                result;
        }, this.options.next);
    },
    getForkTarget: function (req, res) {
        return this._getForkTarget(req, res);
    },
    getNextStep: function (req, res) {
        var next = this.options.next || req.path;
        if (this.options.forks && Array.isArray(this.options.forks)) {
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
    // apply field level processing
    fieldHooks(name, args, callback) {
        // 1. search through field config for methods of type [name]
        // 2. call each method found
        // 3. return an array of the responses

        // search for methods
        let methods = [];
        _.each(this.options.fields, (field, key) => {
            let fns = helpers.getArray(field.controller, name);
            _.each(fns, (fn) => {
                methods.push({
                    fn,
                    args: args.concat([key])
                });
            });
        });

        // call each method
        if (!methods.length) {
            return (callback) ? callback(): {};
        }
        if (callback) {
            let promises = helpers.makePromises(methods);
            // the return value of each promise is passed to the next
            // they are then returned as an array of values
            Promise.all(promises).then(values => {
                debug('Promises made for field methods', methods, 'with responses:', values);
                return callback(values);
            });
        } else {
            let values = [];
            _.each(methods, (method) => {
                let response = method.fn.apply(this, method.args);
                // build up an array of responses
                if (!_.isEmpty(response)) {
                    values.push(response);
                }
            });
            debug('Field methods applied', methods, ' with responses:', values);
            return values;
        }
    }
});

module.exports = Form;

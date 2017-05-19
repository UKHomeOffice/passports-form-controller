'use strict';

const Session = require('hof-behaviour-session');
const Hooks = require('hof-behaviour-hooks');
const Controller = require('./lib/controller');
const mix = require('mixwith').mix;

class FormController extends mix(Controller).with(Session, Hooks) {}

FormController.validators = require('./lib/validation/validators');
FormController.formatters = require('./lib/formatting/formatters');

FormController.ValidationError = require('./lib/validation-error');

module.exports = FormController;
module.exports.Controller = Controller;
module.exports.BaseController = require('./lib/base-controller');

'use strict';

const _ = require('lodash');
const i18nLookup = require('i18n-lookup');
const BaseError = require('./base-error');

function getArgs(type, args) {
  if (type === 'past') {
    return {
      age: args.join(' ')
    };
  } else if (Array.isArray(args) && typeof type === 'string') {
    var obj = {};
    obj[type] = args[0];
    return obj;
  }
  return {};
}

function compile(t, context) {
  return require('hogan.js').compile(t).render(context);
}

module.exports = class FormError extends BaseError {
  constructor(key, options, req, res) {
    super(key, options, req, res);
    req = req || {};
    this.options = options;
    if (typeof req.translate === 'function') {
      this.translate = req.translate;
    }
  }

  getMessage(key, options, req, res) {
    res = res || {};
    const keys = [
      'validation.' + this.key + '.' + this.type,
      'validation.' + this.key + '.default',
      'validation.' + this.type,
      'validation.default'
    ];
    const context = Object.assign({
      label: this.translate('fields.' + this.key + '.label').toLowerCase(),
      legend: this.translate('fields.' + this.key + '.legend').toLowerCase()
    }, res.locals, getArgs(this.type, this.options.arguments));

    return i18nLookup(this.translate, compile)(keys, context);
  }

  translate() {
    return _.identity.apply(_, arguments);
  }
};

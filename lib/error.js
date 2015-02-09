var _ = require('underscore'),
    i18n = require('i18next');

var i18nLookup = require('../i18n-property');

function getArgs(type, args) {
    if (type === 'maxlength') {
        return { maxlength: args[0] };
    } else if (type === 'exactlength') {
        return { exactlength: args[0] };
    } else if (type === 'past') {
        return { age: args.join(' ') };
    } else {
        return {};
    }
}

function getValidationMessage(key, options) {
    var keys = [
            'validation.' + key + '.' + options.type,
            'validation.' + key + '.default',
            'validation.' + options.type,
            'validation.default'
        ],
        context = _.extend({
            label: i18n.t('passport.renew.fields.' + key + '.label').toLowerCase()
        }, getArgs(options.type, options.arguments));

    return i18nLookup(keys, context);
}

module.exports = function FormError(key, options) {
    options = _.extend({
        type: 'default'
    }, options);
    this.message = options.message || getValidationMessage(key, options);
    this.key = key;
    this.type = options.type;
    this.redirect = options.redirect;
};
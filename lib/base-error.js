var _ = require('underscore');

function FormError(key, options, req, res) {
    options = _.extend({
        type: 'default'
    }, options);
    this.key = key;
    this.type = options.type;
    this.redirect = options.redirect;
    Object.defineProperty(this, 'message', {
        enumerable: true,
        get: function () {
            return options.message || this.getMessage(key, options, req, res);
        }
    });
    Object.defineProperty(this, 'title', {
        enumerable: true,
        get: function () {
            return options.title || this.getTitle(key, options, req, res);
        }
    });
}

FormError.prototype.getMessage = function (/*key, options, req, res*/) {
    return 'Error';
};

FormError.prototype.getTitle = function (/*key, options, req, res*/) {
    return 'Oops, something went wrong';
};

module.exports = FormError;

var _ = require('underscore');

function FormError(key, options/*, req*/) {
    options = _.extend({
        type: 'default'
    }, options);
    this.key = key;
    this.type = options.type;
    this.redirect = options.redirect;
    Object.defineProperty(this, 'message', {
        enumerable: true,
        get: function () {
            return options.message || this.getMessage(key, options);
        }
    });
}

FormError.prototype.getMessage = function (/*key, options*/) {
    return 'Error';
};

module.exports = FormError;

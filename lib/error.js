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
}

FormError.prototype.getMessage = function (/*key, options, req, res*/) {
    return 'Error';
};

module.exports = FormError;

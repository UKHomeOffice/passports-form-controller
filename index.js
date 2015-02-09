var Form = require('./lib/form');

Form.validators = require('./lib/validation/validators');
Form.formatters = require('./lib/formatting/formatters');

Form.Error = require('./lib/error');

module.exports = Form;

# passports-form-controller

Implements a request pipeline for GET and POST of forms, with input cleaning/formatting and validation.

## Usage

Basic usage:

```javascript
var Form = require('hmpo-form-controller');

var form = new Form({
    template: 'form',
    fields: {
        name: {
            validate: 'required'
        }
    }
});

app.use('/', form.requestHandler());
```

This won't really be very useful though, since all it will do is render the "form" template on `/` and respond to GET and POST requests.

For real-world usage you will probably want to extend the Form class to create your own controllers.

```javascript
var Form = require('hmpo-form-controller'),
    util = require('util');

var MyForm = function (options) {
    Form.call(this, options);
};

util.inherits(MyForm, Form);

module.exports = MyForm;
```

The Form class allows for a number of insertion points for extended functionality:

* `configure`   Allows for dynamic overwriting of particular points of form configuration based on user session
* `middlewareMixins`   Allows additional middleware to be added after the configure stage
* `process`     Allows for custom formatting and processing of input prior to validation
* `validate`    Allows for custom input validation
* `getValues`   To define what values the fields are populated with on GET
* `saveValues`  To define what is done with successful form submissions

All of these methods take three arguments of the request, the response and a callback. In all cases the callback should be called with a first argument representing an error.

* `getErrors/setErrors` Define how errors are persisted between the POST and subsequent GET of a form step.
* `locals` Define what additional variables a controller exposes to its template

These methods are synchronous and take only the request and response obejct as arguments.

### Validators

The library [supports a number of validators](https://github.com/UKHomeOffice/passports-form-controller/blob/master/lib/validation/validators.js).

By default the application of a validator is optional on empty strings. If you need to ensure a field is validated as being 9 characters long and exists then you need to use both an `exactlength` and a `required` validator (see the example in the next section).

#### Common Validators

Many of the common validators require more than simply providing the validator name. The basic configuration is given in the following example, using the `exactlength` validator.

##### Exact length field configuration

The field configuration below for an `id-number`, ensures a value: is provided, is numberic, and is exactly **9** digits.

fields.js
```js
'id-number': {
    validate: [
        'required',
        'numeric',
        {
            type: 'exactlength',
            arguments: [ 9 ]
        }
    ]
}
```

Note: The object notation for the `exactlength` validator. This allows the definition of the extra coniguration property `arguments`. In the example the exact length is set to `9`. Some of the more complex validators - like `before` and `after` - may require several parameters, e.g. validating a date was before 1 year, 2 months, 3 days, 4 hours, 5 minutes ago, would look like: `arguments: [1, 'years', 2, 'months', 3, 'days', 4, 'hours', 5, 'minutes']`

##### Exact length error token configuration

The token configuration below for the same `id-number` (as in the above field example), shows how to define an appropriate set of error messages.

default.json
```js
"validation": {
    "id-number": {
        "required": "Please enter an ID number",
        "numeric": "Please enter a proper number",
        "exactlength": "The ID number should be 9 digits"
    }
}
```

#### Custom Validators

Custom validator functions can be passed in field config. These must be named functions and the name is used as the error.type for looking up validation error messages.

fields.js
```js
{
    'field-1': {
        validate: ['required', function isTrue(val) {
            return val === true;
        }]
    }
}
```

### steps config

#### Handles journey forking

Each step definition accepts a `next` property, the value of which is the next route in the journey. By default, when the form is successfully submitted, the next steps will load. However, there are times when it is necessary to fork from the current journey based on a users response to certain questions in a form. For such circumstances there exists the `forks` property.

In this example, when the submits the form, if the field called 'example-radio' has the value 'superman', the page at '/fork-page' will load, otherwise '/next-page' will be loaded.

```js

'/my-page': {
    next: '/next-page',
    forks: [{
        target: '/fork-page',
        condition: {
            field: 'example-radio',
            value: 'superman'
        }
    }]
}
```

The condition property can also take a function. In the following example, if the field called 'name' is more than 30 characters in length, the page at '/fork-page' will be loaded.

```js

'/my-page': {
    next: '/next-page',
    forks: [{
        target: '/fork-page',
        condition: function (req, res) {
            return req.form.values['name'].length > 30;
        }
    }]
}
```

Forks is an array and therefore each fork is interrogated in order from top to bottom. The last fork whose condition is met will assign its target to the next page variable.

In this example, if the last condition resolves to true - even if the others also resolve to true - then the page at '/fork-page-three' will be loaded. The last condition to be met is always the fork used to determine the next step.

```js

'/my-page': {
    next: '/next-page',
    forks: [{
        target: '/fork-page-one',
        condition: function (req, res) {
            return req.form.values['name'].length > 30;
        }
    }, {
        target: '/fork-page-two',
        condition: {
            field: 'example-radio',
            value: 'superman'
        }
    }, {
        target: '/fork-page-three',
        condition: function (req, res) {
            return typeof req.form.values['email'] === 'undefined';
        }
    }]
}
```

### Dynamic field options

If the options for a particular field are dependent on aspects of the user session, then these can be extended on a per-session basis using the `configure` method.

For example, for a dynamic address selection component:

```js
MyForm.prototype.configure = function configure(req, res, next) {
    req.form.options.fields['address-select'].options = req.sessionModel.get('addresses');
    next();
}
```

### Middleware mixins

If you want to add middleware that uses dynamic field options then you can use the `middlewareMixins` method. This is called after `configure` so after the dynamic field options are set.

For example, for setting the base url to res locals:

```js
MyForm.prototype.middlewareMixins = function middlewareMixins(req, res, next) {
    this.use(this.setBaseUrlLocal).bind(this);
}

MyForm.prototype.setBaseUrlLocal = function setBaseUrlLocal(req, res, next) {
    res.locals.baseUrl = req.baseUrl;
    next();
}
```

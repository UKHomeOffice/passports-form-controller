var Form = require('../../');

var _ = require('underscore'),
    EventEmitter = require('events').EventEmitter;

describe('Form Controller', function () {

    beforeEach(function () {
        sinon.spy(EventEmitter.prototype, 'emit');
    });
    afterEach(function () {
        EventEmitter.prototype.emit.restore();
    });

    it('exports a constructor', function () {
        Form.should.be.a('function');
    });

    it('implements event emitter', function () {
        var form = new Form({ template: 'index' });
        form.should.be.an.instanceOf(EventEmitter);
    });

    it('throws if both template is undefined', function () {
        var fn = function () {
            return new Form({});
        };
        fn.should.throw();
    });

    it('has `get` and `post` methods', function () {
        var form = new Form({ template: 'index' });
        form.get.should.be.a('function');
        form.post.should.be.a('function');
    });

    it('has a `requestHandler` method', function () {
        var form = new Form({ template: 'index' });
        form.requestHandler.should.be.a('function');
    });

    describe('requestHandler', function () {

        var form, handler, req, res, cb;

        beforeEach(function () {
            form = new Form({ template: 'index' });
            sinon.stub(form, 'get');
            sinon.stub(form, 'post');
            sinon.stub(form, 'errorHandler');
            req = request({
                params: {}
            }),
            res = {
                send: sinon.stub()
            };
            cb = function callback() {};
            handler = form.requestHandler();
        });

        it('returns a function', function () {
            form.requestHandler().should.be.a('function');
        });

        describe('returned function', function () {

            it('calls form.get in response to get requests', function () {
                req.method = 'GET';
                handler(req, res, cb);
                form.get.should.have.been.calledWith(req, res);
                form.get.should.have.been.calledOn(form);
            });

            it('calls form.post in response to post requests', function () {
                req.method = 'POST';
                handler(req, res, cb);
                form.post.should.have.been.calledWith(req, res);
                form.post.should.have.been.calledOn(form);
            });

            it('sends error in response to put requests', function () {
                req.method = 'PUT';
                handler(req, res, cb);
                res.send.should.have.been.calledWith(405);
            });

            it('sends error in response to delete requests', function () {
                req.method = 'DELETE';
                handler(req, res, cb);
                res.send.should.have.been.calledWith(405);
            });

            it('calls error handler if method calls back with an error', function () {
                req.method = 'POST';
                form.post.yields({ error: 'message' });
                handler(req, res, cb);
                form.errorHandler.should.have.been.calledOnce;
                form.errorHandler.should.have.been.calledWith({ error: 'message' }, req, res, cb);
                form.errorHandler.should.have.been.calledOn(form);
            });

        });

    });

    describe('get', function () {

        var form, req, res, cb;

        beforeEach(function () {
            form = new Form({
                template: 'index',
                next: '/next',
                fields: {
                    field: 'name'
                }
            });
            req = request({
                path: '/index'
            });
            res = {
                render: sinon.stub(),
                locals: {}
            };
            cb = sinon.stub();
            sinon.stub(Form.prototype, 'getValues').yields(null, {});
            sinon.stub(Form.prototype, 'getErrors').returns({});
            sinon.stub(Form.prototype, 'render');
        });

        afterEach(function () {
            Form.prototype.getValues.restore();
            Form.prototype.getErrors.restore();
            Form.prototype.render.restore();
        });

        it('calls form.getValues', function () {
            form.get(req, res, cb);
            form.getValues.should.have.been.calledWith(req, res);
            form.getValues.should.have.been.calledOn(form);
        });

        it('sets values to req.form.values', function () {
            Form.prototype.getValues.yields(null, { foo: 'bar' });
            form.get(req, res, cb);
            req.form.values.should.eql({ foo: 'bar' });
        });

        it('defaults req.form.values to an empty object', function () {
            Form.prototype.getValues.yields(null);
            form.get(req, res, cb);
            req.form.values.should.eql({ });
        });

        it('calls form.render', function () {
            form.get(req, res, cb);
            form.render.should.have.been.calledOnce;
            form.render.should.have.been.calledWithExactly(req, res, cb);
        });

        it('passes any errors to the rendered template', function () {
            form.getErrors.returns({ field: { message: 'error' } });
            form.get(req, res, cb);
            res.locals.errors.should.eql({ field: { message: 'error' } });
        });

        it('passes output of getValues to the rendered template', function () {
            req.flash.returns([]);
            form.getValues.yields(null, { values: [1] });
            form.get(req, res, cb);
            res.locals.values.should.eql({ values: [1] });
        });

        it('calls callback with error if getValues fails', function () {
            req.flash.returns([]);
            form.getValues.yields({ error: 'message' });
            form.get(req, res, cb);
            cb.should.have.been.calledOnce;
            cb.should.have.been.calledWithExactly({ error: 'message' });
        });

        it('includes form options in rendered response', function () {
            form.get(req, res, cb);
            res.locals.options.should.eql(form.options);
        });

        it('emits "complete" event if form has no fields', function () {
            form.options.fields = {};
            form.get(req, res, cb);
            form.emit.withArgs('complete').should.have.been.calledOnce;
            form.emit.withArgs('complete').should.have.been.calledOn(form);
            form.emit.should.have.been.calledWithExactly('complete', req, res);
        });

        it('does not emit "complete" event if form has fields', function () {
            form = new Form({ template: 'index', fields: { key: {} } });
            form.get(req, res, cb);
            form.emit.withArgs('complete').should.not.have.been.called;
        });

        it('does not emit "complete" event if form has no defined next step', function () {
            delete form.options.next;
            form.get(req, res, cb);
            form.emit.withArgs('complete').should.not.have.been.called;
        });

    });

    describe('post', function () {

        var form, req, res, cb;
        var validators = Form.validators;

        beforeEach(function () {
            cb = sinon.stub();
            form = new Form({
                template: 'index',
                next: 'success',
                fields: {
                    field: { formatter: 'uppercase', validate: 'required' },
                    email: { validate: ['required', 'email'] },
                    name: { validate: ['required', { type: 'minlength', arguments: [10] }, { type: 'maxlength', arguments: 20 }] },
                    bool: { formatter: 'boolean' },
                    options: { options: [ 'one', { value: 'two' }, 'three' ] }
                }
            });
            req = request({
                flash: sinon.stub(),
                body: {
                    field: 'value',
                    name: 'Joe Smith',
                    email: 'test@example.com',
                    bool: 'true'
                }
            });
            res = {};
            sinon.stub(Form.prototype, 'validate').yields(null);
            sinon.stub(Form.prototype, 'setErrors');
            sinon.stub(Form.prototype, 'saveValues').yields(null);
            sinon.stub(Form.prototype, 'successHandler');
            _.each(validators, function (fn, key) {
                sinon.stub(validators, key).returns(true);
            });
        });

        afterEach(function () {
            Form.prototype.validate.restore();
            Form.prototype.setErrors.restore();
            Form.prototype.saveValues.restore();
            Form.prototype.successHandler.restore();
            _.each(validators, function (fn, key) {
                validators[key].restore();
            });
        });

        it('writes field values to req.form.values', function () {
            form.post(req, res, cb);
            req.form.values.should.have.keys([
                'field',
                'email',
                'name',
                'bool',
                'options'
            ]);
        });

        it('sets errors to null', function () {
            form.post(req, res, cb);
            form.setErrors.should.have.been.calledWithExactly(null, req, res);
        });

        it('call callback with error if _process fails', function () {
            var cb = sinon.stub();
            sinon.stub(form, '_process').yields('error');
            form.post(req, res, cb);
            cb.should.have.been.calledOnce;
            cb.should.have.been.calledWith('error');
        });

        it('formats posted values according to `fields` option', function () {
            form.post(req, res, cb);
            req.form.values.field.should.equal('VALUE');
            req.form.values.bool.should.equal(true);
        });

        it('validates the fields', function () {
            form.post(req, res, cb);
            validators.required.should.have.been.calledWith('VALUE');
        });

        it('validates fields with multiple validators defined', function () {
            form.post(req, res, cb);
            validators.required.should.have.been.calledWith('test@example.com');
            validators.email.should.have.been.calledWith('test@example.com');
        });

        it('validates fields with parameterised validators defined', function () {
            req.body = {
                name: '  John Smith  '
            };
            form.post(req, res, cb);
            validators.required.should.have.been.calledWith('John Smith');
            validators.minlength.should.have.been.calledWith('John Smith', 10);
        });

        it('validates fields with parameterised validators defined as single values', function () {
            req.body = {
                name: 'A name longer than twenty characters'
            };
            form.post(req, res, cb);
            validators.maxlength.should.have.been.calledWith('A name longer than twenty characters', 20);
        });

        it('adds an equality validator if field has options defined', function () {
            req.body = {
                options: 'number'
            };
            form.post(req, res, cb);
            validators.equal.should.have.been.calledOnce;
            validators.equal.should.have.been.calledWith('number', 'one', 'two', 'three');
        });

        it('calls out to form.validate', function () {
            form.post(req, res, cb);
            form.validate.should.have.been.calledWith(req, res);
            form.validate.should.have.been.calledOn(form);
        });

        describe('valid inputs', function () {

            it('calls form.saveValues', function () {
                form.post(req, res, cb);
                form.saveValues.should.have.been.calledWith(req, res);
                form.saveValues.should.have.been.calledOn(form);
            });

            it('calls form.successHandler if saved successfully', function () {
                form.post(req, res, cb);
                form.successHandler.should.have.been.calledWith(req, res);
                form.successHandler.should.have.been.calledOn(form);
            });

            it('calls callback if not saved successfully', function () {
                form.saveValues.yields({ error: true });
                form.post(req, res, cb);
                cb.should.have.been.calledWith({ error: true });
            });

        });

        describe('invalid inputs', function () {

            it('calls callback with validation errors matching failed validation type', function () {
                validators.email.returns(false);
                req.body.email = 'foo';
                form.post(req, res, cb);
                cb.should.have.been.calledOnce;
                Object.keys(cb.args[0][0]).should.eql(['email']);
                _.each(cb.args[0][0], function (err, key) {
                    err.type.should.equal('email');
                    err.key.should.equal(key);
                });
            });

            it('does not continue validating if field validation fails', function () {
                validators.required.returns(false);
                form.post(req, res, cb);
                cb.should.have.been.called;
                form.validate.should.not.have.been.called;
            });

            it('validation of a field stops at the first error', function () {
                validators.required.withArgs('test@example.com').returns(false);
                form.post(req, res, cb);
                cb.should.have.been.calledOnce;
                Object.keys(cb.args[0][0]).should.eql(['email']);
                _.each(cb.args[0][0], function (err, key) {
                    err.type.should.equal('required');
                    err.key.should.equal(key);
                });
                validators.email.should.not.have.been.called;
            });

            it('all fields are validated', function () {
                validators.required.returns(false);
                req.body = { field: 'value', email: 'foo', name: 'John' };
                form.post(req, res, cb);
                cb.should.have.been.calledOnce;
                Object.keys(cb.args[0][0]).should.eql(['field', 'email', 'name']);
                _.each(cb.args[0][0], function (err, key) {
                    err.type.should.equal('required');
                    err.key.should.equal(key);
                });
                validators.email.should.not.have.been.called;
            });

        });

        describe('invalid form-level validation', function () {

            beforeEach(function () {
                Form.prototype.validate.yields({ field: 'invalid' });
            });

            it('calls callback with validation errors', function () {
                form.post(req, res, cb);
                cb.should.have.been.calledWith({ field: 'invalid' });
            });

        });

    });

    describe('render', function () {

        var form, req, res, cb;

        beforeEach(function () {
            form = new Form({
                template: 'index',
                next: '/next',
                fields: {
                    field: 'name'
                }
            });
            res = {
                render: sinon.stub()
            };
            cb = sinon.stub();
        });

        it('renders the provided template', function () {
            form.render(req, res, cb);
            res.render.should.have.been.calledWith('index');
        });

    });

    describe('successHandler', function () {

        var form, req, res;

        beforeEach(function () {
            form = new Form({ template: 'index', next: 'success' });
            req = request({
                params: {},
                body: { field: 'value' },
                flash: sinon.stub()
            });
            res = {
                redirect: sinon.stub()
            };
        });

        it('redirects to `next` page', function () {
            form.successHandler(req, res);
            res.redirect.should.have.been.calledWith('success');
        });

        it('prefixes redirect url with req.baseUrl', function () {
            req.baseUrl = 'base/';
            form.successHandler(req, res);
            res.redirect.should.have.been.calledWith('base/success');
        });

        it('emits "complete" event', function () {
            form.successHandler(req, res);
            form.emit.withArgs('complete').should.have.been.calledOnce;
            form.emit.withArgs('complete').should.have.been.calledOn(form);
            form.emit.should.have.been.calledWithExactly('complete', req, res);
        });

    });

    describe('errorHandler', function () {

        var form, req, res, err;

        beforeEach(function () {
            err = new Form.Error('field');
            form = new Form({ template: 'index', next: 'success' });
            req = request({
                path: '/index',
                form: {
                    values: { field: 'value' }
                }
            });
            res = {
                redirect: sinon.stub()
            };
        });

        it('redirects to req.path if no redirecting error is defined', function () {
            form = new Form({ template: 'index' });
            form.errorHandler({ field: err }, req, res);
            res.redirect.should.have.been.calledWith('/index');
        });

        it('redirects to error redirect if any error has a redirect property', function () {
            err.redirect = '/exitpage';
            form.errorHandler({ field: err }, req, res);
            res.redirect.should.have.been.calledWith('/exitpage');
        });

        it('prefixes redirect with req.baseUrl if it is defined', function () {
            req.baseUrl = '/foo';
            form.errorHandler({ field: err }, req, res);
            res.redirect.should.have.been.calledWith('/foo/index');
        });

        it('calls callback if error is not a validation error', function () {
            var cb = sinon.stub();
            var err = new Error('message');
            form.errorHandler(err, req, res, cb);
            cb.should.have.been.calledOnce;
            cb.should.have.been.calledWith(err);
        });

    });

    describe('_validate', function () {

        describe('sharing of errors defined with validator groups', function () {

            var form;
            beforeEach(function () {
                form = new Form({
                    template: 'index',
                    next: 'error',
                    fields: {
                        'is-thing-a': {
                            validate: [
                                { 'type': 'required', 'group': 'is-thing' }
                            ]
                        },
                        'is-thing-b': {
                            validate: [
                                { 'type': 'required', 'group': 'is-thing' }
                            ]
                        },
                        'is-thing-c': {
                            validate: [
                                { 'type': 'required' }
                            ]
                        }
                    }
                });
            });

            it('should *only* place errors against a single error key if the validator that created them belongs to a group', function () {
                var req = request({
                    flash: sinon.stub(),
                    form: {
                        values: {
                            'is-thing-a': '',
                            'is-thing-b': '',
                            'is-thing-c': ''
                        }
                    }
                }), res = {};
                var cb = sinon.stub();

                form._validate(req, res, cb);
                cb.should.be.calledWith({
                    'is-thing': new form.Error('is-thing', { 'type': 'required' }),
                    'is-thing-c': new form.Error('is-thing-c', { 'type': 'required' })
                });
            });

        });

        describe('dependent fields', function () {

            var form, oldFormatters;
            beforeEach(function () {
                oldFormatters = _.clone(Form.formatters);
                Form.formatters = _.extend(Form.formatters, {
                    'boolean-force': function booleanforce(value) {
                        var state;
                        if (value === true || value === 'true') {
                            state = true;
                        } else if (value === false || value === 'false') {
                            state = false;
                        } else {
                            state = undefined;
                        }

                        return !!state;
                    }
                });
                form = new Form({
                    template: 'index',
                    next: 'error',
                    fields: {
                        'is-thing': {
                            formatter: 'boolean-force',
                            validate: [
                                'required'
                            ]
                        },
                        'is-thing-b': {
                            formatter: 'boolean-force',
                            validate: [
                                'required'
                            ],
                            dependent: {
                                field: 'is-thing',
                                value: 'true'
                            }
                        },
                        'is-thing-notes': {
                            validate: [
                                'required'
                            ],
                            dependent: {
                                field: 'is-thing',
                                value: 'true'
                            }
                        }
                    }
                });
            });

            afterEach(function () {
                Form.formatters = oldFormatters;
            });

            it('should clean the values with an appropriately formatted empty value if a dependency is not met', function () {
                var req = request({
                    flash: sinon.stub(),
                    form: {
                        values: {
                            // Some preformatted booleans come in.
                            'is-thing': false,
                            'is-thing-b': true,
                            'is-thing-notes': 'some notes'
                        }
                    }
                }), res = {};
                var cb = sinon.stub();

                form._validate(req, res, cb);
                cb.should.not.be.calledWithMatch({});

                // Notice how the string which misses its dependency is
                // formatted to an empty string, while the boolean-force formatted
                // field that can only equal true or false becomes false.
                req.form.values.should.eql({
                    'is-thing': false,
                    'is-thing-b': false,
                    'is-thing-notes': ''
                });
            });

        });

    });

});

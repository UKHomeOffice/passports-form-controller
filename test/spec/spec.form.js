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

    it('doesn\'t throw if template is undefined', function () {
        var fn = function () {
            return new Form({});
        };
        fn.should.not.throw();
    });

    it('throws if options are undefined', function () {
        var fn = function () {
            return new Form();
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
            form = new Form({
                template: 'index'
            });
            sinon.stub(form, 'get').yields();
            sinon.stub(form, 'post').yields();
            sinon.stub(form, 'configure').yields();
            sinon.stub(form, 'middlewareMixins').returns();
            // use a spy instead of a stub so that the length is unaffected
            sinon.spy(form, 'errorHandler');
            req = request({
                url: '/test',
                params: {}
            }),
            res = {
                send: sinon.stub()
            };
            cb = function callback() {};
        });

        it('returns a function', function () {
            form.requestHandler().should.be.a('function');
        });

        describe('returned function', function () {

            it('calls form.configure', function () {
                handler = form.requestHandler();
                handler(req, res, cb);
                form.configure.should.have.been.calledWith(req, res, sinon.match.func);
                form.configure.should.have.been.calledOn(form);
            });

            it('calls form.middlewareMixins', function () {
                handler = form.requestHandler();
                handler(req, res, cb);
                form.middlewareMixins.should.have.been.called;
                form.middlewareMixins.should.have.been.calledOn(form);
            });

            it('calls form.get in response to get requests', function () {
                req.method = 'GET';
                handler = form.requestHandler();
                handler(req, res, cb);
                form.get.should.have.been.calledWith(req, res, sinon.match.func);
                form.get.should.have.been.calledOn(form);
            });

            it('calls form.post in response to post requests', function () {
                req.method = 'POST';
                handler = form.requestHandler();
                handler(req, res, cb);
                form.post.should.have.been.calledWith(req, res, sinon.match.func);
                form.post.should.have.been.calledOn(form);
            });

            it('calls error handler if method calls back with an error', function (done) {
                req.method = 'POST';
                form.post.yields({ error: 'message' });
                handler = form.requestHandler();
                handler(req, res, function () {
                    form.errorHandler.should.have.been.calledOnce;
                    form.errorHandler.should.have.been.calledWith({ error: 'message' }, req, res);
                    form.errorHandler.should.have.been.calledOn(form);
                    done();
                });
            });

            it('calls middleware mixins after configure and before invoking request handlers', function (done) {
                var middleware = sinon.stub().yields();
                form.middlewareMixins = function middlewareMixins() {
                    form.use(middleware);
                };
                req.method = 'GET';
                handler = form.requestHandler();
                handler(req, res, function () {
                    middleware.should.have.been.calledWith(req, res, sinon.match.func);
                    middleware.should.have.been.calledAfter(form.configure);
                    middleware.should.have.been.calledBefore(form.get);
                    done();
                });
            });

            it('calls any additional middlewares before invoking request handlers', function (done) {
                var middleware = sinon.stub().yields();
                req.method = 'GET';
                form.use(middleware);
                handler = form.requestHandler();
                handler(req, res, function () {
                    middleware.should.have.been.calledWith(req, res);
                    middleware.should.have.been.calledBefore(form.get);
                    done();
                });
            });

            it('keeps url params from parent routers', function (done) {
                req.method = 'GET';
                req.url = '/test/123';
                var router = require('express').Router();
                form.use(function (req, res, next) {
                    try {
                        req.params.id.should.equal('123');
                        next();
                    } catch (e) {
                        done(e);
                    }
                });
                router.route('/test/:id').all(form.requestHandler());
                router(req, res, done);
            });

            it('throws a 405 on unsupported methods', function (done) {
                req.method = 'PUT';
                handler = form.requestHandler();
                handler(req, res, function (err) {
                    err.statusCode.should.equal(405);
                    done();
                });
            });

        });

    });

    describe('get', function () {
        var form, req, res, cb;

        beforeEach(function () {
            cb = sinon.stub();
            form = new Form({
                template: 'index'
            });
            req = request({
                flash: sinon.stub(),
                method: 'GET'
            });
            res = {};
            sinon.stub(Form.prototype, '_getErrors').yields(null);
            sinon.stub(Form.prototype, '_getValues').yields(null);
            sinon.stub(Form.prototype, '_locals').yields(null);
            sinon.stub(Form.prototype, '_checkStatus').yields(null);
            sinon.stub(Form.prototype, 'render').yields(null);
        });

        afterEach(function () {
            Form.prototype._getErrors.restore();
            Form.prototype._getValues.restore();
            Form.prototype._locals.restore();
            Form.prototype._checkStatus.restore();
            Form.prototype.render.restore();
        });

        it('calls _getErrors', function () {
            form.get(req, res, cb);
            form._getErrors.should.have.been.called.and.calledWith(req, res, sinon.match.func);
        });

        it('calls _getValues', function () {
            form.get(req, res, cb);
            form._getValues.should.have.been.called.and.calledWith(req, res, sinon.match.func);
        });

        it('calls _locals', function () {
            form.get(req, res, cb);
            form._locals.should.have.been.called.and.calledWith(req, res, sinon.match.func);
        });

        it('calls _checkStatus', function () {
            form.get(req, res, cb);
            form._checkStatus.should.have.been.called.and.calledWith(req, res, sinon.match.func);
        });

        it('calls render', function () {
            form.get(req, res, cb);
            form.render.should.have.been.called.and.calledWith(req, res, sinon.match.func);
        });

    });

    describe('GET request', function () {

        var form, req, res, cb, getRequest;

        beforeEach(function () {
            form = new Form({
                template: 'index',
                next: '/next',
                fields: {
                    field: 'name'
                }
            });
            req = request({
                path: '/index',
                baseUrl: '/base',
                method: 'GET'
            });
            res = {
                render: sinon.stub(),
                locals: {}
            };
            cb = sinon.stub();
            sinon.stub(Form.prototype, 'getValues').yields(null, {});
            sinon.stub(Form.prototype, 'getErrors').returns({});
            sinon.stub(Form.prototype, 'render');
            sinon.stub(Form.prototype, 'errorHandler').yields(null);
            getRequest = form.requestHandler();
        });

        afterEach(function () {
            Form.prototype.getValues.restore();
            Form.prototype.getErrors.restore();
            Form.prototype.render.restore();
            Form.prototype.errorHandler.restore();
        });

        it('calls form.getValues', function () {
            getRequest(req, res, cb);
            form.getValues.should.have.been.calledWith(req, res, sinon.match.func);
            form.getValues.should.have.been.calledOn(form);
        });

        it('sets values to req.form.values', function () {
            Form.prototype.getValues.yields(null, { foo: 'bar' });
            getRequest(req, res, cb);
            req.form.values.should.eql({ foo: 'bar' });
        });

        it('defaults req.form.values to an empty object', function () {
            Form.prototype.getValues.yields(null);
            getRequest(req, res, cb);
            req.form.values.should.eql({ });
        });

        it('calls form.render', function () {
            getRequest(req, res, cb);
            form.render.should.have.been.calledOnce;
            form.render.should.have.been.calledWith(req, res);
        });

        it('passes any errors to the rendered template', function () {
            form.getErrors.returns({ field: { message: 'error' } });
            getRequest(req, res, cb);
            res.locals.errors.should.eql({ field: { message: 'error' } });
        });

        it('passes output of getValues to the rendered template', function () {
            form.getValues.yields(null, { values: [1] });
            getRequest(req, res, cb);
            res.locals.values.should.eql({ values: [1] });
        });

        it('calls errorHandler if getValues fails', function () {
            form.getValues.yields({ error: 'message' });
            getRequest(req, res, cb);
            form.errorHandler.should.have.been.calledOnce;
            form.errorHandler.should.have.been.calledWith({ error: 'message' }, req, res);
        });

        it('includes form options in rendered response', function () {
            getRequest(req, res, cb);
            res.locals.options.should.eql(form.options);
        });

        it('includes dynamic form options in rendered response', function () {
            form.configure = function configure(req, res, next) {
                req.form.options.fields['field'] = 'updated';
                req.form.options.fields['another-field'] = 'new';
                next();
            };
            getRequest = form.requestHandler();
            getRequest(req, res, cb);
            res.locals.options.fields['field'].should.eql('updated');
            res.locals.options.fields['another-field'].should.eql('new');
        });

        it('emits "complete" event if form has no fields', function () {
            form.options.fields = {};
            getRequest(req, res, cb);
            form.emit.withArgs('complete').should.have.been.calledOnce;
            form.emit.withArgs('complete').should.have.been.calledOn(form);
            form.emit.should.have.been.calledWithExactly('complete', req, res);
        });

        it('does not emit "complete" event if form has fields', function () {
            form = new Form({
                template: 'index',
                fields: { key: {} }
            });
            getRequest = form.requestHandler();
            getRequest(req, res, cb);
            form.emit.withArgs('complete').should.not.have.been.called;
        });

        it('does not emit "complete" event if form has dynamic fields on the request object', function () {
            form.configure = function configure(req, res, next) {
                req.form.options.fields.name = {
                    mixin: 'input-text',
                    validate: 'required'
                };
                next();
            };
            form.options.fields = {};
            getRequest = form.requestHandler();
            getRequest(req, res, cb);
            form.emit.withArgs('complete').should.not.have.been.called;
        });

        it('does not emit "complete" event if form has no defined next step', function () {
            delete form.options.next;
            getRequest(req, res, cb);
            form.emit.withArgs('complete').should.not.have.been.called;
        });

        it('sets the action property on res.locals', function () {
            getRequest(req, res, cb);
            res.locals.action.should.equal('/base/index');

            req.baseUrl = '/';
            getRequest(req, res, cb);
            res.locals.action.should.equal('/index');
        });

    });

    describe('post', function () {
        var form, req, res, cb;

        beforeEach(function () {
            cb = sinon.stub();
            form = new Form({
                template: 'index'
            });
            req = request({
                flash: sinon.stub(),
                method: 'POST'
            });
            res = {};
            sinon.stub(Form.prototype, 'setErrors');
            sinon.stub(Form.prototype, '_process').yields(null);
            sinon.stub(Form.prototype, '_validate').yields(null);
            sinon.stub(Form.prototype, 'saveValues').yields(null);
            sinon.stub(Form.prototype, 'successHandler');
        });

        afterEach(function () {
            Form.prototype.setErrors.restore();
            Form.prototype._process.restore();
            Form.prototype._validate.restore();
            Form.prototype.saveValues.restore();
            Form.prototype.successHandler.restore();
        });

        it('calls setErrors', function () {
            form.post(req, res, cb);
            form.setErrors.should.have.been.called.and.calledWith(null, req, res);
        });

        it('calls _process', function () {
            form.post(req, res, cb);
            form._process.should.have.been.called.and.calledWith(req, res, sinon.match.func);
        });

        it('calls _validate', function () {
            form.post(req, res, cb);
            form._validate.should.have.been.called.and.calledWith(req, res, sinon.match.func);
        });

        it('calls saveValues', function () {
            form.post(req, res, cb);
            form.saveValues.should.have.been.called.and.calledWith(req, res, sinon.match.func);
        });

        it('calls successHandler', function () {
            form.post(req, res, cb);
            form.successHandler.should.have.been.called.and.calledWith(req, res);
        });

    });

    describe('POST request', function () {

        var form, req, res, cb, postRequest;
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
                    place: { validate: 'required' },
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
                },
                method: 'POST'
            });
            res = {};
            sinon.stub(Form.prototype, 'validate').yields(null);
            sinon.stub(Form.prototype, 'setErrors');
            sinon.stub(Form.prototype, 'saveValues').yields(null);
            sinon.stub(Form.prototype, 'successHandler');
            sinon.stub(Form.prototype, 'errorHandler').yields(null);
            _.each(validators, function (fn, key) {
                sinon.stub(validators, key).returns(true);
            });
            postRequest = form.requestHandler();
        });

        afterEach(function () {
            Form.prototype.validate.restore();
            Form.prototype.setErrors.restore();
            Form.prototype.saveValues.restore();
            Form.prototype.successHandler.restore();
            Form.prototype.errorHandler.restore();
            _.each(validators, function (fn, key) {
                validators[key].restore();
            });
        });

        it('calls errorHandler if an unknown validator is specified', function () {
            var form = new Form({
                template: 'index',
                fields: {
                    field: { validate: 'unknown' }
                }
            });
            postRequest = form.requestHandler();
            postRequest(req, res, cb);
            form.errorHandler.should.have.been.calledWith(new Error('Undefined validator:unknown'), req, res);
        });

        it('ignores an unknown formatter', function () {
            var form = new Form({
                template: 'index',
                fields: {
                    field: { formatter: 'unknown' }
                }
            });
            postRequest = form.requestHandler();
            var fn = function () {
                postRequest(req, res, cb);
            };
            fn.should.not.throw();
        });

        it('applies formatter to array of values', function () {
            var form = new Form({
                template: 'index',
                fields: {
                    field: { formatter: 'uppercase' }
                }
            });
            postRequest = form.requestHandler();
            req.body.field = ['value', 'another value'];
            postRequest(req, res, cb);
            req.form.values.field.should.be.eql(['VALUE', 'ANOTHER VALUE']);
        });

        it('writes field values to req.form.values', function () {
            postRequest(req, res, cb);
            req.form.values.should.have.keys([
                'field',
                'email',
                'name',
                'place',
                'bool',
                'options'
            ]);
        });

        it('sets errors to null', function () {
            postRequest(req, res, cb);
            form.setErrors.should.have.been.calledWithExactly(null, req, res);
        });

        it('calls errorHandler with error if _process fails', function () {
            sinon.stub(form, '_process').yields({ error: true });
            postRequest(req, res, cb);
            form.errorHandler.should.have.been.calledOnce;
            form.errorHandler.should.have.been.calledWith({ error: true }, req, res);
            form.errorHandler.should.have.been.calledOn(form);
        });

        it('formats posted values according to `fields` option', function () {
            postRequest(req, res, cb);
            req.form.values.field.should.equal('VALUE');
            req.form.values.bool.should.equal(true);
        });

        it('creates a validate array when validate is a string or field options exist', function () {
            postRequest(req, res, cb);
            expect(req.form.options.fields.bool.validate).to.be.undefined;
            req.form.options.fields.place.validate.should.eql(['required']);
            req.form.options.fields.options.validate.length.should.equal(1);
        });

        it('validates the fields', function () {
            postRequest(req, res, cb);
            validators.required.should.have.been.calledWith('VALUE');
        });

        it('validates fields with multiple validators defined', function () {
            postRequest(req, res, cb);
            validators.required.should.have.been.calledWith('test@example.com');
            validators.email.should.have.been.calledWith('test@example.com');
        });

        it('validates fields with parameterised validators defined', function () {
            req.body = {
                name: '  John Smith  '
            };
            postRequest(req, res, cb);
            validators.required.should.have.been.calledWith('John Smith');
            validators.minlength.should.have.been.calledWith('John Smith', 10);
        });

        it('validates fields with parameterised validators defined as single values', function () {
            req.body = {
                name: 'A name longer than twenty characters'
            };
            postRequest(req, res, cb);
            validators.maxlength.should.have.been.calledWith('A name longer than twenty characters', 20);
        });

        it('adds an equality validator if field has options defined', function () {
            req.body = {
                options: 'number'
            };
            postRequest(req, res, cb);
            validators.equal.should.have.been.calledWith('number', 'one', 'two', 'three');
        });

        it('calls out to form.validate', function () {
            postRequest(req, res, cb);
            form.validate.should.have.been.calledWith(req, res);
            form.validate.should.have.been.calledOn(form);
        });

        describe('valid inputs', function () {

            it('calls form.saveValues', function () {
                postRequest(req, res, cb);
                form.saveValues.should.have.been.calledWith(req, res);
                form.saveValues.should.have.been.calledOn(form);
            });

            it('calls form.successHandler if saved successfully', function () {
                postRequest(req, res, cb);
                form.successHandler.should.have.been.calledWith(req, res);
                form.successHandler.should.have.been.calledOn(form);
            });

            it('calls errorHandler if not saved successfully', function () {
                var form = new Form({
                    template: 'index'
                });
                form.saveValues.yields({ error: true });
                postRequest = form.requestHandler();
                postRequest(req, res, cb);
                form.errorHandler.should.have.been.calledOnce;
                form.errorHandler.should.have.been.calledWith({ error: true }, req, res);
                form.errorHandler.should.have.been.calledOn(form);
            });

        });

        describe('invalid inputs', function () {

            it('calls errorHandler with validation errors matching failed validation type', function () {
                req.body.field = '';
                validators.email.returns(false);
                postRequest(req, res, cb);
                form.errorHandler.should.have.been.calledOnce;
                Object.keys(form.errorHandler.args[0][0]).should.eql(['email']);
                _.each(form.errorHandler.args[0][0], function (err, key) {
                    err.type.should.equal('email');
                    err.key.should.equal(key);
                });
            });

            it('does not continue validating if field validation fails', function () {
                validators.required.returns(false);
                postRequest(req, res, cb);
                form.errorHandler.should.have.been.called;
                form.validate.should.not.have.been.called;
            });

            it('validation of a field stops at the first error', function () {
                validators.required.withArgs('test@example.com').returns(false);
                postRequest(req, res, cb);
                form.errorHandler.should.have.been.calledOnce;
                Object.keys(form.errorHandler.args[0][0]).should.eql(['email']);
                _.each(form.errorHandler.args[0][0], function (err, key) {
                    err.type.should.equal('required');
                    err.key.should.equal(key);
                });
                validators.email.should.not.have.been.called;
            });

            it('all fields are validated', function () {
                validators.required.returns(false);
                req.body = { field: 'value', email: 'foo', name: 'John' };
                postRequest(req, res, cb);
                form.errorHandler.should.have.been.calledOnce;
                Object.keys(form.errorHandler.args[0][0]).should.eql(['field', 'email', 'name', 'place']);
                _.each(form.errorHandler.args[0][0], function (err, key) {
                    err.type.should.equal('required');
                    err.key.should.equal(key);
                });
                validators.email.should.not.have.been.called;
            });

            it('creates instances of Error class with validation errors', function (done) {
                validators.required.returns(false);
                req.body = { field: 'value', email: 'foo', name: 'John' };
                postRequest(req, res, function (err) {
                    _.each(err, function (e) {
                        e.should.be.an.instanceOf(form.Error);
                    });
                    done();
                });
            });

            it('passes request and response objects into error constructor', function (done) {
                sinon.stub(form, 'Error');
                validators.required.returns(false);
                req.body = { field: 'value', email: 'foo', name: 'John' };
                postRequest(req, res, function () {
                    form.Error.should.have.been.calledWithExactly('field', sinon.match({ type: 'required' }), req, res);
                    form.Error.should.have.been.calledWithExactly('email', sinon.match({ type: 'required' }), req, res);
                    form.Error.should.have.been.calledWithExactly('name', sinon.match({ type: 'required' }), req, res);
                    done();
                });
            });

        });

        describe('invalid form-level validation', function () {

            beforeEach(function () {
                Form.prototype.validate.yields({ field: 'invalid' });
            });

            it('calls errorHandler with validation errors', function () {
                postRequest(req, res, cb);
                form.errorHandler.should.have.been.calledWith({ field: 'invalid' });
            });

        });

    });

    describe('_configure', function () {

        var form, req, res, cb, handler;

        beforeEach(function () {
            form = new Form({
                template: 'index',
                next: '/next',
                fields: {
                    field: 'name'
                }
            });
            req = request({
                path: '/index',
                baseUrl: '/base'
            });
            res = {
                render: sinon.stub(),
                locals: {}
            };
            cb = function callback() {};
            sinon.spy(form, '_configure');
            sinon.stub(form, 'configure').yields();
            sinon.spy(form, 'use');
            handler = form.router.get('*', function (req, res, callback) {
                callback();
            });
        });

        it('is called as part of the form.requestHandler', function () {
            handler = form.requestHandler();
            handler(req, res, cb);
            form._configure.should.have.been.calledOnce;
        });

        it('calls form.use to add router middleware', function () {
            form._configure();
            form.use.should.have.been.calledOnce;
        });

        it('adds middleware that calls through to form.configure', function () {
            form._configure();
            handler(req, res, cb);
            form.configure.should.have.been.calledOnce.and.calledWith(req, res, sinon.match.func);
        });

        it('adds middleware that writes form options to `req.form.options`', function () {
            form._configure();
            handler(req, res, cb);
            req.form.options.should.deep.equal(form.options);
        });

        it('adds middleware that clones form options to `req.form.options` to avoid config mutation', function () {
            form._configure();
            handler(req, res, cb);
            req.form.options.should.not.equal(form.options);
        });

        it('adds middleware that performs a deep clone of form options', function () {
            form.configure = sinon.spy(function (req, res, next) {
                req.form.options.fields.field = 'mutated';
                next();
            });
            form._configure();
            handler(req, res, cb);
            req.form.options.fields.field.should.equal('mutated');
            form.options.fields.field.should.equal('name');
        });

    });

    describe('_checkStatus', function () {

        var form, req, res, cb;

        beforeEach(function () {
            form = new Form({
                template: 'index'
            });
            req = request({
                form: {
                    options: {
                        next: '/next',
                        fields: {}
                    }
                }
            });
            res = {};
            cb = function callback() {};
            sinon.spy(form, '_checkStatus');
        });

        it('is called as part of `get` pipeline', function () {
            form.get(req, res, cb);
            form._checkStatus.should.have.been.calledOnce.and.calledWith(req, res);
        });

        it('emits "complete" event if fields are empty and next is set', function () {
            form._checkStatus(req, res, cb);
            form.emit.withArgs('complete').should.have.been.calledOnce;
            form.emit.withArgs('complete').should.have.been.calledOn(form);
            form.emit.should.have.been.calledWithExactly('complete', req, res);
        });

        it('does not emit "complete" event if fields exist', function () {
            req.form.options.fields = {
                field: 'name'
            };
            form._checkStatus(req, res, cb);
            form.emit.withArgs('complete').should.not.have.been.called;
        });

        it('does not emit "complete" event if next is not set', function () {
            req.form.options.next = null;
            form._checkStatus(req, res, cb);
            form.emit.withArgs('complete').should.not.have.been.called;
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
            req = {
                form: {
                    options: form.options
                }
            };
            res = {
                render: sinon.stub()
            };
            cb = sinon.stub();
        });

        it('renders the provided template', function () {
            form.render(req, res, cb);
            res.render.should.have.been.calledWith('index');
        });

        it('throws an error if no template provided', function () {
            var err = new Error('A template must be provided');
            req.form.options.template = undefined;
            form.render(req, res, cb);
            cb.should.have.been.calledOnce.and.calledWithExactly(err);
        });

    });

    describe('getNextStep', function () {
        var form, req, res;

        beforeEach(function () {
            form = new Form({ template: 'index', next: '/next-page' });
            req = request({
                params: {},
                body: { field: 'value' },
                flash: sinon.stub(),
                form: { options: form.options }
            });
            res = {
                redirect: sinon.stub()
            };
        });

        it('redirects to `next` page', function () {
            form.getNextStep(req, res).should.be.equal('/next-page');
        });

        it('prefixes redirect url with req.baseUrl', function () {
            req.baseUrl = '/base';
            form.getNextStep(req, res).should.be.equal('/base/next-page');
        });

        describe('with forks, and _getForkTarget returns /fork', function () {
            beforeEach(function () {
                sinon.stub(Form.prototype, '_getForkTarget').returns('/fork');
                req.form.options.forks = [];
            });

            afterEach(function () {
                Form.prototype._getForkTarget.restore();
            });

            it('calls _getForkTarget if forks are present', function () {
                form.getNextStep(req, res);
                Form.prototype._getForkTarget.should.have.been.calledOnce;
            });

            it('prefixes result of _getForkTarget with req.baseUrl if present', function () {
                req.baseUrl = '/base';
                form.getNextStep(req, res).should.be.equal('/base/fork');
            });

        });

    });

    describe('getForkTarget', function () {
        var form,
            req = {},
            res = {};

        beforeEach(function () {
            sinon.stub(Form.prototype, '_getForkTarget');
            form = new Form({ template: 'index', next: '/next-page' });
        });

        afterEach(function () {
            Form.prototype._getForkTarget.restore();
        });

        it('calls _getForkTarget with req and res', function () {
            form.getForkTarget(req, res);
            Form.prototype._getForkTarget.should.have.been.calledOnce
                .and.calledWithExactly(req, res);
        });
    });

    describe('_getForkTarget', function () {
        var form, req;

        beforeEach(function () {
            form = new Form({ template: 'index', next: '/next-page' });
            req = request({
                params: {},
                body: { field: 'value' },
                flash: sinon.stub(),
                form: { options: form.options }
            });
        });

        it('returns the fork target if the condition config is met', function () {
            req.form.values['example-radio'] = 'conditionMet';
            req.form.options.forks = [{
                target: '/target-page',
                condition: {
                    field: 'example-radio',
                    value: 'conditionMet'
                }
            }];
            form._getForkTarget(req, {}).should.contain('/target-page');
        });

        it('returns the original next target if the condition config is not met', function () {
            req.form.values['example-radio'] = 'conditionNotMet';
            req.form.options.forks = [{
                target: '/target-page',
                condition: {
                    field: 'example-radio',
                    value: 'conditionMet'
                }
            }];
            form._getForkTarget(req, {}).should.equal('/next-page');
        });

        it('returns the fork target if the condition function is met', function () {
            req.form.options.forks = [{
                target: '/target-page',
                condition: function () {
                    return true;
                }
            }];
            form._getForkTarget(req, {}).should.contain('/target-page');
        });

        it('returns the original next target if the condition function is not met', function () {
            req.form.options.forks = [{
                target: '/target-page',
                condition: function () {
                    return false;
                }
            }];
            form._getForkTarget(req, {}).should.equal('/next-page');
        });

        describe('with more than one fork', function () {

            describe('when the fields are the same', function () {

                beforeEach(function () {
                    req.form.values = {
                        'example-radio': 'condition-met'
                    };
                    req.form.options.forks = [{
                        target: '/target-page',
                        condition: {
                            field: 'example-radio',
                            value: 'condition-met'
                        }
                    }, {
                        target: '/target-page-2',
                        condition: {
                            field: 'example-radio',
                            value: 'condition-met'
                        }
                    }];
                });

                it('retuns the last forks\' target if each condition is met', function () {
                    form._getForkTarget(req, {}).should.contain('/target-page-2');
                });

            });

            describe('when the fields are different', function () {

                beforeEach(function () {
                    req.form.options.forks = [{
                        target: '/target-page',
                        condition: {
                            field: 'example-radio',
                            value: 'conditionMet'
                        }
                    }, {
                        target: '/target-page-2',
                        condition: {
                            field: 'example-email',
                            value: 'conditionMet'
                        }
                    }];
                });

                it('returns the last forks\' target if each condition is met', function () {
                    req.form.values = {
                        'example-radio': 'conditionMet',
                        'example-email': 'conditionMet'
                    };
                    form._getForkTarget(req, {}).should.contain('/target-page-2');
                });

            });

        });

    });

    describe('successHandler', function () {
        var form, req, res;
        beforeEach(function () {
            sinon.stub(Form.prototype, 'getNextStep');
            form = new Form({ template: 'index' });
            req = request({
                params: {},
                body: { field: 'value' },
                flash: sinon.stub()
            });
            res = {
                redirect: sinon.stub()
            };
        });

        afterEach(function () {
            Form.prototype.getNextStep.restore();
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
            form = new Form({ template: 'index', next: '/success' });
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

        it('redirects to req.path if not all errors have a redirect value', function () {
            err = {
                'field-a': new Form.Error('field-a'),
                'field-b': new Form.Error('field-b', { redirect: '/exitpage' })
            };
            form.errorHandler(err, req, res);
            res.redirect.should.have.been.calledWith('/index');
        });

        it('redirects to error redirect if all errors have a redirect value', function () {
            err.redirect = '/exitpage';
            form.errorHandler({ field: err }, req, res);
            res.redirect.should.have.been.calledWith('/exitpage');
        });

        it('prefixes redirect with req.baseUrl if it is defined', function () {
            req.baseUrl = '/foo';
            form.errorHandler({ field: err }, req, res);
            res.redirect.should.have.been.calledWith('/foo/index');
        });

        it('redirects to another site if defined', function () {
            err.redirect = 'http://www.gov.uk/';
            req.baseUrl = '/foo';
            form.errorHandler({ field: err }, req, res);
            res.redirect.should.have.been.calledWith('http://www.gov.uk/');
        });

        it('redirects to another secure site if defined', function () {
            err.redirect = 'https://www.gov.uk/';
            req.baseUrl = '/foo';
            form.errorHandler({ field: err }, req, res);
            res.redirect.should.have.been.calledWith('https://www.gov.uk/');
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

            var form, req, res, cb;
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
                req = request({
                    flash: sinon.stub(),
                    form: {
                        values: {
                            'is-thing-a': '',
                            'is-thing-b': '',
                            'is-thing-c': ''
                        },
                        options: form.options
                    }
                });
                res = {};
                cb = sinon.stub();
            });

            it('should *only* place errors against a single error key if the validator that created them belongs to a group', function () {
                form._validate(req, res, cb);
                cb.should.be.calledWith({
                    'is-thing': new form.Error('is-thing', { 'type': 'required' }),
                    'is-thing-c': new form.Error('is-thing-c', { 'type': 'required' })
                });
            });

        });

        describe('dependent fields', function () {

            var form, oldFormatters, req, res, cb;

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
                res = {};
                cb = sinon.stub();
            });

            afterEach(function () {
                Form.formatters = oldFormatters;
            });

            it('should clean the values with an appropriately formatted empty value if a dependency is not met', function () {
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
                            dependent: 'is-thing'
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
                req = request({
                    flash: sinon.stub(),
                    form: {
                        values: {
                            // Some preformatted booleans come in.
                            'is-thing': false,
                            'is-thing-b': true,
                            'is-thing-notes': 'some notes'
                        },
                        options: form.options
                    }
                });
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

            it('should be validated if the dependency exists in the step\'s fields and the value matches', function () {
                form = new Form({
                    template: 'index',
                    fields: {
                        'is-thing': {
                            validate: [
                                'required'
                            ]
                        },
                        'is-thing-b': {
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

                req = request({
                    form: {
                        values: {
                            'is-thing': 'true',
                            'is-thing-b': ''
                        },
                        options: form.options
                    }
                });
                form._validate(req, res, cb);
                cb.should.have.been.calledWith({
                    'is-thing-b': new form.Error('is-thing-b', { type: 'required' })
                });
            });

            it('should be validated if the dependency doesn\'t exist in the step\'s fields', function () {
                form = new Form({
                    template: 'index',
                    fields: {
                        'is-thing': {
                            validate: [
                                'required'
                            ]
                        },
                        'is-thing-b': {
                            validate: [
                                'required'
                            ],
                            dependent: {
                                field: 'is-not-a-thing',
                                value: 'true'
                            }
                        }
                    }
                });

                req = request({
                    form: {
                        values: {
                            'is-thing': 'true',
                            'is-thing-b': ''
                        },
                        options: form.options
                    }
                });
                form._validate(req, res, cb);
                cb.should.have.been.calledWith({
                    'is-thing-b': new form.Error('is-thing-b', { type: 'required' })
                });
            });

            it('shouldn\'t be validated if the dependency exists but the value doesn\'t match', function () {
                form = new Form({
                    template: 'index',
                    fields: {
                        'is-thing': {
                            validate: [
                                'required'
                            ]
                        },
                        'is-thing-b': {
                            validate: [
                                'required'
                            ],
                            dependent: {
                                field: 'is-thing',
                                value: 'false'
                            }
                        }
                    }
                });

                req = request({
                    form: {
                        values: {
                            'is-thing': 'false',
                            'is-thing-b': ''
                        },
                        options: form.options
                    }
                });
                form._validate(req, res, cb);
                cb.should.have.been.calledWith();
            });

            describe('fields that are an array of values', function () {
                beforeEach(function () {
                    form = new Form({
                        template: 'index',
                        fields: {
                            'field': {},
                            'field-2': {
                                validate: [
                                    'required'
                                ],
                                dependent: {
                                    field: 'field',
                                    value: 2
                                }
                            }
                        }
                    });
                });

                it('should be validated if the dependency exists and is an array containing the value', function () {
                    req = request({
                        form: {
                            values: {
                                'field': [1, 2, 3],
                                'field-2': ''
                            },
                            options: form.options
                        }
                    });
                    form._validate(req, res, cb);
                    cb.should.have.been.calledWith({
                        'field-2': new form.Error('field-2', { type: 'required' })
                    });
                });

                it('shouldn\'t be validated if the dependency exists and is an array which doesn\'t contain the value', function () {
                    req = request({
                        form: {
                            values: {
                                'field': [1, 3, 4],
                                'field-2': ''
                            },
                            options: form.options
                        }
                    });
                    form._validate(req, res, cb);
                    cb.should.have.been.calledWith();
                });
            });

        });

        describe('validators with redirects', function () {

            var form, req, res, cb;

            beforeEach(function () {
                form = new Form({
                    template: 'index',
                    fields: {
                        'is-thing-a': {
                            validate: 'required'
                        },
                        'is-thing-b': {
                            validate: [
                                { type: 'required', redirect: '/exit-page' }
                            ]
                        },
                        'is-thing-c': {
                            validate: 'required'
                        }
                    }
                });
                res = {};
                cb = sinon.stub();
            });

            it('only calls callback with errors that don\'t have a redirect value if they exist', function () {
                req = request({
                    form: {
                        values: {
                            'is-thing-a': '',
                            'is-thing-b': '',
                            'is-thing-c': '',
                        }
                    }
                });
                form._validate(req, res, cb);
                cb.should.be.calledWith({
                    'is-thing-a': new form.Error('is-thing-a', { type: 'required' }),
                    'is-thing-c': new form.Error('is-thing-c', { type: 'required' })
                });
            });

            it('calls callback with all errors if they all contain a redirect value', function () {
                req = request({
                    form: {
                        values: {
                            'is-thing-a': 'value',
                            'is-thing-b': '',
                            'is-thing-c': 'value'
                        }
                    }
                });
                form._validate(req, res, cb);
                cb.should.have.been.calledWith({
                    'is-thing-b': new form.Error('is-thing-b', { type: 'required', redirect: '/exit-page' })
                });
            });

        });

    });

});

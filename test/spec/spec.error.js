var ErrorClass = require('../../lib/error');

describe('Error', function () {

    var req, res;

    beforeEach(function () {
        req = request({});
        res = {};
        sinon.stub(ErrorClass.prototype, 'getMessage').returns('Error');
    });

    afterEach(function () {
        ErrorClass.prototype.getMessage.restore();
    });

    it ('sets its key property to the key passed', function () {
        var err = new ErrorClass('field', { type: 'type' });
        err.key.should.equal('field');
    });

    it ('sets its key property to the type option passed', function () {
        var err = new ErrorClass('field', { type: 'type' });
        err.type.should.equal('type');
    });

    it('sets a default message', function () {
        var options = { type: 'type' };
        var err = new ErrorClass('field', options, req, res);
        err.message.should.equal('Error');
        ErrorClass.prototype.getMessage.should.have.been.calledWithExactly('field', options, req, res);
    });

    it('allows a custom message', function () {
        var err = new ErrorClass('field', { message: 'My message' });
        err.message.should.equal('My message');
    });

    it('allows a custom title', function () {
        var err = new ErrorClass('field', { title: 'My error title' });
        err.title.should.equal('My error title');
    });

    it('has a default title', function () {
        var err = new ErrorClass('field', {});
        err.title.should.exist;
    });

});

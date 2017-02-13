'use strict';

const ErrorClass = require('../../lib/base-error');

describe('Error', () => {

  let req;
  let res;

  beforeEach(() => {
    req = request({});
    res = {};
    sinon.stub(ErrorClass.prototype, 'getMessage').returns('Error');
  });

  afterEach(() => {
    ErrorClass.prototype.getMessage.restore();
  });

  it('sets its key property to the key passed', () => {
    const err = new ErrorClass('field', { type: 'type' });
    err.key.should.equal('field');
  });

  it('sets its key property to the type option passed', () => {
    const err = new ErrorClass('field', { type: 'type' });
    err.type.should.equal('type');
  });

  it('sets a default message', () => {
    const options = { type: 'type' };
    const err = new ErrorClass('field', options, req, res);
    err.message.should.equal('Error');
    ErrorClass.prototype.getMessage.should.have.been.calledWithExactly('field', options, req, res);
  });

  it('allows a custom message', () => {
    const err = new ErrorClass('field', { message: 'My message' });
    err.message.should.equal('My message');
  });

  it('allows a custom title', () => {
    const err = new ErrorClass('field', { title: 'My error title' });
    err.title.should.equal('My error title');
  });

  it('has a default title', () => {
    const err = new ErrorClass('field', {});
    err.title.should.exist;
  });

});

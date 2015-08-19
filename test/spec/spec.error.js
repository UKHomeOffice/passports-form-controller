var ErrorClass = require('../../lib/error');

var _ = require('underscore');

describe('Error', function () {

    it ('sets its key property to the key passed', function () {
        var err = new ErrorClass('field', { type: 'type' });
        err.key.should.equal('field');
    });

    it ('sets its key property to the type option passed', function () {
        var err = new ErrorClass('field', { type: 'type' });
        err.type.should.equal('type');
    });

});
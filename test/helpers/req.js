module.exports = function (req) {
    req.form = req.form || {};
    req.form.values = req.form.values || {};
    req.session = req.session || {};
    req.flash = req.flash || sinon.stub().returns([]);
    req.baseUrl = '';
    req.params = req.params || {};
    return req;

};
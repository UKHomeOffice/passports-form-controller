var csv = require('csv'),
    fs = require('fs'),
    path = require('path'),
    concat = require('concat-stream'),
    zlib = require('zlib');

var inputFile = path.resolve(path.dirname(require.resolve('postcode')), 'tests', 'data', 'postcodes.csv.gz');

var _postcodes = [];

var PostcodeLoader = {
    load: function (callback) {

        if (_postcodes.length) {
            return callback(null, _postcodes);
        }

        global.console.log('    Loading postcodes from %s', inputFile);
        var gunzip = zlib.createGunzip();
        fs.createReadStream(inputFile)
            .pipe(gunzip)
            .pipe(csv.parse())
            .pipe(concat(function (data) {
                global.console.log('    %d postcodes loaded', data.length);
                _postcodes = data;
                callback(null, data);
            }));
    }
};

module.exports = PostcodeLoader;

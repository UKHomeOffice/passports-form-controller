var csv = require('csv'),
    fs = require('fs'),
    path = require('path'),
    concat = require('concat-stream'),
    zlib = require('zlib');

var dataDir = '../../node_modules/postcode/tests/data';

var gunzip, input, output,
    inputFile = path.resolve(__dirname, dataDir, 'postcodes.csv.gz'),
    outputFile = path.resolve(__dirname, dataDir, 'postcodes.csv');

var _postcodes = [];

var PostcodeLoader = {
    load: function (callback) {

        function parseCsv() {
            fs.createReadStream(outputFile)
                .pipe(csv.parse())
                .pipe(concat(function (data) {
                    _postcodes = data;
                    callback(null, data);
                }));
        }

        if (_postcodes.length) {
            return callback(null, _postcodes);
        } else {
            gunzip = zlib.createGunzip();
            input = fs.createReadStream(inputFile);
            output = fs.createWriteStream(outputFile);
            input.pipe(gunzip).pipe(output);
            input.on('end', parseCsv);
        }

    },
    random: function (callback) {
        PostcodeLoader.load(function (err, data) {
            var index = Math.floor(Math.random() * data.length);
            callback(err, data[index][0]);
        });
    }
};

module.exports = PostcodeLoader;

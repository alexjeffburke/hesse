var childProcess = require('child_process');
var http = require('http');

var expect = require('unexpected');

describe('hesse', function () {
    expect = expect.clone();

    var basePath = __dirname + '/../';

    expect.addAssertion('<string> to have a running server', function (expect, subject) {
        return expect.promise(function (resolve, reject) {
            http.get(subject, function (response) {
                response.on('end', resolve);
                response.resume();
            }).on('error', reject).end();
        });
    });

    it('should successfully run', function () {
        var port = 50000;

        return expect.promise(function () {
            var testProcess = childProcess.execFile('node', [basePath + 'bin/hesse.js', '--port', port, '--', 'node', 'testdata/example.js']);
            var stderrString;

            var httpPromise = expect.promise(function (resolve, reject) {
                testProcess.stderr.once('data', function (d) {
                    stderrString = d.toString();

                    if (stderrString !== 'serving') {
                        return reject(new Error(stderrString))
                    }

                    expect('http://127.0.0.1:' + port, 'to have a running server').then(resolve).caught(reject);
                });
            });

            var exitPromise = expect.promise(function (run) {
                testProcess.on('exit', run(function (code) {
                    return expect(code, 'to equal', 0);
                }));
            });

            return expect.promise.all([httpPromise, exitPromise]);
        });
    });

    it('should print stdout output', function () {
        var port = 50000;

        return expect.promise(function () {
            var testProcess = childProcess.execFile('node', [basePath + 'bin/hesse.js', '--port', port, '--', 'node', __dirname + '/../testdata/example.js']);
            var outputBuffers = [];
            var stderrString;

            testProcess.stderr.once('data', function (d) {
                stderrString = d.toString();
            });

            testProcess.stdout.on('data', function (d) {
                outputBuffers.push(d);
            });

            return expect.promise(function (resolve, reject) {
                testProcess.on('exit', function (code) {
                    setImmediate(function () {
                        if (stderrString !== 'serving') {
                            return reject(new Error(stderrString));
                        }

                        var stdoutLines = outputBuffers.map(function (b) {
                            return b.toString();
                        });

                        expect(stdoutLines, 'to equal', [
                            'RAN!!\n'
                        ]).then(resolve).caught(reject);
                    });
                });
            });
        });
    });

    it('should exit with the exit code of the test binary', function () {
        var port = 50000;

        return expect.promise(function () {
            var testProcess = childProcess.execFile('node', [basePath + 'bin/hesse.js', '--port', port, '--', 'node', __dirname + '/../testdata/exit2.js']);

            return expect.promise(function (run) {
                testProcess.on('exit', run(function (code) {
                    return expect(code, 'to equal', 2);
                }));
            });
        });
    });
});

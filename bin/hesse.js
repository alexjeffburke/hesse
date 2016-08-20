#!/usr/bin/env node

var childProcess = require('child_process');
var http = require('http');

var ecstatic = require('ecstatic');
var minimist = require('minimist');

function _parseServerArgs(argv) {
    return minimist(argv.slice(2));
}

function processArgv(argv) {
    var execSeperator = argv.indexOf('--');

    if (execSeperator === -1) {
        throw new Error('No exec seperator specified.');
    }

    var serveArgs = argv.slice(0, execSeperator);
    var childArgs = argv.slice(execSeperator + 1);

    if (childArgs.length === 0) {
        throw new Error('No exec arguments specified.');
    }

    return {
        child: childArgs,
        serve: _parseServerArgs(serveArgs)
    };
}

function serveAndExec(args, callback) {
    var cwd = process.cwd();

    var serve = http.createServer(function (req, res) {
        ecstatic({ root: cwd })(req, res);
    });
    serve.listen(args.serve.port, function () {
        process.stderr.write('serving');

        setImmediate(function () {
            var childArgs = args.child;
            var testBin = childProcess.spawn(childArgs[0], childArgs.slice(1), {
                cwd: cwd
            });
            testBin.stdout.on('data', function (d) {
                process.stdout.write(d.toString());
            });
            testBin.stderr.on('data', function (d) {
                process.stderr.write(d.toString());
            });
            testBin.on('exit', function (code) {
                var err = (code > 0 ? new Error() : null);

                serve.on('close', function () {
                    callback(err, code);
                });

                serve.close();
            });
        });
    });
}

try {
    serveAndExec(processArgv(process.argv), function (err, code) {
        if (err) {
            console.error(err.message);
        }
        process.exitCode = code;
    });
} catch (e) {
    console.error(e.message);
    process.exitCode = 1;
}

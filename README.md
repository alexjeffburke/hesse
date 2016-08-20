hesse
=====

This is a small tool for node that allows spinning up a server an executing a
command while it is running. The server will be torn down when the command
finishes execution at which point hesse will exit with its status code.

The tool is intended as an aid for doing automated testing of code that
requires a real HTTP server to be running.

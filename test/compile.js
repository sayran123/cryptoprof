/**
 * This file contains tests for the compile function available in ../compile.js.
 */

const assert = require('assert');
const compile = require('../compile.js');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const solc = require('solc');

const consensysTokenPath = path.resolve(__dirname, 'contracts/consensys/EIP20.sol');

const warningRegex = /Warning:/;

describe('vanilla solc compilation', () => {
    it('fails when attempted on files with external imports', (done) => {
        const consensysToken = fs.readFileSync(consensysTokenPath).toString();
        const compilationResult = solc.compile(consensysToken);
        const nonWarningErrors = _.get(compilationResult, 'errors', []).filter(message => !warningRegex.test(message));
        assert(nonWarningErrors.length > 0);
        return done();
    });
});

describe('compile', () => {
    it('successfully compiles files with external imports', function runTest(done) {
        // Expanding imports and linking takes a long time
        this.timeout(10000);

        const compilationResult = compile(consensysTokenPath);
        const nonWarningErrors = _.get(compilationResult, 'errors', []).filter(message => !warningRegex.test(message));
        assert.strictEqual(nonWarningErrors.length, 0);
        return done();
    });
});

/**
 * This file contains tests for the utilities used in the profiling CLI defined in ../index.js
 */

const assert = require('assert');

const { parseContractSpec } = require('../index.js');

describe('parseContractSpec', () => {
    it('should extract a contractPath, selector, and arguments from a valid contract spec', () => {
        const validRawContractSpec = 'path:contract,arg1,arg2,arg3';
        const contractSpec = parseContractSpec(validRawContractSpec);
        const expectedSpec = {
            contractPath: 'path',
            selector: 'path:contract',
            args: ['arg1', 'arg2', 'arg3'],
        };
        assert.deepEqual(contractSpec, expectedSpec);
    });

    it('should extract a contractPath, selector, and an empty arguments array if no arguments are specified', () => {
        const validRawContractSpec = 'path:contract';
        const contractSpec = parseContractSpec(validRawContractSpec);
        const expectedSpec = {
            contractPath: 'path',
            selector: 'path:contract',
            args: [],
        };
        assert.deepEqual(contractSpec, expectedSpec);
    });
});

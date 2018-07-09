/**
 * This file contains tests for the ERC20 contract profiler available in ../erc20.js.
 */

const assert = require('assert');
const Ganache = require('ganache-core');
const _ = require('lodash');
const path = require('path');
const Web3 = require('web3');

const { deploy, contractMethodCalculator, profile } = require('../erc20.js');

// TEST_TIMEOUT - Environment variable for max timeout on individual mocha tests
// Default value 10000
// Must be positive integer if defined
// Error thrown if not
const testTimeout = parseInt(process.env.TEST_TIMEOUT || '10000', 10);
if (isNaN(testTimeout) || testTimeout<=0) {
    throw new Error(`TEST_TIMEOUT must be positive integer -- current value: TEST_TIMEOUT=${process.env.TEST_TIMEOUT}`);
}

/**
 * Sets up a web3 client and related objects for use in each test.
 * Does this by populating the `configuration` object, defined in the scope of each test case.
 *
 * NOTE:
 * ganache-core is used to simulate an Ethereum node. We use here the default settings, which
 * provide 10 unlocked accounts on the simulated node, each with 100 ETH available to them.
 * Changes to this default behaviour could break any tests which rely on this configuration.
 *
 * The fields that the `configuration` object gets populated with are:
 * 1. provider - Web3 provider that can be used to generate a Web3 client -- this is the Ganache
 * provider
 * 2. web3Client - Web3 client which makes use of the Ganache provider
 * 3. accountAddresses - List of addresses for the accounts available through the Web3 API
 * 4. unlockedAccounts - List of unlocked accounts
 *
 * @param {Object} configuration - Object which should be populated with test case fixtures
 */
function setUp(configuration) {
    /* eslint-disable no-param-reassign */
    configuration.provider = Ganache.provider();
    configuration.web3Client = new Web3(configuration.provider);
    configuration.unlockedAccounts = _.get(configuration.provider, [
        'manager',
        'state',
        'unlocked_accounts',
    ]);
    configuration.accountAddresses = Object.keys(configuration.unlockedAccounts);
    /* eslint-enable no-param-reassign */

    return configuration;
}

describe('Consensys ERC20 deployment', () => {
    const configuration = {};

    const contractPath = path.resolve(__dirname, './contracts/consensys/EIP20.sol');
    const selector = `${contractPath}:EIP20`;
    const args = [
        1200000,
        'Test ERC20 token',
        1,
        'TST',
    ];

    before(() => {
        setUp(configuration);
    });

    after(done => configuration.provider.close(done));

    it('should successfully deploy', function deploymentTest(done) {
        this.timeout(testTimeout);
        return deploy(
            configuration.web3Client,
            configuration.accountAddresses[0],
            {
                contractPath,
                selector,
                args,
            },
            (err, contractInstance, gasTracker) => {
                if (err) {
                    return done(err);
                }

                assert(contractInstance);
                assert(gasTracker);

                assert(gasTracker.deployment);
                assert(gasTracker.deployment > 0);

                return done();
            },
        );
    });
});

describe('Consensys ERC20 profile', () => {
    const configuration = {};

    const contractPath = path.resolve(__dirname, './contracts/consensys/EIP20.sol');
    const selector = `${contractPath}:EIP20`;
    const args = [
        1200000,
        'Test ERC20 token',
        1,
        'TST',
    ];

    before(() => {
        setUp(configuration);
    });

    after(done => configuration.provider.close(done));

    it('should produce an object which tracks the gas used to call ERC20 methods', function profileTest(done) {
        this.timeout(testTimeout);
        return profile(
            configuration.web3Client,
            configuration.accountAddresses[0],
            configuration.accountAddresses[1],
            {
                contractPath,
                selector,
                args,
            },
            (err, gasTracker) => {
                if (err) {
                    return done(err);
                }

                return done();
            },
        );
    });
});


describe('OpenZeppelin ERC20 deployment', () => {
    const configuration = {};

    const contractPath = path.resolve(__dirname, './contracts/open-zeppelin/test.sol');
    const selector = `${contractPath}:Test`;
    const args = [1200000];

    before(() => {
        setUp(configuration);
    });

    after(done => configuration.provider.close(done));

    it('should successfully deploy', function deploymentTest(done) {
        this.timeout(testTimeout);
        return deploy(
            configuration.web3Client,
            configuration.accountAddresses[0],
            {
                contractPath,
                selector,
                args,
            },
            (err, contractInstance, gasTracker) => {
                if (err) {
                    return done(err);
                }

                assert(contractInstance);
                assert(gasTracker);

                assert(gasTracker.deployment);
                assert(gasTracker.deployment > 0);

                return done();
            },
        );
    });
});

describe('OpenZeppelin ERC20 profile', () => {
    const configuration = {};

    const contractPath = path.resolve(__dirname, './contracts/open-zeppelin/test.sol');
    const selector = `${contractPath}:Test`;
    const args = [1200000];

    before(() => {
        setUp(configuration);
    });

    after(done => configuration.provider.close(done));

    it('should produce an object which tracks the gas used to call ERC20 methods', function profileTest(done) {
        this.timeout(testTimeout);
        return profile(
            configuration.web3Client,
            configuration.accountAddresses[0],
            configuration.accountAddresses[1],
            {
                contractPath,
                selector,
                args,
            },
            (err, gasTracker) => {
                if (err) {
                    return done(err);
                }

                return done();
            },
        );
    });
});

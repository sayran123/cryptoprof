/**
 * ERC20 contract profiler
 *
 * Exports a function which performs the profiling on a single ERC20 contract (specified by location
 * of solidity file).
 */

const async = require('async');
const bunyan = require('bunyan');
const _ = require('lodash');

const compile = require('./compile');

const log = bunyan.createLogger({
    name: 'erc20-profiler',
});
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
log.level(LOG_LEVEL);

/**
 * Deploys a given contract using the specified web3 client.
 *
 * @param {Object} web3Client - web3 client configured with a provider and an unlocked waller with
 * enough funds on it for deployment
 * @param {string} deployer - Wallet that should be used to deploy the contract (should be available
 * on web3 provider and should have sufficient funds)
 * @param {Object} contractSpec - Specifies the contract to deploy
 * @param {string} contractSpec.contractPath - Path to solidity file defining the contract
 * @param {string} contractSpec.selector - Name of contract in solidity file
 * @param {string[]} contractSpec.args - Arguments to contract constructor
 *
 * @callback deploymentCallback - When done, deploy calls this function with:
 * 1. An error object (if an error occurred) or null
 * 2. The deployed contract instance (as a web3 Contract object)
 * 3. An object with a single key - deployment - whose value is the amount of gas used to deploy
 * the contract
 */
function deploy(
    web3Client,
    deployer,
    {
        contractPath,
        selector,
        args,
    },
    deploymentCallback,
) {
    let err = null;
    const deployLog = log.child({ step: `Deploy ${selector}` });

    log.debug(`Compiling contract ${selector} at ${contractPath}`);
    const compilationResult = compile(contractPath);
    const compiledContract = _.get(compilationResult, ['contracts', selector]);
    if (!compiledContract) {
        err = new Error(`Contract not found: ${selector} at ${contractPath}`);
        deployLog.error(err);
        return deploymentCallback(err);
    }

    const contractBytecode = _.get(compiledContract, 'bytecode');
    if (!contractBytecode) {
        err = new Error(
            `Compilation of contract ${selector} at ${contractPath} did not produce any bytecode`,
        );
        deployLog.error(err);
        return deploymentCallback(err);
    }

    const contractInterface = _.get(compiledContract, 'interface');
    if (!contractInterface) {
        err = new Error(
            `Compilation of contract ${selector} at ${contractPath} did not produce interface`,
        );
        deployLog.error(err);
        return deploymentCallback(err);
    }

    const Contract = web3Client.eth.contract(JSON.parse(contractInterface));

    return async.waterfall([
        // Estimate the amount of gas required to deploy the contract
        (callback) => {
            deployLog.debug({ msg: 'Estimating gas' });

            return web3Client.eth.estimateGas(
                { data: contractBytecode },
                callback,
            );
        },
        // Deploy contract from specified deployer address with twice the gas estimate provided for
        // deployment
        (gasEstimate, callback) => {
            deployLog.debug({
                msg: 'Deploying contract',
                args,
                deployer,
            });

            return Contract.new(
                ...args,
                {
                    from: deployer,
                    data: contractBytecode,
                    gas: 2 * gasEstimate,
                },
                (creationErr, contractInstance) => {
                    if (creationErr) {
                        deployLog.error(creationErr);
                        return callback(creationErr);
                    }

                    if (contractInstance.address) {
                        const transactionHash = _.get(contractInstance, 'transactionHash');

                        if (!transactionHash) {
                            err = new Error(`Could not find transaction hash after deployment to ${contractInstance.address}`);
                            deployLog.error(err);
                            return callback(err);
                        }

                        return callback(null, contractInstance, transactionHash);
                    }

                    return null;
                },
            );
        },
        // Wait for transaction receipt and return the contract instance along with gasUsed (from
        // receipt) to final callback
        (contractInstance, transactionHash, callback) => {
            deployLog.debug({
                msg: 'Waiting for transaction receipt',
                transactionHash,
            });

            // The doUntil loop polls for transaction receipt
            return async.doUntil(
                (receiptCallback) => {
                    deployLog.debug('Looking for transaction receipt');
                    return web3Client.eth.getTransactionReceipt(transactionHash, receiptCallback);
                },
                // Check that receipt is not falsey (while transaction is still pending, receipt
                // will be null)
                receipt => receipt,
                (receiptErr, receipt) => {
                    if (receiptErr) {
                        deployLog.error(receiptErr);
                        return callback(receiptErr);
                    }

                    const gasUsed = _.get(receipt, 'gasUsed');
                    if (!gasUsed) {
                        err = new Error('Transaction receipt did not contain gasUsed');
                        return callback(err);
                    }

                    return callback(null, contractInstance, { deployment: gasUsed });
                },
            );
        },
    ], deploymentCallback);
}


/**
 * Creates a function which:
 * Calls a specific method on a contract instance using provided method arguments from a
 * specific sender address and measures the amount of gas used by the call.
 *
 * @param {Object} web3Client - web3 client configured with a provider and an unlocked waller with
 * enough funds on it for deployment
 * @param {string} sender - Wallet that should be used to deploy the contract (should be available
 * on web3 provider and should have sufficient funds)
 * @param {string} method - Name of method to call
 * @param {Any[]} args - Array of arguments to the given contract method -- should be passed as
 * individual arguments to contractMethodCaller
 *
 * @returns Function which executes the contract method call and measures the amount of gas used
 */
function contractMethodCalculator(web3Client, sender, methodName, ...args) {
    const calculateLog = log.child({
        step: 'Calculate gas',
        methodName,
        args,
    });

    calculateLog.debug('Calculator created');

    function gasForCall(contractInstance, gasTracker, calculationCallback) {
        calculateLog.debug('Calculator called');

        return async.waterfall([
            (callback) => {
                calculateLog.debug('Calculator estimating gas');
                return contractInstance[methodName].estimateGas(...args, callback);
            },
            (gasEstimate, callback) => {
                calculateLog.debug('Sending transaction');
                return contractInstance[methodName].sendTransaction(
                    ...args,
                    {
                        from: sender,
                        gas: 2 * gasEstimate,
                    },
                    callback,
                );
            },
            (transactionHash, callback) => {
                calculateLog.debug({ msg: 'Received transaction hash', transactionHash });
                let err = null;

                return async.doUntil(
                    (receiptCallback) => {
                        calculateLog.debug('Looking for transaction receipt');
                        return web3Client.eth.getTransactionReceipt(
                            transactionHash,
                            receiptCallback,
                        );
                    },
                    // Check that receipt is not falsey (while transaction is still pending, receipt
                    // will be null)
                    receipt => receipt,
                    (receiptErr, receipt) => {
                        if (receiptErr) {
                            calculateLog.error(receiptErr);
                            return callback(receiptErr);
                        }

                        calculateLog.debug('Receipt received');

                        const gasUsed = _.get(receipt, 'gasUsed');
                        if (!gasUsed) {
                            err = new Error('Transaction receipt did not contain gasUsed');
                            calculateLog.error(err);
                            return callback(err);
                        }

                        calculateLog.debug({ msg: 'Calculated gas used', gasUsed });

                        return callback(null, gasUsed);
                    },
                );
            },
        ], (calculationErr, gasUsed) => {
            if (calculationErr) {
                calculateLog.error(calculationErr);
                return calculationCallback(calculationErr);
            }

            calculateLog.debug({ msg: 'Adding used gas to gas tracker', gasTracker });
            _.set(gasTracker, methodName, gasUsed);
            calculateLog.debug({ msg: 'Gas tracked', gasTracker });

            return calculationCallback(null, contractInstance, gasTracker);
        });
    }

    return gasForCall;
}

/**
 * Returns gas estimates for each of the following (ERC20) methods on the specified ERC20 contract:
 * 1. totalSupply
 * 2. balanceOf
 * 3. transfer
 * 4. transferFrom
 * 5. approve
 * 6. allowance
 *
 * @param {string}
 */
function profile() {}

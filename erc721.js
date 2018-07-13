/**
 * ERC721 contract profiler
 *
 * Exports a function which performs the profiling on a single ERC721 contract (specified by location
 * of solidity file).
 */

const async = require('async');
const bunyan = require('bunyan');
const _ = require('lodash');

const compile = require('./compile');

const log = bunyan.createLogger({
    name: 'erc721-profiler',
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

    deployLog.debug(`Compiling contract ${selector} at ${contractPath}`);
    const compilationResult = compile(contractPath);
    const compiledContract = _.get(compilationResult, ['contracts', selector]);
    if (!compiledContract) {
        err = new Error(`Contract not found: ${selector} at ${contractPath}`);
        deployLog.error({ err, compilationResult });
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

    const Contract = new web3Client.eth.Contract(JSON.parse(contractInterface));

    const results = {};
    function registerResult(key, value) {
        results[key] = value;
        if (results.contractInstance && results.receipt) {
            deploymentCallback(
                null,
                results.contractInstance,
                { deployment: results.receipt.gasUsed },
            );
        }

        return null;
    }

    const deployment = Contract.deploy(
        {
            data: contractBytecode,
            arguments: args,
        },
    );

    deployment.estimateGas((estimationErr, gasAmount) => {
        if (estimationErr) {
            return deploymentCallback(estimationErr);
        }

        return deployment.send({
            from: deployer,
            gas: 2 * gasAmount,
        }).once(
            'receipt',
            receipt => registerResult('receipt', receipt),
        ).on(
            'error',
            deploymentCallback,
        ).then(contractInstance => registerResult('contractInstance', contractInstance));
    });

    return null;
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
 * @param {string} methodName - Name of method to call
 * @param {Any[]} args - Arguments to the given contract method -- should be passed as individual
 * arguments to contractMethodCaller
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

        return contractInstance.methods[methodName](...args).estimateGas((err, gasEstimate) => {
            if (err) {
                return calculationCallback(err);
            }

            return contractInstance.methods[methodName](...args).send(
                {
                    from: sender,
                    gas: 2 * gasEstimate,
                },
            ).once('receipt', (receipt) => {
                calculateLog.debug({ msg: 'Receipt received' });

                const newGasTracker = {
                    ...gasTracker,
                };
                newGasTracker[methodName] = receipt.gasUsed;
                return calculationCallback(null, contractInstance, newGasTracker);
            }).on('error', calculationCallback);
        });
    }

    return gasForCall;
}

/**
 * Returns gas estimates for deployment as well as each of the following (ERC20) methods on the
 * specified ERC20 contract:
 * 1. totalSupply
 * 2. balanceOf
 * 3. transfer
 * 4. transferFrom
 * 5. approve
 * 6. allowance
 * 7. ownerOf
 * 
 * @param {Object} web3Client - Web3 object that can make web3 calls against some provider
 * @param {string[]} unlockedWallets - Collection of unlocked wallets available on the web3 provider
 * @param {Object} contractSpec - Specifies the contract to deploy
 * @param {string} contractSpec.contractPath - Path to solidity file defining the contract
 * @param {string} contractSpec.selector - Name of contract in solidity file
 * @param {string[]} contractSpec.args - Arguments to contract constructor
 *
 * @callback profileCallback Will be called with (err, gasTracker). If the profiling completed
 * successfully, err will be null and gasTracker will be an object containing contract operations as
 * keys and the amount of gas spent on those operations as values. Otherwise, err will be an error
 * object describing the nature of the failure in profiling.
 */
function profile(
    web3Client,
    owner,
    recipient,
    {
        contractPath,
        selector,
        args,
    },
    profileCallback,
) {
    const profileLog = log.child({ step: `Profile ${selector}` });

    return async.waterfall([
        callback => deploy(
            web3Client,
            owner,
            {
                contractPath,
                selector,
                args,
            },
            callback,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'totalSupply',
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'balanceOf',
            owner,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'transfer',
            recipient,
            100,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'approve',
            owner,
            token,
            47,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'allowance',
            owner,
            owner,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'transferFrom',
            owner,
            recipient,
            42,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'ownerOf',
            token,
        ),
        contractMethodCalculator(
            web3client,
            owner,
            'approvalForAll',
            owner,
            operator,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'safeTransferFrom',
            recipient, 
            token,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'setApprovalForAll',
            operator,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'getApproved',
            token,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'ownerOf',
            token,
        ),
        contractMethodCalculator(
            web3Client,
            owner,
            'isApprovedForAll',
            owner,
            operator,
        ),
    ], (err, contractInstance, gasTracker) => {
        if (err) {
            profileLog.error(err);
        }

        profileLog.debug({
            msg: 'Profile complete',
            gasTracker,
        });

        return profileCallback(err, gasTracker);
    });
}


module.exports = {
    deploy,
    contractMethodCalculator,
    profile,
};

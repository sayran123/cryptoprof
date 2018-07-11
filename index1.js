#! /usr/bin/env node

const async = require('async');
const Table = require('cli-table');
const Ganache = require('ganache-core');
const _ = require('lodash');
const Web3 = require('web3');
const yargs = require('yargs');
const erc20 = require('./erc20');
const erc721 = require('./erc721');

const CONTRACT_TYPES = {
    ERC20: erc20.profile,
    EIP20: erc20.profile,
    erc20: erc20.profile,
    eip20: erc20.profile,
    ERC721: erc721.profile,
    EIP721: erc721.profile,
    erc721: erc721.profile,
    eip721: erc721.profile,
};

function parseContractSpec(contractSpec) {
    const [selector, ...args] = contractSpec.split(',');
    const contractPath = selector.split(':')[0];

    return {
        contractPath,
        selector,
        args,
    };
}


if (require.main === module) {
    // This script is being called as a script. Time to do some work.
    yargs
        .usage('$0 --contract-type <ERC or EIP number> [contract-specs...]')
        .option('contract-type', {
            alias: 't',
            type: 'string',
            default: 'erc20',
            describe: `Choose from:\n${Object.keys(CONTRACT_TYPES).join(', ')}`,
        })
        .option('contract-specs', {
            describe: 'List (separated by spaces) of contract information in the format <path-to-contract-file>:<contract-name>[,<list of contract arguments, separated by ",">]',
            type: 'array',
            default: [],
        })
        .option('json', {
            describe: 'Emit output as json',
            default: false,
        })
        .help();

    const { contractType, contractSpecs, json } = yargs.argv;

    if (!CONTRACT_TYPES[contractType]) {
        throw new Error(`Invalid contract type: ${contractType}`);
    }

    const provider = Ganache.provider();
    const web3 = new Web3(provider);
    const unlockedAccounts = _.get(provider, [
        'manager',
        'state',
        'unlocked_accounts',
    ]);
    const accountAddresses = Object.keys(unlockedAccounts);

    const profiler = CONTRACT_TYPES[contractType];
    const contractSpecObjects = contractSpecs.map(parseContractSpec);
    async.map(
        contractSpecObjects,
        (spec, callback) => profiler(
            web3,
            accountAddresses[0],
            accountAddresses[1],
            spec,
            callback,
        ),
        (err, results) => {
            if (err) {
                throw err;
            }

            if (results.length === 0) {
                console.log('No results to display');
                process.exit(0);
            }

            const items = Object.keys(results[0]).sort();

            const table = new Table({ head: ['Gas spent per contract method'].concat(items) });
            var jsResult = {};
            results.forEach((gasTracker, index) => {
                const row = [];
                items.forEach(item => row.push(gasTracker[item]));
                const prettyRow = {};
                prettyRow[contractSpecObjects[index].selector] = row;
                table.push(prettyRow);

                jsResult[contractSpecObjects[index].selector] = gasTracker;
            });

            if(json) {
                console.log(JSON.stringify(jsResult));
            } else {
                console.log(table.toString());
            }
        },
    );
}


module.exports = {
    parseContractSpec,
};

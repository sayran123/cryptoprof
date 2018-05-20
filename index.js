yargs
    .usage('$0 [contract-paths ...]')
    .option('provider', {
        alias: 'p',
        describe: 'Resource descriptor for provider: path to IPC socket, or HTTP or websocket URI',
    })
    .option('contract-specs', {
        alias: 'c',
        describe: 'List (separated by spaces) of contract information in the format <path-to-contract-file>:<contract-name>[:<list of contract arguments, separated by ":">]',
        type: 'array',
        default: [],
    })
    .help();
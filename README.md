# cryptoprof

Gas profiler for Ethereum smart contracts

- - -

## Getting started

### Requirements

+ [Node 9.11.1](https://nodejs.org/en/blog/release/v9.11.1/) (or greater)


### Installing the profiler

#### Global install

If you want to install it globally:

```
npm install -g cryptoprof
```

after which it should be available globally as `cryptoprof`. You can verify this using:

```
cryptoprof --help
```

#### Local install

If you want to install it locally to some npm package:

```
npm install cryptoprof
```

after which it should be available in that package's `node_modules/.bin` directory. You can verify
this from the directory containing that package by running:

```
./node_modules/.bin/cryptoprof --help
```


### Using the profiler

In order to use `cryptoprof`, you have to point it at some sample smart contracts. If you just want
to try it out, you can run it against the ERC20 contracts that are used in the `cryptoprof` tests.
These contracts can be found in the `node_modules` folder into which you installed `cryptoprof`.

Let us say your `cryptoprof` as installed into the `node_modules` directory in the
`$NODE_MODULES_PARENT` directory. Then, to test `cryptoprof` against the test ERC20 contracts, run:

```
cryptoprof -t erc20 \
  --contract-specs ${NODE_MODULES_PARENT}/node_modules/cryptoprof/test/contracts/consensys/EIP20.sol:EIP20,1200000,ConsensysERC20,1,CON \
                   ${NODE_MODULES_PARENT}/node_modules/cryptoprof/test/contracts/consensys/CrappyEIP20.sol:EIP20,1200000,CrappyERC20Token,1,CRP
```

This should yield a table similar to the one in the following image:
![cryptoprof sample](./doc/cryptoprof-sample.png)


### Contributions

If you'd like to contribute to `cryptoprof`, just open up a pull request. The guidelines are very
light:

1. Work off of your own fork of this repository, and open up a pull request into `master` when
you are ready. Give your pull request an informative description.

1. Make sure that the tests pass: `npm test`. (Bonus points for adding tests.)

1. Add one of the maintainers of this repository ([nkashy1](https://github.com/nkashy1) for now)
as a reviewer on the pull request.

Also, feel free to create issues as you find them. Thank you in advance!

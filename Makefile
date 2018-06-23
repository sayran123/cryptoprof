default: build run

build:
	docker build -t cryptoprof .

run: 
	docker run cryptoprof -t erc20 --contract-specs test/contracts/consensys/EIP20.sol:EIP20,1200000,ConsensysERC20,1,CON \
	                                                test/contracts/consensys/CrappyEIP20.sol:EIP20,1200000,CrappyERC20Token,1,CRP

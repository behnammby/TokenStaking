# TokenStaking


## Admin guide

There is a script in `scripts/contract.interaction.mjs` that you can follow to interact with contract.

### Requirements

First of all, copy `.env.example` to `.env` and fill it with proper data. 

Then to be able to use the contract interaction methods, you need to install requirements first.
Run the command below to install requirements:

```
npm i
```


### How to run

Running the script is straight forward. You need to uncomment the lines which are related to the setting you are going to change and then run the script using the following command:

```
node scripts/contract.interaction.mjs
```

### Change settings

#### Set rolling day

To set rolling day, uncomment the following lines in `contract.interaction.mjs` and run the script.

```
// 1- Set rolling day
const day = 7 * 24 * 60 * 60; // 7 Days
const write = await platform.setRollingDay(day)
console.debug('Hash', write.hash);
await write.wait();

const result = await platform.rollingDay();
console.debug(result.toString());
```

#### Set min staking amount

To set min staking amount, uncomment the following line in `contract.interaction.mjs` and run the script.

```
// 2- Set min staking amount
const amount = ethers.utils.parseUnits('500', 18); // 500 btx
const write = await platform.setMinStakingAmount(amount)
console.debug('Hash', write.hash);
await write.wait();

const result = await platform.minStakingAmount();
console.debug(result.toString());
```

#### Add an address to blacklist

To add an address to blacklist, uncomment the following lines from script `contract.interaction.mjs` and run the script.

```
// 3- Add an address to blacklist
const address = ethers.utils.getAddress('0x154b46249fBfA54fBAf6946568b8E5a27Ff5091B');
const write = await platform.addToBlacklist(address)
console.debug('Hash', write.hash);
await write.wait();

const result = await platform.getBlacklist();
console.debug(result);
```

#### Remove and address from blacklist

To remove an address from blacklist uncomment the following lines and run the script.

```
// 4- Remove an address to blacklist
const address = ethers.utils.getAddress('0x154b46249fBfA54fBAf6946568b8E5a27Ff5091B');
const write = await platform.removeFromBlacklist(address)
console.debug('Hash', write.hash);
await write.wait();

const result = await platform.getBlacklist();
console.debug(result);
```
"use strict";
import * as ethers from 'ethers';
import { configDotenv } from 'dotenv';
import { Wallet, Contract, providers } from 'ethers';
import tokenAbi from './token.mjs';
import platformAbi from './platform.mjs';

configDotenv();

const { PRIVATE_KEY, PROJECT_ID, TOKEN_CONTRACT, PLATFORM_CONTRACT } = process.env;


//////////////// WALLET //////////////////////////////////
const provider = new providers.InfuraProvider(5, PROJECT_ID);
const wallet = new Wallet(PRIVATE_KEY, provider);

//////////////////////////////////////////////////////////
//////////////// PLATFORM CONTRACT ///////////////////////
//////////////////////////////////////////////////////////
const platform = new Contract(PLATFORM_CONTRACT, platformAbi, wallet);

// // 1- Set rolling day
// const day = 7 * 24 * 60 * 60; // 7 Days
// const write = await platform.setRollingDay(day)
// console.debug('Hash', write.hash);
// await write.wait();

// const result = await platform.rollingDay();
// console.debug(result.toString());

//// 2- Set min staking amount
// const amount = ethers.utils.parseUnits('500', 18); // 500 btx
// const write = await platform.setMinStakingAmount(amount)
// console.debug('Hash', write.hash);
// await write.wait();

// const result = await platform.minStakingAmount();
// console.debug(result.toString());

// // 3- Add an address to blacklist
// const address = ethers.utils.getAddress('0x154b46249fBfA54fBAf6946568b8E5a27Ff5091B');
// const write = await platform.addToBlacklist(address)
// console.debug('Hash', write.hash);
// await write.wait();

// const result = await platform.getBlacklist();
// console.debug(result);

// // 4- Remove an address to blacklist
// const address = ethers.utils.getAddress('0x154b46249fBfA54fBAf6946568b8E5a27Ff5091B');
// const write = await platform.removeFromBlacklist(address)
// console.debug('Hash', write.hash);
// await write.wait();

// const result = await platform.getBlacklist();
// console.debug(result);

/////////////////////////////////////////////////////////
/////////////// TOKEN CONTRACT //////////////////////////
/////////////////////////////////////////////////////////
const token = new Contract(TOKEN_CONTRACT, tokenAbi, wallet);

//// 1- Remove all limits
// const write = await token.removeLimits();
// console.debug(write.hash);
// await write.wait();
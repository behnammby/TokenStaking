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

/////////////////////////////////////////////////////////
/////////////// TOKEN CONTRACT //////////////////////////
/////////////////////////////////////////////////////////
const token = new Contract(TOKEN_CONTRACT, tokenAbi, wallet);

const AMOUNT = '1000';

const amount = ethers.utils.parseUnits(AMOUNT, 18);

//// 1- Increase allowance
const increaseAllowance = await token.increaseAllowance(PLATFORM_CONTRACT, amount);
console.debug(increaseAllowance.hash);
await increaseAllowance.wait();

//////////////////////////////////////////////////////////
//////////////// PLATFORM CONTRACT ///////////////////////
//////////////////////////////////////////////////////////
const platform = new Contract(PLATFORM_CONTRACT, platformAbi, wallet);

//// 1- Add reward
const addReward = await platform.addReward(amount);
console.debug(addReward.hash);
await addReward.wait();

//// 2- distribute reward
const distribute = await platform.distributeReward();
console.debug(distribute.hash);
await distribute.wait();


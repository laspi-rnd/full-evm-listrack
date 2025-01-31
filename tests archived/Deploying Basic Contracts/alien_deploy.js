// npx hardhat test test\00RegularTx.js

const {expect} = require("chai");
const { ethers } = require("hardhat");
const { provider } = ethers.getDefaultProvider();

const timeSlotDrex = 20; // in seconds
const drexLeg = 6; // in time slot
const alienConfirmation = 3*drexLeg; // in time slot
const alienExpiration = 2*alienConfirmation; // in time slot

//import {hre} from "hardhat/types"
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const {time} = require("@nomicfoundation/hardhat-network-helpers");

describe("Deploying Every Contract in every chain", function() {

  it ('Should Deploy Contracts Properly', async function () {

  await hre.switchNetwork('mainnet');

  const [owner,alice,bob,charlie,debbie,eva,mike] = await ethers.getSigners();
    
  const drexSigners = [alice,mike];
  const alienSigners = [alice,mike];
   // frank,george,harry,irene,jack,kelly,larry,mike,nancy,
  
  const merkleSigners = [bob,charlie,debbie,eva];
  
  const equalbalance = (10**15); // 18 is the number of decimals

  await hre.switchNetwork('alien');
  
  const alienTokenFactory = await ethers.getContractFactory("AlienToken");
  //const alienToken = await alienTokenFactory.deploy();
  const alienToken = alienTokenFactory.attach('0x4a5377f417341c4AF079c7458475490A315A5738');


  console.log ('#######################');
  console.log (alienToken.target);

/* Setup for AlienListrack Contract */
const factoryAlienListrack = await ethers.getContractFactory("AlienListrack");
        const alienListrack = await factoryAlienListrack.deploy(alienToken,
                                                alienConfirmation*timeSlotDrex, // this is the time slot in seconds
                                                alienExpiration*timeSlotDrex);  // for alien listrack 
//const alienListrack = factoryAlienListrack.attach('0x7CfdA9c2aE901bA78897594070Db4Dbe264023ba');
                                                
console.log ('#######################');
console.log (alienListrack.target);


    console.log ("** End  **");
});

/*
const _tx = await (alienToken.connect(alienSigners[i]).
                approve(alienListrack.target, equalbalance));
    const _txReceipt = await _tx.wait();
console.log(_txReceipt.logs[0].args[2]);
*/
   
});
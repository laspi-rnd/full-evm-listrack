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
  
  const drexTokenFactory = await ethers.getContractFactory("DrexToken");
  const drexToken = await drexTokenFactory.connect(owner).deploy();
  //const drexToken = drexTokenFactory.attach('0x9840EeC2eb6DA5F07088DA094dD5DCF4CC73094f'); // everyone has Drex Token in Sepolia

  console.log ('#######################');
  console.log (drexToken.target);
  console.log (await (drexToken.balanceOf(owner.address)));
  
  // the below code is the first token transfer to users
  /*
  for (let i = 0; i < drexSigners.length; i++) {
  await drexToken.connect(owner).transfer(drexSigners[i].address, equalbalance);
  expect(await drexToken.balanceOf(drexSigners[i].address)).to.equal(equalbalance);
  }
  */

  /* Setup for alienToken */

  await hre.switchNetwork('alien');

  // // const alienToken = await ethers.deployContract("AlienToken");

  const alienTokenFactory = await ethers.getContractFactory("AlienToken");
  const alienToken = await alienTokenFactory.deploy();
  //const alienToken = alienTokenFactory.attach('0x679549671a648E73c8Ef13D1151f5bd3C8f7C593');


  console.log ('#######################');
  console.log (alienToken.target);

 // console.log (alienSigners);

  // Below is the Alien Token transfer to users
  for (let i = 0; i < alienSigners.length; i++) {
  await alienToken.transfer(alienSigners[i].address, equalbalance);
  }

/* Setup for Merkle Contract */
await hre.switchNetwork('mainnet');

const merkleFactory = await ethers.getContractFactory("MerkleContract");
  const merkleContract 
  = await merkleFactory.deploy([bob.address,charlie.address,debbie.address,
    eva.address],[1,1,1,1],0);
//const merkleContract = merkleFactory.attach('0x4aBa1396ead9E7d15f95E62fF6f3D1C5301cd283');

console.log ('#######################');
console.log (merkleContract.target);

 /* Setup for Listrack Contract */  
const factoryListrack = await ethers.getContractFactory("DrexListrack");
const Listrack = await factoryListrack.deploy(timeSlotDrex,drexLeg,
                                    alienConfirmation,alienExpiration);
                                  
//const Listrack = factoryListrack.attach('0xEfe67A371D784b32EB5eD6A93e187Ab233664908');
    
console.log ('#######################');
console.log (Listrack.target);


      
await hre.switchNetwork('alien');
/* Setup for AlienListrack Contract */
const factoryAlienListrack = await ethers.getContractFactory("AlienListrack");
        const alienListrack = await factoryAlienListrack.deploy(alienToken,
                                                alienConfirmation*timeSlotDrex, // this is the time slot in seconds
                                                alienExpiration*timeSlotDrex);  // for alien listrack 
//const alienListrack = factoryAlienListrack.attach('0x7CfdA9c2aE901bA78897594070Db4Dbe264023ba');
                                                
console.log ('#######################');
console.log (alienListrack.target);


   hre.switchNetwork('mainnet');
// Approve Listrack to spend DrexToken
    for (let i = 0; i < drexSigners.length; i++) {
    await (drexToken.connect(drexSigners[i]).
                approve(Listrack.target, equalbalance));
    console.log ("approval emitted");
    console.log (await (drexToken.allowance(drexSigners[i].address,Listrack.target)));
    }

    console.log ("#### alien chain approvals ####");
    await hre.switchNetwork('alien');
    // Approve Alien Listrack to spend AlienToken
    for (let i = 0; i < alienSigners.length; i++) {
    console.log (alienSigners[i].address);
    await (alienToken.connect(alienSigners[i]).
                approve(alienListrack.target, equalbalance));
   // console.log(_txReceipt.logs[0].args[2]);
   // console.log(_txReceipt);
    console.log (await (alienToken.allowance(alienSigners[i].address,alienListrack.target)));
    } 

   // console.log (await (alienToken.balanceOf(owner.address)));
    
    console.log ("** End **");
    console.log ("** End  **");
});

/*
const _tx = await (alienToken.connect(alienSigners[i]).
                approve(alienListrack.target, equalbalance));
    const _txReceipt = await _tx.wait();
console.log(_txReceipt.logs[0].args[2]);
*/
   
});
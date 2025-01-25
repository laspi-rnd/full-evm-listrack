// npx hardhat test test\00RegularTx.js

const {expect} = require("chai");
const { ethers } = require("hardhat");
const { provider } = ethers.getDefaultProvider();

const timeSlotDrex = 20; // in seconds
const drexLeg = 2; // in time slot
const alienConfirmation = 3*drexLeg; // in time slot
const alienExpiration = 2*alienConfirmation; // in time slot

//import {hre} from "hardhat/types"
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const {time} = require("@nomicfoundation/hardhat-network-helpers");

describe("Deploying Every Contract in every chain", function() {

  it ('Should Deploy Contracts Properly', async function () {

  await hre.switchNetwork('mainnet');

  const [owner,alice,mike] = await ethers.getSigners();
  
  const drexSigners = [alice,mike];
  const alienSigners = [alice,mike];
  
  const merkleSigners = [owner,alice,mike];
  
  const equalbalance = (10**15); // 18 is the number of decimals
  
  const drexTokenFactory = await ethers.getContractFactory("DrexToken");
  const drexToken = await drexTokenFactory.connect(owner).deploy();
 // const drexToken = drexTokenFactory.attach('0x7CfdA9c2aE901bA78897594070Db4Dbe264023ba');

  console.log ('#######################');
  console.log (drexToken.target);
  console.log (await (drexToken.balanceOf(owner.address)));
  
  // the below code is the first token transfer to users
  for (let i = 0; i < drexSigners.length; i++) {
  await drexToken.connect(owner).transfer(drexSigners[i].address, equalbalance);
  expect(await drexToken.balanceOf(drexSigners[i].address)).to.equal(equalbalance);
  }

  /* Setup for alienToken */

  await hre.switchNetwork('alien');

  // // const alienToken = await ethers.deployContract("AlienToken");

    const alienTokenFactory = await ethers.getContractFactory("AlienToken");
    const alienToken = await alienTokenFactory.connect(owner).deploy();
    //const alienToken = alienTokenFactory.attach('0x9840EeC2eb6DA5F07088DA094dD5DCF4CC73094f');

  console.log ('#######################');
  console.log (alienToken.target);
  
  // Below is the Alien Token transfer to users
  
  for (let i = 0; i < alienSigners.length; i++) {
    console.log (alienSigners[i].address);
  await alienToken.connect(owner).transfer(alienSigners[i].address, equalbalance);
  expect(await alienToken.balanceOf(alienSigners[i].address)).to.equal(equalbalance);
  }
  
  
  /* Setup for Merkle Contract */
  await hre.switchNetwork('mainnet');

  const merkleFactory = await ethers.getContractFactory("MerkleContract");
  const merkleContract 
  = await merkleFactory.deploy([owner.address,alice.address,mike.address],[2,1,1],0);

// const merkleContract = merkleFactory.attach('0x03898DAd231A2B9D9eCA58124Ab9e247AFb02bC8');

    console.log ('#######################');
    console.log (merkleContract.target);
  
  /* Setup for Listrack Contract */  
  const factoryListrack = await ethers.getContractFactory("DrexListrack");
  const Listrack = await factoryListrack.deploy(timeSlotDrex,drexLeg,
                                alienConfirmation,alienExpiration);
  //const Listrack = factoryListrack.attach('0x6748F5a811c6A4eC96590E15d7c77f828a0B8CDc');

    console.log ('#######################');
    console.log (Listrack.target);

  
  await hre.switchNetwork('alien');
  /* Setup for AlienListrack Contract */
  const factoryAlienListrack = await ethers.getContractFactory("AlienListrack");
  
  const alienListrack = await factoryAlienListrack.deploy(alienToken,
                                          alienConfirmation*timeSlotDrex, // this is the time slot in seconds
                                          alienExpiration*timeSlotDrex);  // for alien listrack 

// const alienListrack = factoryAlienListrack.attach('0xC28a8b2e9704D8B5559F2d91b862409e2739c7d4');
                                          
console.log ('#######################');
console.log (alienListrack.target);


await hre.switchNetwork('mainnet');
// Approve Listrack to spend DrexToken
for (let i = 0; i < drexSigners.length; i++) {
    expect (await (drexToken.connect(drexSigners[i]).
                approve(Listrack, equalbalance))
                .to.emit(drexToken,"Approval"));
    console.log ("approval emitted");
    }
    
    await hre.switchNetwork('alien');
    // Approve Alien Listrack to spend DrexToken
    for (let i = 0; i < alienSigners.length; i++) {
    expect (await (alienToken.connect(alienSigners[i]).
                approve(alienListrack, equalbalance))
                .to.emit(alienToken,"Approval"));
    console.log ("approval emitted");
    } 

    console.log ("** End **");
    console.log ("** End  **");
});
  
   
});
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

describe("Reverts Tests with Great Volume of Tx | Automatic Revert by Merkle Contract", function() {


  const secret = '0x956ea5776a6ad4a12929763dc99687add2db4b2ea3d3c8a120463f2b76d03ab3';
  const hashedsecret = '0x22c070e98497e9492cdbcb2749e29b8dab14fc6c26686dbc727e611f62716580';

  it ('Should Deploy Contracts Properly', async function () {

  await hre.switchNetwork('sepolia');

  // sepolia is mimicking Drex
  // moonbeam is mimicking Alien Chain

  const [owner,alice,bob,charlie,debbie,eva,mike] = await ethers.getSigners();
    // //frank,george,harry,irene,jack,kelly,larry,nancy,
          // oliver to robert are the signers of Merkle Contract
    //,sally,tom,ursula,victor,wendy,xander,yvonne,zack] 
    
  
  const drexSigners = [alice,mike];
  const alienSigners = [alice,mike];
   // frank,george,harry,irene,jack,kelly,larry,mike,nancy,
  
  
  const merkleSigners = [bob,charlie,debbie,eva];
  
  const equalbalance = (10**15); // 18 is the number of decimals
  
  /* Setup for DrexToken */
  
  // const drexToken = await ethers.deployContract("DrexToken");
  
  
  const drexTokenFactory = await ethers.getContractFactory("DrexToken");
  const drexToken = drexTokenFactory.attach('0x7CfdA9c2aE901bA78897594070Db4Dbe264023ba');

  console.log ('#######################');
  console.log (drexToken.target);
  
  // the below code is the first token transfer to users
  /*
  for (let i = 0; i < drexSigners.length; i++) {
  await drexToken.transfer(drexSigners[i].address, equalbalance);
  }
  */

  
  /* Setup for alienToken */

  await hre.switchNetwork('moonbeam');

  //const alienToken = await ethers.deployContract("AlienToken");

    const alienTokenFactory = await ethers.getContractFactory("AlienToken");
    const alienToken = alienTokenFactory.attach('0x9840EeC2eb6DA5F07088DA094dD5DCF4CC73094f');

  console.log ('#######################');
  console.log (alienToken.target);
  
  // Below is the Alien Token transfer to users
  
  for (let i = 0; i < alienSigners.length; i++) {
    console.log (alienSigners[i].address);
  await alienToken.connect(owner).transfer(alienSigners[i].address, equalbalance);
  }
  
  
  /* Setup for Merkle Contract */
  await hre.switchNetwork('sepolia');

  /*
  const factory = await ethers.getContractFactory("MerkleContract");
  
  const merkleContract 
  = await factory.deploy([owner.address,alice.address,bob.address,
                          charlie.address],[1,1,1,1],0);

  */
    const merkleFactory = await ethers.getContractFactory("MerkleContract");
    const merkleContract = merkleFactory.attach('0x03898DAd231A2B9D9eCA58124Ab9e247AFb02bC8');

    console.log ('#######################');
    console.log (merkleContract.target);
  
  /* Setup for Listrack Contract */  
  //const factoryListrack = await ethers.getContractFactory("DrexListrack");
  /*
  const Listrack = await factoryListrack.deploy(timeSlotDrex,drexLeg,
                                alienConfirmation,alienExpiration);
*/
    const ListrackFactory = await ethers.getContractFactory("DrexListrack");
  const Listrack = ListrackFactory.attach('0x6748F5a811c6A4eC96590E15d7c77f828a0B8CDc');

    console.log ('#######################');
    console.log (Listrack.target);

  
  await hre.switchNetwork('moonbeam');
  /* Setup for AlienListrack Contract */
  const factoryAlienListrack = await ethers.getContractFactory("AlienListrack");
  /*
  const alienListrack = await factoryAlienListrack.deploy(alienToken,
                                          alienConfirmation*timeSlotDrex, // this is the time slot in seconds
                                          alienExpiration*timeSlotDrex);  // for alien listrack 
   */
    const alienListrack = factoryAlienListrack.attach('0xC28a8b2e9704D8B5559F2d91b862409e2739c7d4');
                                          
console.log ('#######################');
console.log (alienListrack.target);
/*

await hre.switchNetwork('sepolia');
// Approve Listrack to spend DrexToken
for (let i = 0; i < drexSigners.length; i++) {
    await (drexToken.connect(drexSigners[i]).
                approve(Listrack, equalbalance));
    console.log ("approval emitted");
    }
    
    await hre.switchNetwork('moonbeam');
    // Approve Alien Listrack to spend DrexToken
    for (let i = 0; i < alienSigners.length; i++) {
    await (alienToken.connect(alienSigners[i]).
                approve(alienListrack, equalbalance));
                console.log ("approval emitted");
    } 

    console.log ("** End **");
    console.log ("** End  **");
*/
});
  
   
});
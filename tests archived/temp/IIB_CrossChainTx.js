// npx hardhat test test\00RegularTx.js

const {expect} = require("chai");
const { ethers } = require("hardhat");
const { provider } = ethers.getDefaultProvider();

const timeSlotDrex = 20; // in seconds
const drexLeg = 4; // in time slot
const alienConfirmation = 3*drexLeg; // in time slot
const alienExpiration = 2*alienConfirmation; // in time slot

//import {hre} from "hardhat/types"
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const {time} = require("@nomicfoundation/hardhat-network-helpers");

describe("Deploying Every Contract in every chain", function() {

  it ('Should Deploy Contracts Properly', async function () {

  await hre.switchNetwork('mainnet');

  const [owner,alice,bob,charlie,debbie,eva,mike] = await ethers.getSigners();
    // //frank,george,harry,irene,jack,kelly,larry,nancy,
          // oliver to robert are the signers of Merkle Contract
    //,sally,tom,ursula,victor,wendy,xander,yvonne,zack] 
    
  const drexSigners = [alice,mike];
  const alienSigners = [alice,mike];
   // frank,george,harry,irene,jack,kelly,larry,mike,nancy,
  
  const merkleSigners = [bob,charlie,debbie,eva];
  
  const equalbalance = (10**15); // 18 is the number of decimals
  
  const drexTokenFactory = await ethers.getContractFactory("DrexToken");
  //const drexToken = await drexTokenFactory.connect(owner).deploy();
  const drexToken = drexTokenFactory.attach('0x7CfdA9c2aE901bA78897594070Db4Dbe264023ba'); // everyone has Drex Token in Sepolia

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
   // const alienToken = await alienTokenFactory.deploy();
  const alienToken = alienTokenFactory.attach('0x679549671a648E73c8Ef13D1151f5bd3C8f7C593');


  console.log ('#######################');
  console.log (alienToken.target);

 // console.log (alienSigners);

  // Below is the Alien Token transfer to users
  /*
  for (let i = 0; i < alienSigners.length; i++) {
  await alienToken.transfer(alienSigners[i].address, equalbalance);
  }
  */

/* Setup for Merkle Contract */
await hre.switchNetwork('mainnet');

const merkleFactory = await ethers.getContractFactory("MerkleContract");
  /*
  const merkleContract 
  = await merkleFactory.deploy([bob.address,charlie.address,debbie.address,
    eva.address],[1,1,1,1],0);
*/
const merkleContract = merkleFactory.attach('0x4aBa1396ead9E7d15f95E62fF6f3D1C5301cd283');

console.log ('#######################');
console.log (merkleContract.target);

 /* Setup for Listrack Contract */  
const factoryListrack = await ethers.getContractFactory("DrexListrack");
/*
const Listrack = await factoryListrack.deploy(timeSlotDrex,drexLeg,
                                    alienConfirmation,alienExpiration);
                                    */
const Listrack = factoryListrack.attach('0xEfe67A371D784b32EB5eD6A93e187Ab233664908');
    
console.log ('#######################');
console.log (Listrack.target);


      
await hre.switchNetwork('alien');
/* Setup for AlienListrack Contract */
const factoryAlienListrack = await ethers.getContractFactory("AlienListrack");
        /*
        const alienListrack = await factoryAlienListrack.deploy(alienToken,
                                                alienConfirmation*timeSlotDrex, // this is the time slot in seconds
                                                alienExpiration*timeSlotDrex);  // for alien listrack 
       */
const alienListrack = factoryAlienListrack.attach('0x7CfdA9c2aE901bA78897594070Db4Dbe264023ba');
                                                
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

    console.log ("****");
    console.log ("Alice must set the Tx in Drex without errors and Mike should lock Funds");
    for (let i = 0; i < drexSigners.length-1; i++) {
        const _txIdObject = await Listrack.connect(drexSigners[i]).setTrade(
          [drexSigners[i].address,
          drexSigners[i+1].address,
          drexToken.target],
          100000000000000,
          [merkleContract.target],
          [alienSigners[i].address,
          alienSigners[i+1].address,
          alienToken.target],
          100000000000000,
          '0x0000000000000000000000000000000000000000000000000000000000000000');
            
          const _txReceipt = await _txIdObject.wait();
          //console.log (_txReceipt.logs[2]);
          console.log (_txReceipt.logs[2].args[2]);
          _txId = _txReceipt.logs[2].args[2];
          //console.log (_txReceipt.logs[0].args[2]);
            // Mike Agree Trade below
         await (Listrack.connect(drexSigners[i+1]).mikeAgreeTrade(_txId));
        }


        console.log ("****");
        console.log ("Mike sends Drex Tx | Alice confirms Tx in Alien Chain | \
Merkle Root by Merkle Contract | Alice settles Tx in Drex");


for (let i = 0; i < drexSigners.length-1; i++) {
    expect (await Listrack.connect(drexSigners[i+1]).setTrade(
    [drexSigners[i].address,
    drexSigners[i+1].address,
    drexToken.target],
    500000000000000,
    [merkleContract.target],
    [alienSigners[i].address,
    alienSigners[i+1].address,
    alienToken.target],
    500000000000000,
    '0x0000000000000000000000000000000000000000000000000000000000000000'));
  }

  console.log ("** Transactions Locked by Mike in Drex **");
  console.log ("** Transactions Locked by Mike in Drex **");
  
  // array to store trades Id by user : user => Trades Id []
  tradesId = [];
  // each user can have several TxIds
  for (let i = 0; i < drexSigners.length; i++) {
    tradesId.push(await Listrack.
    connect(drexSigners[i]).getTxIdbyUser(drexSigners[i].address));
    } // trades by user stored in tradesId

    // array to store trades to be sent to Alien Chain
  tradesToPushAlien = [];

    for (let i = 0; i < drexSigners.length; i++) {
      for (let j = 0; j < tradesId[i].length; j++) {
        // procedure to store tx details in tradesToPushAlien
        // to set tx in Alien Chain
      const temp = await Listrack.
      connect(drexSigners[i]).getDrexAlienInputsbyId(tradesId[i][j]);
      const _drexHashFields = temp[0][3];
      const _alienAliceAddress = temp[0][4];
      const _alienMikeAddress = temp[0][5];
      const _alienTokencontract = temp[0][6];
      const _alienAmount = temp[0][8];
      const _hashedSecret = temp[0][9];
      const _drexPreviousId = temp[0][11][4];
      const _drexTxIndex = temp[0][11][3];
      const _drexTxId = tradesId[i][j];
      const _drexAlienConfirmationIndex = temp[1];
     
      tradesToPushAlien.push([_drexHashFields,_alienAliceAddress,
        _alienMikeAddress,_alienTokencontract,_alienAmount,
        _hashedSecret,_drexPreviousId,_drexTxIndex,_drexTxId,_drexAlienConfirmationIndex]);};
      }

   txIdsAlienPushed = [];

    for (let i=0; i<alienSigners.length-1; i++) {
     await alienListrack.connect(alienSigners[i]).
      writeAlienLeg(tradesToPushAlien[i*2][0],tradesToPushAlien[i*2][1],
      tradesToPushAlien[i*2][2],tradesToPushAlien[i*2][3],
      tradesToPushAlien[i*2][4],tradesToPushAlien[i*2][5],
      tradesToPushAlien[i*2][6],tradesToPushAlien[i*2][7],
      tradesToPushAlien[i*2][8],tradesToPushAlien[i*2][9]);
      txIdsAlienPushed.push(tradesToPushAlien[i*2][8]);
    }

console.log ("** Trades Settled in Alien Chain **");
console.log ("** Trades Settled in Alien Chain **");

// the array below is to store the alien features of the Tx Id settled in Alien Chain
TxValidation = [];

const alfred      = drexSigners [0];
const alfredAlien = alienSigners[0];

// array with slots to be searched
  slotNumber = [];

  for (let i=0; i<txIdsAlienPushed.length; i++) {
    const alienFeatures = await alienListrack.connect(alfredAlien)
                          .getTradeFeatures(txIdsAlienPushed[i]);
    const merkleProof = await alienListrack.connect(alfredAlien).
                          createMerkleTree(alienFeatures[0],true,alienFeatures[1]);
    TxValidation[i] = [txIdsAlienPushed[i],alienFeatures[1],merkleProof,alienFeatures[0]];

    // storing the slot numbers for validation in Merkle Contract
    if (slotNumber.indexOf(alienFeatures[0])==-1) slotNumber.push(alienFeatures[0]);
   // console.log (TxValidation[i]);
  }

  console.log ("** Merkle Proof generated by Alien Listrack to each TxId **");
  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN
  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN
  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN

  console.log ("** Each Merkle Signer begins to listen to Alien Chain **");
  console.log ("** Each Merkle Signer listens to Alien Merkle Root through gasfree Tx **");


  for (j = 0; j<slotNumber.length; j++) { // validation for each block in the transactions
  for (let i=0; i<merkleSigners.length-1;i++){
  // not all Merkle Signers are required to listen
  // to Transactions because only 70% are required for approval
  // if the last Merkle Signer sends a Merkle Root approval for
  // an approval already done Tx is reverted
  // const latestSlot = await (alienListrack.connect(merkleSigners[i]).getLatestSlot());

  const slotToVerify = slotNumber[j];
  //console.log (latestSlot);
  merkleRoot = await (alienListrack.connect(merkleSigners[i]).createMerkleTree(slotToVerify,false,0));
  // console.log(merkleRoot);
  // merkleRoot[0] is the Merkle Root returned by Function in a array object
  await (merkleContract.connect(merkleSigners[i]).insertMerkleForApproval(merkleRoot[0],slotToVerify));
  }
  }

  console.log ("** Each Merkle Signer already inserted Alien Merkle Root in Drex Merkle **");


  console.log ("** Tx can now be manually settled in Drex **");
  /// MERKLE CONTRACT REACHED CONSENSUS ON ALIEN CHAIN
  
   /// SENDING TRANSACTIONS FOR SETTLEMENT IN DREX LISTRACK BY ALICE

   for (let i=0; i<TxValidation.length; i++) {
    merkleProof = Object.values(TxValidation[i][2]);
   await Listrack.connect(alfred)
                  .aliceSettleTrade(TxValidation[i][0],TxValidation[i][1],
                   merkleProof,TxValidation[i][3],
                    '0x0000000000000000000000000000000000000000000000000000000000000000');
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
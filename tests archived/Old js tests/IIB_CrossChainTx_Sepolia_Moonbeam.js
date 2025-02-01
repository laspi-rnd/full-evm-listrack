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

describe("Cross-Chain Transfers Between EVMs", function() {


it("Mike sends Drex Tx | Alice confirms Tx in Alien Chain | \
    Merkle Root by Merkle Contract | Alice settles Tx in Drex",
        async function() {

    await hre.switchNetwork('mainnet');

    const [owner,alice,bob,charlie,debbie,eva,mike] = await ethers.getSigners();
    const drexSigners = [alice,mike];
    const alienSigners = [alice,mike];
    
    const merkleSigners = [bob,charlie,debbie,eva];
    
    const equalbalance = (10**15); // 18 is the number of decimals
    
    const drexTokenFactory = await ethers.getContractFactory("DrexToken");
    const drexToken = drexTokenFactory.attach('0xfD7d17bA040C6D45aC77A4BAEF9F5Ce04626BE57'); // everyone has Drex Token in Sepolia
  
    console.log ('#######################');
    console.log (drexToken.target);
    console.log ("Owner balance");
    console.log (await (drexToken.balanceOf(owner.address)));
    
    /*
    for (let i = 0; i < drexSigners.length; i++) {
        await drexToken.connect(owner).transfer(drexSigners[i].address, equalbalance);
        }
        */
    
    console.log (await (drexToken.balanceOf(alice.address)));
    console.log (await (drexToken.balanceOf(mike.address)));

    /* Setup for alienToken */
    await hre.switchNetwork('alien');
    const alienTokenFactory = await ethers.getContractFactory("AlienToken");
    const alienToken = alienTokenFactory.attach('0x03898DAd231A2B9D9eCA58124Ab9e247AFb02bC8');
    console.log ('#######################');
    console.log (alienToken.target);
    console.log ("Owner balance");
    console.log (await (alienToken.balanceOf(owner.address)));
    
    for (let i = 0; i < alienSigners.length; i++) {
      await alienToken.connect(owner).transfer(alienSigners[i].address, equalbalance);
      }
    
    console.log (await (alienToken.balanceOf(alice.address)));
    console.log (await (alienToken.balanceOf(mike.address)));
  
  /* Setup for Merkle Contract */
  await hre.switchNetwork('mainnet');
  const merkleFactory = await ethers.getContractFactory("MerkleContract");
  const merkleContract = merkleFactory.attach('0x97F3A09EF4828b1096894Ed5d21B6Cb1ab2a0718');
  
  console.log ('#######################');
  console.log (merkleContract.target);
  
   /* Setup for Listrack Contract */  
  const factoryListrack = await ethers.getContractFactory("DrexListrack");
  const Listrack = factoryListrack.attach('0x72153754c50983Cc02F1a0a08E58c5Ff5c7258ae');
  console.log ('#######################');
  console.log (Listrack.target);
  
  await hre.switchNetwork('alien');
  /* Setup for AlienListrack Contract */
  const factoryAlienListrack = await ethers.getContractFactory("AlienListrack");
  const alienListrack = factoryAlienListrack.attach('0x7809AcA8539545f5b2FaA8876120c526Ac5806D5');                                     
  console.log ('#######################');
  console.log (alienListrack.target);
  
  
  await hre.switchNetwork('mainnet');
  // Approve Listrack to spend DrexToken
      for (let i = 0; i < drexSigners.length; i++) {
      await (drexToken.connect(drexSigners[i]).
                  approve(Listrack.target, equalbalance));
      console.log ("approval emitted");
      console.log (await (drexToken.allowance(drexSigners[i].address,Listrack.target)));
      }
  
      
    await hre.switchNetwork('alien');
      // Approve Alien Listrack to spend AlienToken
      for (let i = 0; i < alienSigners.length; i++) {
      await (alienToken.connect(alienSigners[i]).
                  approve(alienListrack.target, equalbalance));
                  console.log ("approval emitted");
     //   const _txReceipt = await _tx.wait();
     //   console.log(_txReceipt.logs)
     // console.log(_txReceipt);
      console.log (await (alienToken.allowance(alienSigners[i].address,alienListrack.target)));
      } 

await hre.switchNetwork('mainnet');
console.log ("** Transactions TO BE Locked by Mike in Drex **");
console.log ("** Transactions TO BE Locked by Mike in Drex **");
console.log ("** Transactions TO BE Locked by Mike in Drex **");
// Mike sends Tx in Drex
for (let i = 0; i < drexSigners.length-1; i++) {
    console.log (drexSigners[i].address);
    console.log (drexSigners[i+1].address);
    await Listrack.connect(drexSigners[i+1]).setTrade(
    [drexSigners[i].address,
    drexSigners[i+1].address,
    drexToken.target],
    100000000000000,
    [merkleContract.target],
    [alienSigners[i].address,
    alienSigners[i+1].address,
    alienToken.target],
    150000000000000,
    '0x0000000000000000000000000000000000000000000000000000000000000000');
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

// console.log (tradesToPushAlien);
 // the below array store the txs that were settled in Alien Chain
 txIdsAlienPushed = [];
  
  for (let i=0; i<tradesToPushAlien.length; i++) {
    for (let j=0; j<drexSigners.length ; j++) {
        // confirms if txId is pushed by Alice
      //  console.log (alienSigners[j].address);
    if (alienSigners[j].address == tradesToPushAlien[i][1]) {
        // confirms if txId is not already pushed
    if (txIdsAlienPushed.indexOf(tradesToPushAlien[i][8])==-1) {
   await alienListrack.connect(alienSigners[j]).
    writeAlienLeg(tradesToPushAlien[i][0],
    tradesToPushAlien[i][1], // alice Alien Address
    tradesToPushAlien[i][2],tradesToPushAlien[i][3],
    tradesToPushAlien[i][4],tradesToPushAlien[i][5],
    tradesToPushAlien[i][6],tradesToPushAlien[i][7],
    tradesToPushAlien[i][8]);
    txIdsAlienPushed.push(tradesToPushAlien[i][8]);
    }
    }
    }
  }

console.log ("** Trades Settled in Alien Chain **");
console.log ("** Trades Settled in Alien Chain **");
console.log (txIdsAlienPushed);

// the array below is to store the alien features of the Tx Id settled in Alien Chain
TxValidation = [];

const alfred      = drexSigners [0];
const alfredAlien = alienSigners[0];

// array with slots to be searched
  slotNumber = [];

  for (let i=txIdsAlienPushed.length-1; i<txIdsAlienPushed.length; i++) {
    console.log (txIdsAlienPushed[i]);
    console.log (await alienListrack.connect(alfredAlien)
                          .getTradeFeatures(txIdsAlienPushed[i]));
    const alienFeatures = await alienListrack.connect(alfredAlien)
                          .getTradeFeatures(txIdsAlienPushed[i]);
    console.log (typeof alienFeatures);
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
  await hre.switchNetwork('alien');
  merkleRoot = await (alienListrack.connect(merkleSigners[i]).createMerkleTree(slotToVerify,false,0));
  // console.log(merkleRoot);
  // merkleRoot[0] is the Merkle Root returned by Function in a array object
  await hre.switchNetwork('mainnet');
  await (merkleContract.connect(merkleSigners[i]).insertMerkleForApproval(merkleRoot[0],slotToVerify));
  }
  }

  console.log ("** Each Merkle Signer already inserted Alien Merkle Root in Drex Merkle **");


  console.log ("** Tx can now be manually settled in Drex **");
  /// MERKLE CONTRACT REACHED CONSENSUS ON ALIEN CHAIN
  
   /// SENDING TRANSACTIONS FOR SETTLEMENT IN DREX LISTRACK BY ALICE

   await hre.switchNetwork('mainnet');

   for (let i=0; i<TxValidation.length; i++) {
    merkleProof = Object.values(TxValidation[i][2]);
   await Listrack.connect(alfred)
                  .aliceSettleTrade(TxValidation[i][0],TxValidation[i][1],
                   merkleProof,TxValidation[i][3],
                    '0x0000000000000000000000000000000000000000000000000000000000000000');
  }

  console.log ("** Cross-chain tranfers completed **");
  console.log ("** Cross-chain tranfers completed **");

});

});

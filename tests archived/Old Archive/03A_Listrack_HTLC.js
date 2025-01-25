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

async function InitialSetupFixture() {

  const secret = '0x956ea5776a6ad4a12929763dc99687add2db4b2ea3d3c8a120463f2b76d03ab3';
  const hashedsecret = '0x22c070e98497e9492cdbcb2749e29b8dab14fc6c26686dbc727e611f62716580';

  /*
    const secret = "listrack";
   // const _secretBytes32 = ethers.utils.solidityPack(["string"],[secret]);
   const _secretBytes32 = ethers.solidityPackedKeccak256(["string"],[secret]);
    console.log (_secretBytes32);
    _secretBytes32 = ethers.utils.solidityKeccak256(["string"],[_secretBytes32]);

    console.log (_secretBytes32)
    const hashedSecret = ethers.utils.solidityPack(["bytes32"],[_secretBytes32]);
    hashedSecret = ethers.utils.olidityKeccak256(["bytes32"],[_secretBytes32]);
    console.log (hashedsecret);
*/

    const [owner,alfred,bob,charlie,debbie,eva,frank,george,
          alfredAlien,bobAlien,charlieAlien,debbieAlien,evaAlien,
          frankAlien,georgeAlien,
          oliver,paula,quincy,robert] = await ethers.getSigners();
    // //frank,george,harry,irene,jack,kelly,larry,nancy,
          // oliver to robert are the signers of Merkle Contract
    //,sally,tom,ursula,victor,wendy,xander,yvonne,zack] 
    
  
  const drexSigners = [alfred,bob,charlie,debbie,eva,
                      frank,george];
   // frank,george,harry,irene,jack,kelly,larry,mike,nancy,
  
  const alienSigners = [alfredAlien,bobAlien,charlieAlien,debbieAlien,
                        evaAlien,frankAlien,georgeAlien];
  
  const merkleSigners = [oliver,paula,quincy,robert];
  
  const equalbalance = (10**15); // 18 is the number of decimals
  
  /* Setup for DrexToken */
  const drexToken = await ethers.deployContract("DrexToken");
  
  const ownerBalance = await drexToken.balanceOf(owner.address);
  expect(await drexToken.totalSupply()).to.equal(ownerBalance);
  
  for (let i = 0; i < drexSigners.length; i++) {
  await drexToken.transfer(drexSigners[i].address, equalbalance);
  expect(await drexToken.balanceOf(drexSigners[i].address)).to.equal(equalbalance);
  }
  
  
  /* Setup for alienToken */
  const alienToken = await ethers.deployContract("AlienToken");
  
  const ownerAlienBalance = await alienToken.balanceOf(owner.address);
  expect(await alienToken.totalSupply()).to.equal(ownerAlienBalance);
  
  for (let i = 0; i < alienSigners.length; i++) {
  await alienToken.transfer(alienSigners[i].address, equalbalance);
  expect(await alienToken.balanceOf(alienSigners[i].address)).to.equal(equalbalance);
  }
  
  /* Setup for Merkle Contract */
  const factory = await ethers.getContractFactory("MerkleContract");
  const merkleContract 
  = await factory.deploy([oliver.address,paula.address,quincy.address,
                      robert.address],[1,1,1,1],0);
  
  /* Setup for Listrack Contract */  
  const factoryListrack = await ethers.getContractFactory("DrexListrack");
  const Listrack = await factoryListrack.deploy(timeSlotDrex,drexLeg,
                                alienConfirmation,alienExpiration);

  // Transferring a Large Amount of Tokens to Drex Contract to test drainage by Merkle Contract
  await drexToken.connect(owner).transfer(Listrack.target,    10**15);
  expect(await drexToken.balanceOf(Listrack.target)).to.equal(10**15);

  
  /* Setup for AlienListrack Contract */
  const factoryAlienListrack = await ethers.getContractFactory("AlienListrack");
  const alienListrack = await factoryAlienListrack.deploy(alienToken,
                                          alienConfirmation*timeSlotDrex, // this is the time slot in seconds
                                          alienExpiration*timeSlotDrex);  // for alien listrack 
   
// Approve Listrack to spend DrexToken
for (let i = 0; i < drexSigners.length; i++) {
    await expect (drexToken.connect(drexSigners[i]).
                approve(Listrack, equalbalance))
                .to.emit(drexToken, "Approval");
    }
    
    // Approve Alien Listrack to spend DrexToken
    for (let i = 0; i < alienSigners.length; i++) {
    await expect (alienToken.connect(alienSigners[i]).
                approve(alienListrack, equalbalance))
                .to.emit(alienToken, "Approval");
   

    } 

 
/// GREAT NUMBER OF TRANSACTIONS
/// GREAT NUMBER OF TRANSACTIONS
/// GREAT NUMBER OF TRANSACTIONS

  // 100000000000000
  // Mike sends Tx in Drex
  // Number of Txs vary on the amount sent
  for (let i = 0; i < drexSigners.length-1; i++) {
      // wait time for increasing transaction is below
      await time.increase(2*timeSlotDrex); // one time slot for each signer
      for (let j=10000000000000; j<=100000000000000 ; j+=10000000000000) {  
      expect (await Listrack.connect(drexSigners[i+1]).setTrade(
      [drexSigners[i].address,
      drexSigners[i+1].address,
      drexToken.target],
      j,
      [merkleContract.target],
      [alienSigners[i].address,
      alienSigners[i+1].address,
      alienToken.target],
      j,
      hashedsecret))
      .to.changeTokenBalances(drexToken, [drexSigners[i+1],Listrack], [-j,j]);
    }
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

     txIdsMikeRevert = [];
      
      for (let i=0; i<tradesToPushAlien.length; i++) {
        for (let j=0; j<drexSigners.length ; j++) {
            // confirms if txId is pushed by Alice
          //  console.log (alienSigners[j].address);
        if (alienSigners[j].address == tradesToPushAlien[i][1]) {
            // confirms if txId is not already pushed
        if (txIdsAlienPushed.indexOf(tradesToPushAlien[i][8])==-1) {
          // the below warrants that transactions are not expired
          if (tradesToPushAlien[i][7]>=tradesToPushAlien[i][9]) { // not expired transactions
          // the below requirement splits the transactions in two to test Mike Revert
        //  if (i%2 == 0) { //only odd transactions to test MikeRevert in Drex Listrack
       await alienListrack.connect(alienSigners[j]).
        writeAlienLeg(tradesToPushAlien[i][0],
        tradesToPushAlien[i][1], // alice Alien Address
        tradesToPushAlien[i][2],tradesToPushAlien[i][3],
        tradesToPushAlien[i][4],tradesToPushAlien[i][5],
        tradesToPushAlien[i][6],tradesToPushAlien[i][7],
        tradesToPushAlien[i][8],tradesToPushAlien[i][9]);
        txIdsAlienPushed.push(tradesToPushAlien[i][8]);
        //  } else { // the below block is for storing transactions to MiketoRevert
            // else of odd transactions
        //  }
          } else {
            if (txIdsMikeRevert.indexOf(tradesToPushAlien[i][8])==-1) {
            txIdsMikeRevert.push(tradesToPushAlien[i][8]);
            console.log ("**Trades to Revert ", tradesToPushAlien[i][8]);
            }
          }
        }
        }
        }
      }
  
  console.log ("** Trades Settled in Alien Chain **");
  console.log ("** Trades Settled in Alien Chain **");
  
  // the array below is to store the alien features of the Tx Id settled in Alien Chain
  TxValidation = [];
  
  
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
  
  
    console.log ("** Tx can now be automatically settled in Drex by a Merkle Contract **");
    /// MERKLE CONTRACT REACHED CONSENSUS ON ALIEN CHAIN
   
      for (let i=0; i<TxValidation.length; i++) {
        merkleProof = Object.values(TxValidation[i][2]);
       expect (await Listrack.connect(alfred)  // anyone can settle the Trade not only Alice
                      .aliceSettleTrade(TxValidation[i][0],TxValidation[i][1],
                       merkleProof,TxValidation[i][3],
                        secret))
                .to.emit(Listrack,"manualSecretTradeSettled");
      }
  
    
    console.log ("** Cross-chain tranfers completed **");
    console.log ("** Cross-chain tranfers completed **");

    return {drexSigners,alienSigners,merkleSigners,
      drexToken,alienToken,merkleContract,Listrack,alienListrack,
          equalbalance,timeSlotDrex,TxValidation,secret};
  
    }

    it("Mike unlock his funds in Alien Listrack",
          async function() {
          
              const {drexSigners,alienSigners,merkleSigners,
                  drexToken,alienToken,merkleContract,Listrack,alienListrack,
                  equalbalance,timeSlotDrex,TxValidation,secret} 
                  = await loadFixture (InitialSetupFixture);

                  const alfred      = drexSigners [0];
                  const bob         = drexSigners [1];
                  const alfredAlien = alienSigners[0];
                  const bobAlien    = alienSigners[1];

    console.log ("** Starting Mike Unlocking his Funds in Alien Listrack **");
    console.log ("** Starting Mike Unlocking his Funds in Alien Listrack **");
    
   // await time.increase(alienExpiration*timeSlotDrex); //
    // writing a transaction below in Listrack only to make slotTimechange
    console.log ('#########################');
    console.log (TxValidation.length);

    for (let i=0 ; i< TxValidation.length ; i++) {
    expect (await alienListrack.connect(alfredAlien)
    .mikeSettleTrade(TxValidation[i][0],secret)) // 
     .to.emit(alienListrack,"AlienSettled");
    }
   // }

  console.log ("** End **");
  console.log ("** End  **");

          });


  });


/*
it("",
    async function() {
    
    const {drexSigners,alienSigners,merkleSigners,
    drexToken,alienToken,merkleContract,Listrack,alienListrack,
    equalbalance} 
    = await loadFixture (InitialSetupFixture);


});
*/
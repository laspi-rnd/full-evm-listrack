const {expect} = require("chai");
const { ethers } = require("hardhat");
const { provider } = ethers.getDefaultProvider();

const timeSlotDrex = 20; // in seconds
const drexLeg = 2; // in time slot
const alienConfirmation = 3*drexLeg; // in time slot
const alienExpiration = 2*alienConfirmation; // in time slot


//import {hre} from "hardhat/types"
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Cross-Chain Transfers Between EVMs", function() {

async function InitialSetupFixture() {

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

  return {drexSigners,alienSigners,merkleSigners,
    drexToken,alienToken,merkleContract,Listrack,alienListrack,
        equalbalance};

  }

  
  

it("Alice must set the Tx in Drex without errors and Mike should lock Funds",
    async function () {
    
    const {drexSigners,alienSigners,merkleSigners,
    drexToken,alienToken,merkleContract,Listrack,alienListrack,
    equalbalance} 
    = await loadFixture (InitialSetupFixture);

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
          _txId = _txReceipt.logs[0].args[2];
          //console.log (_txReceipt.logs[0].args[2]);

          expect(_txId).to.not.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
            // Mike Agree Trade below
          expect (await (Listrack.connect(drexSigners[i+1]).mikeAgreeTrade(_txId)))
            .to.emit(Listrack,"lockedTxId");  
        }
});

it("Mike sets the same Tx already done by Alice >>> Tx must be reverted",
    async function() {
    
    const {drexSigners,alienSigners,merkleSigners,
    drexToken,alienToken,merkleContract,Listrack,alienListrack,
    equalbalance} 
    = await loadFixture (InitialSetupFixture);

    for (let i = 0; i < drexSigners.length-1; i++) {
        const _txId = await Listrack.connect(drexSigners[i]).setTrade(
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
          expect(_txId).to.not.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        }

    // in the below code Mike sends the transaction
  // but should be reverted because they are the same produced by Alice
  // it only works if the above code is enabled
  for (let i = 0; i < drexSigners.length-1; i++) {
    await expect (Listrack.connect(drexSigners[i+1]).setTrade(
      [drexSigners[i].address,
      drexSigners[i+1].address,
      drexToken.target],
      100000000000000,
      [merkleContract.target],
      [alienSigners[i].address,
      alienSigners[i+1].address,
      alienToken.target],
      100000000000000,
      '0x0000000000000000000000000000000000000000000000000000000000000000'))
      .to.be.revertedWith("The same transaction cannot be inserted while waiting for lock");
    }


});


it("Mike sends Drex Tx | Alice confirms Tx in Alien Chain | \
Merkle Root by Merkle Contract | Alice settles Tx in Drex",
    async function() {
    
        const {drexSigners,alienSigners,merkleSigners,
            drexToken,alienToken,merkleContract,Listrack,alienListrack,
            equalbalance} 
            = await loadFixture (InitialSetupFixture);

// Mike sends Tx in Drex
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
    '0x0000000000000000000000000000000000000000000000000000000000000000'))
    .to.changeTokenBalances(drexToken, [drexSigners[i+1],Listrack], [-500000000000000,500000000000000]);
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

   // this test was set as follows :
   // tx 0  : Alfred     => Bob (stored by Alfred)
   // tx 1  : Alfred     => Bob (stored by Bob)
   // tx 2  : Bob        => Charlie (stored by Bob)
   // tx 3  : Bob        => Charlie (stored by Charlie)
   // tx 4  : Charlie    => Debbie (stored by Charlie)
   // tx 5  : Charlie    => Debbie (stored by Debbie)
   // tx 6  : Debbie     => Eva (stored by Debbie)
   // tx 7  : Debbie     => Eva (stored by Eva)
   // tx 8  : Eva        => Frank (stored by Eva)
   // tx 9  : Eva        => Frank (stored by Frank)
   // tx 10 : Frank      => George (stored by Frank)
   // tx 11 : Frank      => George (stored by George)

    for (let i=0; i<1; i++) {
     await alienListrack.connect(alienSigners[i]).
      writeAlienLeg(tradesToPushAlien[i*2][0],tradesToPushAlien[i*2][1],
      tradesToPushAlien[i*2][2],tradesToPushAlien[i*2][3],
      tradesToPushAlien[i*2][4],tradesToPushAlien[i*2][5],
      tradesToPushAlien[i*2][6],tradesToPushAlien[i*2][7],
      tradesToPushAlien[i*2][8]);
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

  for (let i=txIdsAlienPushed.length-1; i<txIdsAlienPushed.length; i++) {
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

  console.log (TxValidation);

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
  console.log('Merkle Root : ' +merkleRoot);
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
    console.log ('Merkle Proof Tx: ', merkleProof);
   expect (await Listrack.connect(alfred)
                  .aliceSettleTrade(TxValidation[i][0],TxValidation[i][1],
                   merkleProof,TxValidation[i][3],
                    '0x0000000000000000000000000000000000000000000000000000000000000000'))
            .to.emit(Listrack,"manualTradeSettled");
  }

  console.log ("** Cross-chain tranfers completed **");
  console.log ("** Cross-chain tranfers completed **");

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
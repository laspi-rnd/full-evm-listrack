const {expect} = require("chai");
const { ethers } = require("hardhat");
const { provider } = ethers.getDefaultProvider();

const timeSlotDrex = 20; // in seconds
const drexLeg = 1; // in time slot
const alienConfirmation = 3*drexLeg; // in time slot
const alienExpiration = 2*alienConfirmation; // in time slot


//import {hre} from "hardhat/types"
const {
 loadFixture,
 time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Cross-Chain Transfer between EVMs", function() {

//async function deployInitialSetupFixture() {

it("Should Deploy Contracts | Tokens : Mint-Transfer-Aprove", async function() {

  /*
  function findEventArgs(logs, eventName) {
    let _event = null;
  
    for (const event of logs) {
      if (event.fragment && event.fragment.name === eventName) {
        _event = event.args;
      }
    }
    return _event;
  }
    */

  const [owner,alfred,bob,charlie,debbie,eva,frank,molly,
        alfredAlien,bobAlien,charlieAlien,debbieAlien,evaAlien,
        frankAlien,mollyAlien,
        oliver,paula,quincy,robert] = await ethers.getSigners();
  // //frank,george,harry,irene,jack,kelly,larry,nancy,
        // oliver to robert are the signers of Merkle Contract
  //,sally,tom,ursula,victor,wendy,xander,yvonne,zack] 
  

const drexSigners = [alfred,bob,charlie,debbie,eva,
                    frank,molly];
 // frank,george,harry,irene,jack,kelly,larry,mike,nancy,

const alienSigners = [alfredAlien,bobAlien,charlieAlien,debbieAlien,
                      evaAlien,frankAlien,mollyAlien];

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

//console.log (alienToken.address);
//console.log (alienSigners[0].address);

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

//await (drexToken.connect(alice).approve(Listrack, equalbalance));

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
};

  // the below code is for Alice to send the transaction without Mike agreeing in the first moment
  // it is working but for dev purposes it is commented
  /*
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
      .to.be.revertedWith("Transaction in standby waiting for locking funds");
    }

    */


    // in the below code Mike sends the transaction
    //  without being reverted
  

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
    

  tradesId = [];

  // each user can have several TxIds
  for (let i = 0; i < drexSigners.length; i++) {
    tradesId.push(await Listrack.
    connect(drexSigners[i]).getTxIdbyUser(drexSigners[i].address));
    }

    //console.log (tradesId);
  tradesToPushAlien = [];

    for (let i = 0; i < drexSigners.length; i++) {
      for (let j = 0; j < tradesId[i].length; j++) {
      const temp = await Listrack.
      connect(drexSigners[i]).getDrexAlienInputsbyId(tradesId[i][j]);
      //console.log("Drex drexAlice Address",temp[0][0]);
      //console.log("Drex drexMike Address",temp[0][1]);
      //console.log("Drex HashFields",temp[0][3]);
      //console.log("Previous Id",temp[0][11][4]);
      //console.log("Drex Confirmation index",temp[1]);
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
     // if (drexSigners[i].address == _alienAliceAddress) {
        // AliceAlienAddress is the only one who can write the leg in AlienChain
      tradesToPushAlien.push([_drexHashFields,_alienAliceAddress,
        _alienMikeAddress,_alienTokencontract,_alienAmount,
        _hashedSecret,_drexPreviousId,_drexTxIndex,_drexTxId,_drexAlienConfirmationIndex]);};
      }
     // }

   // console.log (tradesToPushAlien.length);
   console.log (tradesToPushAlien);
   txIdsAlienPushed = [];

    for (let i=0; i<alienSigners.length-1; i++) {
     await alienListrack.connect(alienSigners[i]).
      writeAlienLeg(tradesToPushAlien[i*2][0],tradesToPushAlien[i*2][1],
      tradesToPushAlien[i*2][2],tradesToPushAlien[i*2][3],
      tradesToPushAlien[i*2][4],tradesToPushAlien[i*2][5],
      tradesToPushAlien[i*2][6],tradesToPushAlien[i*2][7],
      tradesToPushAlien[i*2][8],tradesToPushAlien[i*2][9]);
      txIdsAlienPushed.push(tradesToPushAlien[i*2][8]);
      // drexSigners[i].sendTransaction({
    }


  //const latestAlienSlot = await alienListrack.connect(alfredAlien).getLatestBlock();
  //console.log (latestAlienSlot);

  //const merkleRoot = await alienListrack.connect(alfredAlien).createMerkleTree(latestAlienSlot,false,0);
  // console.log (merkleRoot[0]);


//function validateMerkleProof (bytes32 _txId, uint256 _txIndex, 
// bytes32[] memory _merkleProof, uint256 _alienBlock) private view returns (bool) {

TxValidation = [];


  for (let i=0; i<txIdsAlienPushed.length; i++) {
    const alienFeatures = await alienListrack.connect(alfredAlien)
                          .getTradeFeatures(txIdsAlienPushed[i]);
    const merkleProof = await alienListrack.connect(alfredAlien).
                          createMerkleTree(alienFeatures[0],true,alienFeatures[1]);
    TxValidation[i] = [txIdsAlienPushed[i],alienFeatures[1],merkleProof,alienFeatures[0]];
   // console.log (TxValidation[i]);
  }


  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN
  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN
  /// MERKLE CONTRACT LISTENING TO ALIEN CHAIN

  for (let i=0; i<merkleSigners.length-1;i++){
  // not all Merkle Signers are listenin to Transaction because only 70% are required for approval
  // if the last Merkle Signer sends the transaction it is reverted
  const latestSlot = await (alienListrack.connect(merkleSigners[i]).getLatestSlot());
  console.log (latestSlot);
  merkleRoot = await (alienListrack.connect(merkleSigners[i]).createMerkleTree(latestSlot,false,0));
  console.log(merkleRoot);
  await (merkleContract.connect(merkleSigners[i]).insertMerkleForApproval(merkleRoot[0],latestSlot));
  }


   /// MERKLE CONTRACT REACHED CONSENSUS ON ALIEN CHAIN
  
   /// SENDING TRANSACTIONS FOR SETTLEMENT IN DREX LISTRACK BY ALICE

   for (let i=0; i<TxValidation.length; i++) {
    merkleProof = Object.values(TxValidation[i][2]);
   expect (await Listrack.connect(alfred)
                  .aliceSettleTrade(TxValidation[i][0],TxValidation[i][1],
                  // [TxValidation[i][2][0],TxValidation[i][2][1],TxValidation[i][2][2]],
                   merkleProof,
                    TxValidation[i][3],
                    '0x0000000000000000000000000000000000000000000000000000000000000000'))
            .to.emit(Listrack,"manualTradeSettled");
   
  }


 //  function aliceSettleTrade(bytes32 _txId, uint256 _txIndex, bytes32[] memory _merkleProof, 
  //  uint256 _blockNumber, bytes32 _secretRevealed)


 // const merkleRoot = await alienListrack.connect(alfredAlien).createMerkleTree(latestAlienSlot,false,0);
  //console.log (merkleRoot[0]);

  //const merkleProof = await alienListrack.connect(alfredAlien).createMerkleTree(latestAlienSlot,true,0);
  //console.log (merkleProof);


  //console.log (txIdsAlienPushed);
  /*
  merkleProofs = [];
  for (let i=0; i<txIdsAlienPushed.length; i++) {

    const _merkleProof = await alienListrack.connect(alfredAlien)
                              .genMerkleProof(txIdsAlienPushed[i]);

    merkleProofs.push([txIdsAlienPushed[i],_merkleProof]);
  }

  console.log (merkleProofs[0]);
  */


//const txReceipt = trades_Id[i].wait();
    //console.log (txReceipt);
   // console.log(findEventArgs(txReceipt.logs, "tradeInserted"));
   // console.log(previousId,txIndex,txId);





 
 });  // end of Deploy Contracts | Tokens : Mint-Transfer-Aprove

//} // end of deployInitialSetupFixture

//describe("Setting Transactions in Drex", function() {

  //it("Should set TXs DrexListrack and receive Tx Parameters", async function() {

    
  
   // });
  
  



// });




}); // end of Cross-Chain Transfer GLOBAL VARIABLES





/* working block
const _txId = await Listrack.connect(drexSigners[0]).setTrade(
  [drexSigners[0].address,
  drexSigners[1].address,
  drexToken.target],
  100000000000000,
  [merkleContract.target],
  [alienSigners[0].address,
  alienSigners[1].address,
  alienToken.target],
  100000000000000,
  '0x0000000000000000000000000000000000000000000000000000000000000000');

  console.log (_txId);


  */
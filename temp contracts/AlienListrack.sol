// SPDX-License-Identifier: MIT
// one alien listrack for each token

// syncronization in HTLC is crutial before achieving Alice Funds return
// HTLC offers syncronization challenge for both alien and drex leg
// a smart contract cannot hold a secret hash
// confirming the alien leg cannot happen due to nodes blocking the transaction

// correct token value

pragma solidity ^0.8.24;

    import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

    // import "./utils/console.sol";

    import "hardhat/console.sol";

    import "./utils/math.sol";

 interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external returns (uint256);
        }

contract AlienListrack is ReentrancyGuard {

    // Event to emit when a alien trade is confirmed or canceled : alien ID
    event AlienSettled(bytes32 indexed _drexTxId, uint256 _alienBlock, uint256 _alienMerkleTxIndex);

    // Event to emit when a alien trade is confirmed or canceled : alien ID
    event AlienLocked(bytes32 indexed _drexTxId, uint256 _alienBlock, uint256 _alienMerkleTxIndex);

    event AlienRefunded(bytes32 indexed _drexTxId, address indexed _aliceAddress);

    // Event to emit when a alien trade is confirmed or canceled : alien Chain Merkle Tree
    // event MerkleHash (bytes32 indexed _MerkleHash);
    struct TxStatus {
        uint256 slotNumber;
        uint256 txIndex;
        bool    isSettled;
        address aliceAddress;
        address mikeAddress;
        uint256 alienAmount;
        bytes32 hashedSecret;
        uint256 timeStampInserted;
        bool    isRefunded;
    } 
    
    struct SlotStatus {
       // uint256 lowerLimitDrexIndexAlienConfirmation;
        uint256 currentSlot;
        //uint256 genesisSlot;
        uint256 lastTimeStamp; 
    }

    // address of the alien contract that holds tokens
    // there is only one alien smart contract for each token
    address tokenAddress;

    // Array of confirmed transactions stored in Contract for each block
    // number of block in Ethereum => confirmed Transactions
    // hashChainId[] public chainConfirmedTx;

    // number of block => vector of confirmed Txs in that block
    mapping (uint256 => bytes32[]) public chainConfirmedTx;

    // mapping Id of the Settled Transaction => block number and TxIndex and other parameters
    mapping (bytes32 => TxStatus) public transactions;

    // number of block => hash of the Merkle Tree of that block
    // computing the Merkle Tree of a block includes the hash of the previous Merkle Tree as the first Tx
    // mapping (uint256 => bytes32) public merkleHashes;

    uint256 public timeSlotConfirmation;
    // time in seconds for a new slot to be created in the Alien Chain accordingly to Alien Leg Confirmation

   
    uint256 public alienLegRefund;
    // alienLegRefund is the number of blocks to wait before refunding the alien leg
        // it is the time in blocks after alien leg confirmation and expiration
        // as this alien leg refund is due to Alice's fault,
        // it is recommended to set a high number of blocks greater
        // greater than ListrackExpiration - AlienConfirmation

    // block number
    //uint256 private lastBlockNumber;

    // Index of Pending Transactions most voted
    uint256 public drexConfirmationIndex;

    // last confirmation index before the current one
    //uint256 lastConfirmationIndex;

    // updated number of votes in each index - it tracks the most voted index
    uint256 private votesDrexIndex;

    // number of votes
    // alien block.number => confirmation index => number of votes
    mapping (uint256 => mapping(uint256 => uint256)) pollList;

    // below are the variables for syncronization
    // below are the variables for syncronization
    // below are the variables for syncronization
    // below are the variables for syncronization

    SlotStatus public slotProduction;
    // variable to control SlotProduction

    constructor(address _tokenAddress, uint256 _alienLegConfirmation,
                        uint256 _alienLegRefund) payable {
        // each AlienListrack is for a different alien Token
       // owner = msg.sender; // Set the contract deployer as the owner
       
        tokenAddress = _tokenAddress;

        timeSlotConfirmation = _alienLegConfirmation; // in seconds
         // in seconds accordingly to Listrack defaults
         // it is Recommended to be equal to Alien Expiration (Total Time of Both operations)

        alienLegRefund = _alienLegRefund; // in seconds
         // in seconds accordingly to Listrack defaults
         // it is Recommended to be equal to Alien Expiration (Total Time of Both operations)

        slotProduction.currentSlot = 0;
        //slotProduction.genesisSlot = slotProduction.currentSlot;
        slotProduction.lastTimeStamp = block.timestamp;

        console.log ("@@@ Alien Listrack Deployed at Slot : ", slotProduction.currentSlot);

    }

     // Function for Alice to complete her transfer
    // current smart contract must be previously authorized by Alice to transfer tokens
    // using function approve
    function writeAlienLeg (
        // below are the inputs generated by the agreed transaction
        bytes32 _drexHashFields,
        address _aliceAlienAddress,
        address _mikeAlienAddress,
        address _alientokencontract, // alien contract to transfer tokens
        uint256 _alienAmount,
        bytes32 _hashedSecret,
        /// below are the inputs generated by Drex Chain
        bytes32 _drexPreviousId,
        uint256 _drexTxIndex,
        bytes32 _drexTxId,
        // the user inputs its transaction index above and the vector of Pending Transactions below
        // _startPendingDrexId : first id Pending Transaction
        uint256 _drexAlienConfirmationIndex
        
    ) external payable nonReentrant //returns (bool) 
    {
        bool success=false;
        require((_alienAmount > 0), "Invalid ETH amount");
        require((_mikeAlienAddress != address(0)),"No Mike Address");

        bytes32 _compareHashFields = keccak256(
            abi.encodePacked(
                _drexHashFields,
                _aliceAlienAddress,
                _mikeAlienAddress,
                _alientokencontract, // alien contract to transfer tokens
                _alienAmount
               // _drexTxIndex
            )
        );  // _counter,

        _compareHashFields = keccak256(
            abi.encodePacked(
                _compareHashFields, 
                _hashedSecret,
                _drexTxIndex
            )
        );  // _counter,

        _compareHashFields = keccak256(
            abi.encodePacked(
                _drexPreviousId,
                _compareHashFields
            )
        );  // _counter,

        //console.log ("Entered Write Alien Leg");
        console.log (">> Drex Index", _drexTxIndex);
        console.log (">> Drex Index must be equal or higher than DrexAlien Index (informed by user) :"
        , _drexAlienConfirmationIndex);
        console.log (">> Drex Index must be equal or higher than DrexConfirmation Index (voted) :"
        , drexConfirmationIndex);
        //console.log ("Hashed Secret");
        //console.logBytes32 (_hashedSecret);

        require (msg.sender==_aliceAlienAddress,"Only Alice can send this Transaction");
        require (_compareHashFields==_drexTxId,"Drex Id Hash is not equal to the inputed parameters");
        require (_alientokencontract == tokenAddress,"This is not the alien contract for this token");
        require (!transactions[_drexTxId].isSettled,"transaction already settled");

        require (_drexTxIndex >= drexConfirmationIndex,"Alien Transaction is no more valid to Confirm");
        // too late to confirm the transaction

        // _txId is the hash of the confirmed transactions
        // chainIdChain is the previous _txId with the current _txId
        if (_hashedSecret==bytes32(0)) {
            if  (_alientokencontract == address(0)) {
            require(msg.value == _alienAmount, "Incorrect Alien amount sent");
            (success,)= payable(_mikeAlienAddress).call{value:_alienAmount}("");
                } else {
            success = IERC20(_alientokencontract).transferFrom(msg.sender,
            payable(_mikeAlienAddress),_alienAmount);
                }

            if (success) {
                updateDrexAlienSyncronization (_drexAlienConfirmationIndex,_alienAmount);
                chainConfirmedTx[slotProduction.currentSlot].push(_drexTxId);
                transactions[_drexTxId].slotNumber = slotProduction.currentSlot;
                transactions[_drexTxId].txIndex = chainConfirmedTx[slotProduction.currentSlot].length-1;
                transactions[_drexTxId].isSettled = true;
                transactions[_drexTxId].mikeAddress = _mikeAlienAddress;
                transactions[_drexTxId].aliceAddress = _aliceAlienAddress;
                transactions[_drexTxId].alienAmount = _alienAmount;
                transactions[_drexTxId].hashedSecret = _hashedSecret;
                transactions[_drexTxId].isRefunded = true;
                transactions[_drexTxId].timeStampInserted = block.timestamp;
                emit AlienSettled(_drexTxId,slotProduction.currentSlot,
                                    chainConfirmedTx[slotProduction.currentSlot].length-1);
                console.log ("** Alien Leg Settled **");
            }   
        // the below block is for HTLC transactions- values are locked in Alien Smart Contract
        } else {
            if  (_alientokencontract == address(0)) {
            require(msg.value == _alienAmount, "Incorrect Alien amount sent");
            (success,)= payable(address(this)).call{value:_alienAmount}("");
            } else {
            uint256 _allowance = IERC20(_alientokencontract).allowance(
                                msg.sender,address(this));
            require (_allowance>=_alienAmount, 
            "Alien Listrack was not previously allowed to transfer tokens");
            // mike must have previously allowed his token contract to transfer to DrexListrack.sol
        
            success = IERC20(_alientokencontract).transferFrom(
            msg.sender,payable(address(this)),_alienAmount);
                }

            if (success) {
                updateDrexAlienSyncronization (_drexAlienConfirmationIndex,_alienAmount);
                chainConfirmedTx[slotProduction.currentSlot].push(_drexTxId);
                transactions[_drexTxId].slotNumber = slotProduction.currentSlot;
                transactions[_drexTxId].txIndex = chainConfirmedTx[slotProduction.currentSlot].length-1;
                transactions[_drexTxId].isSettled = false;
                transactions[_drexTxId].mikeAddress = _mikeAlienAddress;
                transactions[_drexTxId].aliceAddress = _aliceAlienAddress;
                transactions[_drexTxId].alienAmount = _alienAmount;
                transactions[_drexTxId].hashedSecret = _hashedSecret;
                transactions[_drexTxId].isRefunded = false;
                transactions[_drexTxId].timeStampInserted = block.timestamp;
                emit AlienLocked(_drexTxId,slotProduction.currentSlot,
                                    chainConfirmedTx[slotProduction.currentSlot].length-1);
                console.log ("** Alien Leg Locked **");
            }  
        }
        // console.log ("Alien Leg Written ?",success); 
        //return success;  
    }

    function mikeSettleTrade(bytes32 _txId, bytes32 _secretRevealed 
        ) external payable nonReentrant {
        // ARRUMAR ABAIXO
        bool success = false;

        // anyone can send Mike funds to him again becaus
        // the tx is updated with refunded = true;
        // require (msg.sender == transactions[_txId].mikeAddress, "Only Mike can settle the trade");

        require (transactions[_txId].hashedSecret!=bytes32(0),"This is not a HTLC transaction");

        require(!transactions[_txId].isSettled, "Trade already settled");

        require (keccak256(abi.encodePacked(_secretRevealed)) == 
        transactions[_txId].hashedSecret, "Secret is not equal to Hashed Secret");

        if (tokenAddress == address(0)) {
            (success,)= payable(transactions[_txId].mikeAddress)
            .call{value: transactions[_txId].alienAmount}("");
            } else {
            success = IERC20(tokenAddress).
            transfer(payable(transactions[_txId].mikeAddress),
            transactions[_txId].alienAmount);
            }

        if (success) {
            transactions[_txId].isSettled = true;
            transactions[_txId].isRefunded = true;
            emit AlienSettled(_txId,transactions[_txId].slotNumber,
                                transactions[_txId].txIndex);
        }

        //require (block.number > transactions[_txId].blockNumber + alienLegRefund,
        //"Alien Leg Refund not yet available to Alice");

        }

        function aliceGetRefund (bytes32 _txId) external payable nonReentrant {
        // ONLY FOR HTLC TRANSACTIONS
        bool success = false;

        //require (msg.sender == transactions[_txId].aliceAddress,
        // "Only Alice can get the refund");

        require (transactions[_txId].hashedSecret!=bytes32(0),
        "This is not a HTLC transaction eligible for refund");

        require(!transactions[_txId].isRefunded, "Funds already have been refunded");

        require(!transactions[_txId].isSettled, "Trade already settled");

        require (block.timestamp > (transactions[_txId].timeStampInserted + alienLegRefund),
        "Refund is not yet available to Alice because expiration has not been achieved");

        if (tokenAddress == address(0)) {
            (success,)= payable(transactions[_txId].aliceAddress)
            .call{value: transactions[_txId].alienAmount}("");
            } else {
            success = IERC20(tokenAddress).
            transfer(payable(transactions[_txId].aliceAddress),
            transactions[_txId].alienAmount);
            }

        if (success) {
            transactions[_txId].isRefunded = true;
            emit AlienRefunded(_txId,transactions[_txId].aliceAddress);
        }
        }

    function updateDrexAlienSyncronization      (uint256 _confirmationIndex,
                                                uint256 _alienAmount) private {

        bool _successSum = false;

        //console.log ("Entered updateDrexAlien");
        //bool _successDiv = false;

        updateTimeSlot();

        // updating Confirmation Index
        (_successSum,) = Math.tryAdd // avoiding overflow
        (pollList[slotProduction.currentSlot][_confirmationIndex],_alienAmount);

        if (_successSum) pollList[slotProduction.currentSlot][_confirmationIndex] += _alienAmount;
        if (pollList[slotProduction.currentSlot][_confirmationIndex] > votesDrexIndex) {
            votesDrexIndex = pollList[slotProduction.currentSlot][_confirmationIndex];
            drexConfirmationIndex = _confirmationIndex;
        }

    }
    
    function updateTimeSlot () private {

        uint256 _ellapsedTime = block.timestamp - slotProduction.lastTimeStamp;
        console.log (">> ALIEN Ellapsed Time: ", _ellapsedTime);
        console.log (">> ALIEN Current Slot: ", slotProduction.currentSlot);  
        //console.log (">> Time Slot Confirmation: ", timeSlotConfirmation);
        if (_ellapsedTime>=timeSlotConfirmation) {
        console.log (">> ALIEN Creating new time slot");
        // for each new slot produced the head of the slot is written
        // console.log ("Creating new time slot"); 
        slotProduction.currentSlot+= ((_ellapsedTime*1000000)/timeSlotConfirmation)/1000000;
        // it increases the slot time by one in order to classify transactions
        console.log (">> ALIEN New Slot after Ellapsed Time Update: ", slotProduction.currentSlot);
        slotProduction.lastTimeStamp = block.timestamp;
        }
    }

    function createMerkleTree (uint256 _slotNumber,bool isProof,uint256 _proofIndex) 
    public view returns (bytes32[] memory) {

    uint _numberTx = chainConfirmedTx[_slotNumber].length;
    
    bytes32[] memory _data = new bytes32[](_numberTx);
    _data = chainConfirmedTx[_slotNumber];

    require(_data.length > 0, "No data to create Merkle tree");

    uint256 _tempLevel = _numberTx;
    uint256 _level = 0;

    while (_tempLevel > 1) {
        _tempLevel = (_tempLevel/2) + (_tempLevel % 2); 
        _level++;
    }
    
    bytes32[] memory _arrayProof = new bytes32[]((_level)); 
    _level = 0;
    // the array proof includes the Tx Id and does not include the Merkle Proof

    //console.log ("Slot Number: ",_slotNumber);
    //console.log ("Proof Index: ",_proofIndex);

    while (_data.length > 1) {
    
        bytes32[] memory temp = new bytes32[]((_data.length / 2) + (_data.length % 2));

        for (uint256 i = 0; i < _data.length; i += 2) {

            if (isProof) {
               // console.log ("Valor de i:", i);
            // block below stores the proofs
                for (uint256 j = i; j <= i+1; j++) {
                if (_proofIndex == j ) {
                //    console.log ("Valor de j :", j);
                //    console.log ("Valor de _proofIndex", _proofIndex);
                //    console.log ("Proof Index %2 :", (_proofIndex % 2));
                    if ((_proofIndex % 2) == 0 ) {
                        //console.log("Level Inside loop:",_level);
                        //console.log ("j + 1", j+1);
                        //console.log ("Data Lenght",_data.length);
                        //console.logBytes32 (_data[j+1]);
                        if ((j+1 == _data.length)) { // when there are no more elements in right - repeat
                        _arrayProof[_level] = _data[j]; 
                        // repeating the element in the right whether there are no more elements                  
                        } 
                        else {
                        _arrayProof[_level] = _data[j+1];
                        }
                    } else {
                        //console.log("Level Inside loop:",_level);
                        //console.log ("j - 1", j-1);
                        //console.logBytes32 (_data[j-1]);
                        _arrayProof[_level] = _data[j-1];
                    } 
                _level ++;
                }
                }
            }

            // computing Hashes for Proofs and Merkle Tree
            if (i + 1 < _data.length) {
            temp[i / 2] = keccak256(abi.encodePacked(_data[i], _data[i + 1]));
            } else { // if there is an odd number of elements, hash the last one with itself
            temp[i / 2] = keccak256(abi.encodePacked(_data[i], _data[i]));
            }
        }
        _data = temp;
        _proofIndex /=2;
    }
     // https://volito.digital/implementing-a-merkle-tree-in-solidity-a-comprehensive-guide/
    // the above merkle tree was adapted from the above link and corrected
    // the merkle proof was also include in this code because it was not part of the original code
    if (isProof) {
        return _arrayProof;
    } else return _data;
    }

    function getTradeFeatures (bytes32 _txId) public view returns (TxStatus memory) {
        return transactions[_txId];
    }

    function getLatestSlot () public view returns (uint256) {
        return slotProduction.currentSlot;
    }

    
}

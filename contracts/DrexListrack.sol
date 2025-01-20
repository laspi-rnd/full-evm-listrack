// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; 

    import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";
    import "hardhat/console.sol";
    //import "./utils/console.sol";

    // ATTENTION TO OVERFLOW!!! STILL REQUIRES AUDIT
    //import "./utils/math.sol";
   
    // common interface to Token Contracts
    interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external returns (uint256);
        }

    // interface to DrexMerkle, which votes for Merkle Root of transactions in Alien Chain
    // the function returns a confirmation bytes4 and the Merkle Root of transactions (bytes32)
    interface IgetMerkleRoot {
    function getRootByBlock (uint256 blockNumber) external view returns (bytes4, bytes32);
    }

    // Alice is the name of the user which holds Alien (external) coins
    // Mike is the name of the user which holds Drex coins (Brazilian CBDC)

    // Alien Chain is a external blockchain
    // Drex chain is the permissioned ledger of Brazilian CBDC

    // !!! Mike must have previously approved transfer to current smart contract whether using tokens
    // !!! Mike must have previously approved transfer to current smart contract whether using tokens
    // The Script Test does this task

    // Each agreement between Alice and Mike also involves agreeing in a trustful Merkle Contract
    // The users have the choice to select the most proper trustful nodes that are going to listen
    // to the Alien Chain (Merkle Contracts)
    // Each trade can have several Merkle Contract to enhance trust and reliability

    // Each Trade has its own TxId, which is unique and replicable in Alien Chain
    // Trades are inserted in a chain, with its TxId as a result from previous TxId plus hashed fields
    // The chain ensures that indexes can be monitored in Alien Chain, ensuring that they can only
    // be inserted whether they are not expired yet

    // transactions are clustered in time slots, which reproduce the usual expiration times
    // each time slot has a Transaction which is the head of the slot
    // the head of the slot is a Tx Index that is monitored by voting in Alien Chain, allowing or not
    // new transactions. The vote process is based on succesfull locks or transfers

    // The upper limits for expirations deadlines in DrexListrack are fixed => they are not set by users
    // The fixed time allows to create a chain of transactions in Drex that can be used in alien chain 
    // The slot time in Alien Chain is also fixed, following Drex parameters

    contract DrexListrack is ReentrancyGuard {

    // this event happens when a Trade is Inserted, showing the users and its TxId
    event tradeInsertedUsersTxId    (address indexed aliceDrexAddress,
                                    address indexed mikeDrexAddress,
                                    bytes32 indexed TxId);

    // this event happens when a Trade is inserted, showing the TxId, its position in Drex chain
    // and the previous TxId in the Drex Chain
    event tradeInsertedTxId         (bytes32 indexed previousTxId,
                                    uint256 indexed txIndexDrex,
                                    bytes32 indexed TxId);

    // Event to emit when a new lot is produced and generates a slot head transaction
    // this slot head in a time slog allows inserting or not new transaction in alien chain
    event drexIndexAlienConfirmation    (uint256 indexed drexAlienIndexConfirmation);
                               // uint256 indexed drexAlienIndexConfirmationBlock);

    // Event to emit when a TxId is locked in Drex by Mike
    event lockedTxId (bytes32 indexed TxId);

    // Event to emit when a TxId is manually settled using secret hash
    event manualSecretTradeSettled(bytes32 indexed TxId, bytes32 indexed SecretRevealed);

    // Event to emit when a TxId is manually settled
    event manualTradeSettled(bytes32 indexed TxId);

    // Event to emit when a TxId is settled using Merkle Contracts
    event automaticTradeSettled(bytes32 indexed TxId);

    // Event to emit when a TxId is reverted returning funds back to Mike
    event tradeReverted(bytes32 indexed TxId);


    struct SlotStatus {
        // Time struct holding information of slot time production

        // this feature holds the lowest index of Tx that is still capable of being
        // inserted in Alien Chain
        // if a Trade holding a TxIndex lower than this this LowerLimit is inserted in alien chain
        // the transaction is reverted
        uint256 lowerLimitDrexIndexAlienConfirmation;
        uint256 currentSlot;
        uint256 genesisSlot;
        uint256 lastTimeStamp; 
    }

    struct StatusChain {
        // status of each Tx in Drex chain of transactions
        bool    locked;
        bool    settled;
        uint256 slotNumber;
        uint256 chainPosition;
        bytes32 previousChainTxId;
    }
        
    // Structure to hold trade details
    struct Trade {
        address     aliceDrexAddress;
        address     mikeDrexAddress;

        // drexToken address, which can be digitalReal or other DrexToken
        // if address(0), the Trade involves only native Drex (wholesale Drex)
        address     drexTokenAddress;

        bytes32     drexHashFields;  
        address     aliceAlienAddress;
        address     mikeAlienAddress;

        // alienToken address, which can be any token in alien Chain
        // if address(0), the Trade involves only native coins in Alien Chain (e.g Ether)
        address     alientokencontract;

        uint256     drexAmount;
        uint256     alienAmount;

        // hashed secret is the hash of a secret that is hashed again
        // for inserting in Listrack
        // secret hash is hashed twice for ensuring that the input is bytes32 input
        // this is used for a boosted HTLC without common risks such as syncronization
        bytes32     hashedSecret;
        
        // Drex Merkle Contract is a array of trustful smart contracts in Drex that listen to alien chain
        // this list of Merkle contracts is a agreement between Alice and Mike
        // if one contract fails to confirm the transaction, the following can make this confirmation
        // only trustfull contracts can be included in this list, which are kept by Drex Nodes
        address[]   drexMerkleContract;

        // status of the Tx, informing whether it is locked, settled,
        // position in the chain, previous TxId in Drex Chain and the slot number it belongs
        StatusChain statusChain;
    }

    //** TIME VARIABLES **//

    // time Slot mimics the behavior of creating blocks, classifying transactions
    // in groups that are clustered by time periods
    uint256 timeSlot;

    // Slot features containing 
    // currentSlotNumber, genesisSlot, lastTimeStamp and
    // lowerLimitDrexConfirmation Index in chainDrexTx for keeping alien chain syncronized
    // with the updated index in chainDrexTx still capable of confirming a Tx in alien chain
    SlotStatus public slotProduction;

    // Drex Leg in slots defined by constructor
    uint256 public drexLegExpiration;

    // Alien confirmation in slots required for confirming a transaction in alien chain
    uint256 private alienConfirmation;

    // listrackExpiration in slots required for cancelling a Listrack transaction in both chains
    uint256 private listrackExpiration;

    bool leftIndex_0 = false;
    // this boolean controls update Chain when the block head index moves to a number rather than zero
    
    // ** TRADE VARIABLES ** //

    // this mapping stores pending transactions in Listrack
    // pending transactions : _hashFields (fields of Tx without _secretHash and Tx position) => Tx_Id 
    // TxId = previous TxId + _hashFields Position (_hashFields + TxIndex + _secretHash)
    // this variable is required for not storing the same Tx twice, which is ensured by _hashFields (key)
    mapping (bytes32 => bytes32) public pendingTransactions;

    // Mapping to track the trades
    // bytes 32 is TxId
    mapping (bytes32 => Trade) public trades;

    // chain that registers Listrack transactions in Drex
    // this chain avoids double spending // this chain stores every Tx in Drex
    bytes32[] public chainDrexTx;

    // _chain TxId of the previous chainDrexTx
    bytes32 private previousChainTxId; 
    
    // mapping for slot heads
    // each slot head contains the TxIndex of chainDrexTx that initiates that slot
    // slot number => index of Tx in chainDrexTx
    mapping (uint256 => uint256) slotHeadTxIndex;

    // transactions structured by public key of the counterparties
    // it links counterparty address => array of Tx Ids
    mapping (address => bytes32[]) public transactionsbyUser;

   
    // ** MERKLE CONTRACTS VARIABLES **//

    // mapping that stores for each Merkle Contract specific slots that contain
    // all expiring TxIds that expire in that slot
    // Merkle Contract => Slot Number => Array with TxIds that expires in that slot
    mapping (address => mapping (uint256 => bytes32[])) private merkleContractRevert;

    // mapping that stores the latest slot number that was subject to confirmation by
    // a Merkle Contract
    // as each Tx is confirmed and settled by each Merkle Contract,
    // it updates the last confirmed slot of those Txs in order to revert old transactions
    // this variable restricts confirmed slots only by the Merkle Contracts that are allowed
    // by the counterparties to do such task
    // mapping (address => uint256) private lastConfirmedSlotByMerkleContract;

    // it stores the last Reverted Slot by each Merkle Contract
    mapping (address => uint256) private lastRevertedSlotByMerkleContract;

    // ** CONSTRUCTOR ** //
    constructor (uint256 _timeSlot, uint256 _drexLegExpiration, 
                uint256 _alienConfirmation, uint256 _listrackExpiration) payable {
        
        // timeSlot => time in seconds to group a number of transactions in Drex
        // that mimics a block

        // Drex Leg Expiration => time in slots that the Drex Leg expires

        // Alien Confirmation => time in slots that Alien Leg must be confirmed
        // it must be greater than 3* Drex Leg Expiration | IT INCLUDES DREX LEG

        // Listrack Expiration => time in slots that Listrack is cancelled in both chains

        //              => Drex Leg  | =>=>  Alien Leg | =>=>=>=> Listrack  Expiration |
        //                 1 slot    |2 slots          |  3 slots                      |
        //Time Ellapsed    1 slot    |3 slots ellapsed |  6 slots ellapsed             |
        //Time Ellapsed        Alien Confirmation      |  Alien Leg Expiration         |
        //Time Ellapsed                       Alien Expiration                         |
        
        // timeSlot mimics a block production based on time
        // it classifies transactions in block times for reverting 
        // and other related transactions

        require (_alienConfirmation >= 3*_drexLegExpiration,"Alien Confirmation must be at least 3 times Drex Leg");
        require (_listrackExpiration >= 2*_alienConfirmation,"Alien Expiration must be at least 6 times Drex Leg");

        timeSlot = _timeSlot;  // in seconds

        // drexLegExpiration in slots
        drexLegExpiration = _drexLegExpiration;
        
        // drexLegConfirmation in slots
        alienConfirmation = _alienConfirmation;
        
         // drexLegExpiration in slots
        listrackExpiration   = _listrackExpiration;
       
        // current slotNumber for constructor is a number > 0
        // to avoid overflow in negative numbers
        slotProduction.currentSlot = listrackExpiration+1; 
        // other setup functions for Slot are done below
        slotProduction.genesisSlot = slotProduction.currentSlot;
        slotProduction.lowerLimitDrexIndexAlienConfirmation = 0;
        slotProduction.lastTimeStamp = block.timestamp;

        slotHeadTxIndex[slotProduction.currentSlot] = 0;

        console.log ("@@@ Drex Listrack deployed at Slot : " ,slotProduction.currentSlot);

    }

    // Function for ANYONE TO SET SPECIFIC TX DETAILS BETWEEN COUNTERPARTIES
    // the function allows anyone to set trade details 
    // ANYONE as a msg.sender can allow smart contracts to set trades
    function setTrade(
        // 3 addresses: Alice, Mike, DrexToken
        address [] memory _drexAddresses,
        // address _aliceDrexAddress,
        // address _mikeDrexAddress,
        // address _drexTokenAddress,  // drex token contract to transfer Drex Tokens
        uint256 _drexAmount,
        address[] memory _drexMerkleContract,
        // 3 addresses: Alice, Mike, AlienToken
        address [] memory _alienAddresses, 
        //address _aliceAlienAddress,
        //address _mikeAlienAddress,
        //address _alientokencontract, // alien contract to transfer Alien tokens
        uint256 _alienAmount,
        // _hashedSecret is required for boosted HTLC transactions
        bytes32 _hashedSecret
        
    ) external payable {
       // it does not require to be NonReentrant because the same msg.sender
       // can send the same TxId several times - only the last one one will be considered
       // the most important is that this function does not transfer funds
       // MikeAgree trade locks funds to DrexListrack, but is not required to be NonReentrant
       // because it will not accept to lock a transaction already locked
       

        require(_drexAmount > 0, "Invalid Drex amount");
        require(_alienAmount > 0, "Invalid Alien amount");

        bytes32 _drexHashFields = bytes32(0);
       
        // hashing the  Merkle Contract List
        require (_drexMerkleContract.length!=0,"At least One Master Merkle Contract is required");
        for (uint256 i=0; i < _drexMerkleContract.length;i++) {
            _drexHashFields = keccak256(abi.encodePacked(
            _drexHashFields,_drexMerkleContract[i]));  
        }
        
        // hashing drexHashFields that is required as a input in AlienListrack
         _drexHashFields = keccak256(
            abi.encodePacked(
                _drexAddresses[0],
                _drexAddresses[1],
                _drexAddresses[2],
                _drexAmount,
                _drexHashFields
            )
        );  

            //console.log ("First Hash");
            //console.logBytes32(_drexHashFields);
            //console.log("Chain Pending Tx length - This is the position",(chainDrexTx.length));
        
        bytes32 _hashFields = keccak256(
            abi.encodePacked(
                _drexHashFields,
                _alienAddresses[0],
                _alienAddresses[1],
                _alienAddresses[2], // alien contract to transfer tokens
                _alienAmount  // _nonce
            )
        );  // _counter,

        bytes32 _hashFieldsPosition = keccak256(
            abi.encodePacked(
                _hashFields,
                // hashedSecret is hashed here to avoid two identical txs in Pending Transactions
              _hashedSecret,
               chainDrexTx.length
            )
        );  // _counter,

        // HASHES FOR TX IDS
        // hash of Drex Fields + Hash of Alien Fields + Hash of Tx Index = Hash TxIndex

        //  console.log ("Pending Hash_Fields");
        //  console.logBytes32(_hashFields);

         if (chainDrexTx.length==0) {
        previousChainTxId = _hashFieldsPosition;   
        } else {
        previousChainTxId = chainDrexTx[chainDrexTx.length-1];
        }

        // the below code is the chain of Pending Transactions
        // using the previous Id hashed with the current Hash of Input Fields of Set Trade
         bytes32 _txId = keccak256(
            abi.encodePacked(
                previousChainTxId,
                _hashFieldsPosition  // Id is built using last Id of the previous transaction
            )
        ); 

        //console.log ("Hashes Ok | _hashFields :");
        //console.logBytes32 (_hashFields);

        //console.log ("Hashes Ok | _hashFieldsPosition :");
        //console.logBytes32 (_hashFieldsPosition);

        //console.log ("Hashes Ok | Tx Id :");
        //console.logBytes32 (_txId);

        // registering the transaction in the mapping hash_Fields => _txId
        // at first if verifies if transaction is already registered as pending transaction
        if (pendingTransactions[_hashFields]==bytes32(0)) {
            // this block occurs if this transaction is not registered yet in Pending Transactions

            // stores the Tx Fields in pendingTransactions
            pendingTransactions[_hashFields]=_txId;

            // stores the pending transaction in chainDrexTx
            chainDrexTx.push(_txId);
           
            } else {
            // it only applies for transactions with same hash 
            // it verifies whether current Pending Transaction can be replaced by another

            require (!trades[pendingTransactions[_hashFields]].statusChain.locked,
                    "Transaction already locked");
            
            require (slotProduction.currentSlot - 
                    trades[pendingTransactions[_hashFields]].statusChain.slotNumber >
                    drexLegExpiration,
            // transaction can only be replaced whether drexExpiration has been achieved!
            // transaction can only be replaced whether there isn't another in standby before expiration
            // it only applies for transactions with same hash containing same fields
            // it avoids replicating the same transaction in different TxIds and 
            // prevents Mike from Locking funds in two identical transactions with different TxIds
                    "The same transaction cannot be inserted while waiting for lock");
            
            // stores the Tx Fields in pendingTransactions
            pendingTransactions[_hashFields]=_txId;

            // stores the pending transaction in chainDrexTx
            chainDrexTx.push(_txId);
            }

        transactionsbyUser[_drexAddresses[0]].push(_txId);
        transactionsbyUser[_drexAddresses[1]].push(_txId);
        

        //console.log ("Chain Pending Tx updated : new length: ", chainDrexTx.length);
        //console.log ("Position of the current Trade is length : ",chainDrexTx.length-1);
        //console.log ("Beginning to register the trade");

        trades[_txId] = Trade({
            aliceDrexAddress            : _drexAddresses[0],
            mikeDrexAddress             : _drexAddresses[1],
            drexTokenAddress            : _drexAddresses[2],
            drexMerkleContract          : _drexMerkleContract,
            drexHashFields              : _drexHashFields,
            aliceAlienAddress           : _alienAddresses[0],
            mikeAlienAddress            : _alienAddresses[1],
            drexAmount                  : _drexAmount,
            alienAmount                 : _alienAmount,
            alientokencontract          : _alienAddresses[2],
            hashedSecret                : _hashedSecret,
            statusChain                 : StatusChain({ locked:false,settled:false,
                                                       chainPosition:chainDrexTx.length-1,
                                                        previousChainTxId : previousChainTxId, 
                                                        slotNumber:slotProduction.currentSlot})
        }) ;

        //  console.log("Position of the Trade in the chain Id : ", 
        //  trades[_txId].statusChain.chainPosition);

        //  console.log("Drex Merkle Contract One",trades[_txId].drexMerkleContract[0]);
        //  console.log("Drex Merkle Contract Two",trades[_txId].drexMerkleContract[1]);

     //   console.log         ("# Trade Registered :");
     //   console.logBytes32  (_txId);

        // Mike can automatically lock transaction whether he is the sender
        if (msg.sender == _drexAddresses[1]) {
            mikeAgreeTrade (_txId);
            // if Mike does not have enough funds the transaction is not either
            // registered (set) or locked because mikeAgreeTrade has require functions inside
        }   else {
            updateChain (chainDrexTx.length-1);
            }

        // Event are only emitted whether every require succeeds in previous statements
        emit tradeInsertedUsersTxId     (_drexAddresses[0],_drexAddresses[1],_txId);
        emit tradeInsertedTxId          (previousChainTxId,chainDrexTx.length-1,_txId);
        
        //console.log ("Drex Hash Fields");
        //console.logBytes32 (_drexHashFields);
        //console.log ("Drex Previous Id");
        //console.logBytes32 (previousChainTxId);
        //console.log ("Drex Tx Index", chainDrexTx.length-1);
        //console.log ("Drex Tx Id");
        //console.logBytes32 (_txId);
       // console.log ("Drex Alien Confirmation Index",
       // slotProduction.lowerLimitDrexIndexAlienConfirmation);
    }

    // Function for Mike to agree on Alice's terms and lock his DREX
    function mikeAgreeTrade (bytes32 _txId) public payable { // nonReentrant
    // mikeAgreeTrade does not require to be nonReentrant because the risk belongs to Mike
    //  returns (bool) {
        bool _success = false;
        // clean storage trade eventually 

        require(trades[_txId].aliceDrexAddress != address(0), "Trade does not exist");
        require(trades[_txId].mikeDrexAddress == msg.sender, "Unauthorized to lock funds");
        require(!trades[_txId].statusChain.locked, "Trade is already locked");

        // verifying if transaction is not expired yet for Drex leg
        require((slotProduction.currentSlot-trades[_txId].statusChain.slotNumber)
                < drexLegExpiration ,"Drex leg already expired");

        // transfer to current smart contract
        if (trades[_txId].drexTokenAddress == address(0)) {
            require(msg.value == trades[_txId].drexAmount, "Incorrect DREX amount sent");
            (_success,)= payable(address(this)).call{value: msg.value}("");
            } else {
            uint256 _allowance = IERC20(trades[_txId].drexTokenAddress).allowance(
                                msg.sender,address(this));
            require (_allowance>=trades[_txId].drexAmount, 
            "Drex Listrack was not previously allowed to transfer tokens");
            // mike must have previously allowed his token contract to transfer to DrexListrack.sol
            
            _success = IERC20(trades[_txId].drexTokenAddress).transferFrom(
            msg.sender,payable(address(this)),trades[_txId].drexAmount);
        }
        if (_success) {
        trades[_txId].statusChain.locked = true;
    
        if (trades[_txId].hashedSecret==bytes32(0)) {
        storeTxIdPerMerkleContractToRevert(_txId); 
        // merkle contracts are only valid for non HTLC transactions
        // the function above allows Merkle Contracts to make automatic operations
        } 
        emit lockedTxId(_txId);
        updateChain (trades[_txId].statusChain.chainPosition);
        //console.log ("!!!!!!!! LOCKED Transaction Successful : ");
        //console.logBytes32(_txId);
        }
        // return (_success);
    }

        // Alice confirms a trade informing Merkle Tree
        function aliceSettleTrade(bytes32 _txId, uint256 _txIndex, bytes32[] memory _merkleProof, 
        uint256 _blockNumber, bytes32 _secretRevealed) public payable nonReentrant {
        //returns (bool) {
        // Important : anyone can settle the Transaction informing the Merkle Proof! 
        // Any msg.sender, not only Alice, can send Tx for settlement
        bool success = false;
        Trade memory trade = trades[_txId];

        require(trade.aliceDrexAddress != address(0), "Trade does not exist");
        require(trade.statusChain.locked, "Trade is not locked");
        require(!trade.statusChain.settled, "Trade already settled");

        require (validateMerkleProof (_txId, _txIndex, _merkleProof,_blockNumber),
        "Transaction not settled in Alien Chain");

        // verifying Hashed Secret
        if (trade.hashedSecret!=bytes32(0)) {
        require (keccak256(abi.encodePacked(_secretRevealed)) == trade.hashedSecret,
         "Secret Hashed is not equal to Hashed Secret of the Transaction");
        }
        
        // transfer Mike Drex to Alice Drex Address
        if (trade.drexTokenAddress == address(0)) {
            (success,)= payable(trade.aliceDrexAddress).call{value: trade.drexAmount}("");
            } else {
            success = IERC20(trade.drexTokenAddress).transfer(payable(trade.aliceDrexAddress),
            trade.drexAmount);
            }

        if (success) {
        trades[_txId].statusChain.settled = true; // Mark the trade as settled
        trades[_txId].statusChain.locked = false; // There are no more locked assets in Listrack
            if (trade.hashedSecret!=bytes32(0)) {
                    emit manualSecretTradeSettled (_txId,_secretRevealed);
            } else  emit manualTradeSettled (_txId);
            
        } else {
            console.log ("Transaction Failed | Id below");
            console.logBytes32(_txId);
            revert("Transaction settlement failed");
        }
        //return (success);
    }

    function sendTxForSettlement(bytes32[] memory _transactions) 
    external payable nonReentrant // returns (bool[] memory) 
        { 
        // this function allows a Merkle Contract to send multiple transactions
        // to be automatically settled
        // require that msg.sender = a specific Merkle Contract
        // bool[] memory success = new bool[](_transactions.length);

        for (uint256 i=0; i< _transactions.length ; i++) {
            
        // success[i] = false;
        bool _success = false;
         // it verifies whether the sending contract to this function
         // is a valid Merkle Contract authorized by both parties   
        if (isValidMerkleContract(_transactions[i],msg.sender)) {
        Trade memory trade = trades[_transactions[i]];

        if (trade.hashedSecret != bytes32(0)) continue; 
        // Automatic Settlement not allowed for HTLC - goes to next transaction

        if (trade.aliceDrexAddress == address(0)) continue; 
        // Trade does not exist - goes to next transaction

        if (!trade.statusChain.locked) continue; 
        // Trade must be locked - goes to next transaction

        if (trade.statusChain.settled) continue;
        // Trade already settled - goes to next transaction

        // transfer Mike Drex to Alice Drex Address through current smart contract
        if (trade.drexTokenAddress == address(0)) {
            (_success,)= payable(trade.aliceDrexAddress).call{value: trade.drexAmount}("");
            } else {
            _success = IERC20(trade.drexTokenAddress).transfer(payable(trade.aliceDrexAddress),trade.drexAmount);
            }

        if (_success) {
        trades[_transactions[i]].statusChain.settled = true; // Mark the trade as settled
        trades[_transactions[i]].statusChain.locked = false; // There are no more locked assets in Listrack
         emit automaticTradeSettled(_transactions[i]);

         // the below statemente assumes that the Merkle Contract is being capable
         // of reading the alienstate due to having success in confirming alien Txs
         /*
         if (trade.statusChain.slotNumber > lastConfirmedSlotByMerkleContract[msg.sender]) {
         lastConfirmedSlotByMerkleContract[msg.sender] = trade.statusChain.slotNumber;
         // the above statement updates the last confirmed block by the msg.sender Merkle Contract
         }
         */
        } 
        }
        }
        // revertTxsbyMerkleContract (msg.sender);
        // the above statement automatically reverts old 
        // transactions that are expired in this Merkle Contract
        // returning funds to Mike
        // return (success);
    }

    // function to revert Mike locked Funds whether funds have expired due to
    // Listrack expiration
    function mikeManualRevert (bytes32 _txId) external payable nonReentrant {
        bool success = false;
        
      //  require(trades[_txId].mikeDrexAddress == msg.sender,
      //   "Unauthorized - Only Mike can revert");
      // anyone can revert the Mike Tx whether he has this right to receive

      console.log ("Entered Manual Revert : Trade Id");
      console.logBytes32(_txId);
         
        require(!trades[_txId].statusChain.settled, 
        "Trade already settled");

        require(trades[_txId].statusChain.locked, 
        "Trade not locked yet to revert");

        //console.log (">> Current Slot :",slotProduction.currentSlot);
        //console.log (">> Tx Slot :", trades[_txId].statusChain.slotNumber);
        //console.log (">> Listrack Expiration :", listrackExpiration);

        require((slotProduction.currentSlot-trades[_txId].statusChain.slotNumber)
                >= listrackExpiration ,"Listrack transaction not expired yet");
        
        if (trades[_txId].drexTokenAddress == address(0)) {
            (success,)= payable(trades[_txId].mikeDrexAddress).call
            {value:trades[_txId].drexAmount}("");
            } else {
            success = IERC20(trades[_txId].drexTokenAddress).transfer(
            payable(trades[_txId].mikeDrexAddress),trades[_txId].drexAmount);
            }
        if (success) {
        trades[_txId].statusChain.locked = false; 
        trades[_txId].statusChain.settled = false;
        emit tradeReverted(_txId);
        }
    }

    function revertTransaction (bytes32 _txId) private
        returns (bool) {
        bool success = false;

        // require cannot be used below because it would stop
        // the loop from Merkle Contract in revertTxsByMerkleContract
        // Transaction must be locked
        if (trades[_txId].statusChain.locked==true) { 
            //Transaction cannot be already settled
            if (trades[_txId].statusChain.settled==false) { 
                if (trades[_txId].drexTokenAddress == address(0)) {
                    (success,)= payable(trades[_txId].mikeDrexAddress).call
                    {value:trades[_txId].drexAmount}("");
                } else {
                    success = IERC20(trades[_txId].drexTokenAddress).transfer(
                    payable(trades[_txId].mikeDrexAddress),
                    trades[_txId].drexAmount);
                }
        if (success) emit tradeReverted(_txId);
        }
        }
        return (success);
    }
    
    function revertTxsbyMerkleContract (address _merkleContract)
    // this function reverts transactions that are expired in the Merkle Contract
    // based on the last confirmed block by the Merkle Contract
    // this is done rather than unlocking several transactions simultaneously
    // due to gas costs in Drex that should be charged to a Merkle Contract
    external nonReentrant {
       // uint256 _drexConfirmedSlotNumber = lastConfirmedSlotByMerkleContract[_merkleContract];
        uint256 _upperLimitSlotToRevert = slotProduction.currentSlot-listrackExpiration;
        uint256 _lastSlotReverted = lastRevertedSlotByMerkleContract[_merkleContract];
       // console.log (">> Upper Slot Limit to Revert", _upperLimitSlotToRevert);
       // console.log (">> lastRevertedSlotByMerkleContract ", lastRevertedSlotByMerkleContract[_merkleContract]);
        if (_upperLimitSlotToRevert > lastRevertedSlotByMerkleContract[_merkleContract]) {
        // this conditional verifies whether time has passed through avoiding unnecessary calls
       // console.log ("Automatically Reverting started");
        for (uint256 i = lastRevertedSlotByMerkleContract[_merkleContract]+1; 
                i<=_upperLimitSlotToRevert; i++) { // loop iterating through blocks not reverted
         //   console.log ("Number of slot to Revert", i );
           // console.log ("Number of Txs to Revert", merkleContractRevert[_merkleContract][i].length);
            for (uint256 j=0 ; j < merkleContractRevert[_merkleContract][i].length ; j++) {
                // loop iterating through transactions to revert in each block
            bool _success = false;
            // merkleContractRevert is a mapping that stores for each Merkle Contract one specific Block
            // that contain all expiring TxIds that are expiring in that block
          //  console.log ("Tx to Revert :");
          //  console.logBytes32 (merkleContractRevert[_merkleContract][i][j]);
            _success = revertTransaction (merkleContractRevert[_merkleContract][i][j]);  
             if ((_success) && (i > _lastSlotReverted)) _lastSlotReverted = i;
            }
                }
        lastRevertedSlotByMerkleContract[_merkleContract] = _lastSlotReverted;   
       // console.log ("Last Slot Reverted:", _lastSlotReverted);
        }
    }

    function isValidMerkleContract (bytes32 _txId, address _merkleContract)
    private view returns (bool) {
    bool _success = false;
        for (uint i=0 ; i < trades[_txId].drexMerkleContract.length ; i++) {
        if (trades[_txId].drexMerkleContract[i] == _merkleContract) {
            _success = true;
            break;
        }
        }
    return _success;
    }


    function validateMerkleProof (bytes32 _txId, uint256 _txIndex, 
    bytes32[] memory _merkleProof, uint256 _blockNumber) public view returns (bool) {

        bytes32 _hash = _txId;
        bool _success = false;
        bytes4 _successfullCall = bytes4(0);
        bytes4 _magicNumber = 0x1626ba7e;
        bytes32 _returnedRoot;

         for (uint i=0; i < _merkleProof.length; i++) {
            if (_txIndex % 2 == 0) {
                _hash = keccak256(abi.encodePacked(_hash,_merkleProof[i]));
            } else {
                _hash = keccak256(abi.encodePacked(_merkleProof[i],_hash));
            }
            _txIndex /= 2;
        }

        for (uint256 i=0 ; (i < trades[_txId].drexMerkleContract.length) && 
                            (!((_successfullCall==_magicNumber)&&(_returnedRoot==_hash))) ; i++) {
            (_successfullCall, _returnedRoot) = 
            IgetMerkleRoot(trades[_txId].drexMerkleContract[i]).getRootByBlock(_blockNumber);
        }

        if (_successfullCall==_magicNumber && _returnedRoot == _hash) {
            _success = true;
            console.log ("**Merkle Proof Ok");
        } 
        return (_success);
      //  return (trades[_txId]);
      //  merkleContract is the address that contains the verified hash subject to node consensus
    }

    function  storeTxIdPerMerkleContractToRevert (bytes32 _txId) private {
        for (uint256 i=0; i<trades[_txId].drexMerkleContract.length ; i++) {
            // a single TxId can have several Merkle Contracts attached to it
            // which can be in charge for reversals and settlements
            //it defines that each Merkle Contract has several txId attached to it
            // each txId can have several Merkle Contracts attached to it
        //console.log ("!!! Slot Number to Store Revert:", trades[_txId].statusChain.slotNumber+listrackExpiration);
        merkleContractRevert[trades[_txId].drexMerkleContract[i]]
        [trades[_txId].statusChain.slotNumber+listrackExpiration].push(_txId);

        /*
        console.log ("!!!Transaction trying to push to MerkleContractRevert");
        console.logBytes32 (_txId);
        console.log ("!!!Last Id of transaction pushed must equal to _txId given above");
        console.logBytes32 (merkleContractRevert[trades[_txId].drexMerkleContract[i]]
        [trades[_txId].statusChain.slotNumber+listrackExpiration]
        [merkleContractRevert[trades[_txId].drexMerkleContract[i]]
        [trades[_txId].statusChain.slotNumber+listrackExpiration].length-1]);
        */
        
        }
    }

    function getTxIdbyUser (address _user) external view returns (bytes32[] memory) {
        return (transactionsbyUser[_user]);
    }

    function getDrexAlienInputsbyId (bytes32 _txId) external view returns 
    (Trade memory,uint256) {
        return (trades[_txId],
        slotProduction.lowerLimitDrexIndexAlienConfirmation);
    }

      function updateChain (uint256 _indexId) private {

        uint256 _ellapsedTime = block.timestamp - slotProduction.lastTimeStamp;
        console.log (">>> Ellapsed Time: ", _ellapsedTime);
        // all code below depends on a new block production

        console.log ("Current Slot: ", slotProduction.currentSlot);

        if (_ellapsedTime>=timeSlot) {
        console.log (">>> Creating new time slot");
        // for each new slot produced the head of the slot is written
        // console.log ("Creating new time slot");
        console.log (">>> Old Slot: ", slotProduction.currentSlot);   
        slotProduction.currentSlot+= ((_ellapsedTime*1000000)/timeSlot)/1000000;
        // it increases the slot time by one in order to classify transactions
        console.log (">>> New Slot after Ellapsed Time Update: ", slotProduction.currentSlot);

        uint256 lowerLimitSlotAlienConfirmation = 
        slotProduction.currentSlot - alienConfirmation;

        // each block head of a slot contains the first transaction that
        // initiated this algorithm for reverting transactions and
        // and confirming transactions in Alien Chain through sending that indexId to
        // Alien Chain
        slotHeadTxIndex[slotProduction.currentSlot] = _indexId;
        console.log (">>> New Slot Head Index after New Slot Created : ", (slotHeadTxIndex[slotProduction.currentSlot]));
        //console.log ("New blockHead Tx Id : ");
        //console.logBytes32 (blockHead[block.number].TxId);
            // at least a minimum number of blocks must happen before emitting the event in the blockchain
            // the blockhead must exist to emit the event in blockchain
            // this is to avoid the first slots that are not yet to be expired
            // 1000 is the minimum slot to be considered in the slot chain

      //  console.log ("Before Loop");
          //  console.log ("LowerLimitSlot before Loop",lowerLimitSlotAlienConfirmation);
      //  console.log ("Genesis Slot:", slotProduction.genesisSlot);
        
        // the below statement asserts that slots before the genesis slot are not considered
        if    (lowerLimitSlotAlienConfirmation>slotProduction.genesisSlot) {
            // if the head transaction is indexed as zero, the following instructions cannot happen
                // if the head transaction is indexed as zero, the following instructions cannot happen
            console.log ("LowerLimitSlot before Loop",lowerLimitSlotAlienConfirmation);
            while ((slotHeadTxIndex[lowerLimitSlotAlienConfirmation] == uint256(0))){ 
            if (!leftIndex_0) {
                leftIndex_0 = true;
                break;
                // next time in this loop a new slot will be created whose index cannot be zero anymore
            }
            // || (slotHeadTxIndex[lowerLimitSlotAlienConfirmation] == slotProduction.lowerLimitDrexIndexAlienConfirmation)) 
            console.log (">>> Drex Index to update: ",slotHeadTxIndex[lowerLimitSlotAlienConfirmation]);
            console.log (">>> Current Drex Index :", slotProduction.lowerLimitDrexIndexAlienConfirmation);
                lowerLimitSlotAlienConfirmation++;  
            //  console.log ("Not leaving loop");
            console.log ("Lower Limit Slot Alien Confirmation changing in Loop: ", lowerLimitSlotAlienConfirmation);
                // it is required to find the oldest slot of transactions to expire
            }
            
            // the code below updates the Tx Index which expires in alien confirmation blocks
            // the blockProduction index is lower than the current one 
            // because it will expire in the future
           // if (slotHeadTxIndex[lowerLimitSlotAlienConfirmation]!=uint256(0)) {
            slotProduction.lowerLimitDrexIndexAlienConfirmation = 
            slotHeadTxIndex[lowerLimitSlotAlienConfirmation];
          //  } 
            console.log("New Alien Contirmation Tx Index to Expire in Future: "
            , slotProduction.lowerLimitDrexIndexAlienConfirmation);
            emit drexIndexAlienConfirmation (slotProduction.lowerLimitDrexIndexAlienConfirmation);
        }
        // below is the code when achieving window time
        //slotProduction.lastSlot = slotProduction.lastSlot;
        slotProduction.lastTimeStamp = block.timestamp;
        // console.log (">>>>>> Chain updated");   

        // this statement controls whether Confirmed Index slot Head moved from zero
        // moved from zero
        }
    }

}
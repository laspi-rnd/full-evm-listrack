// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24; 

    import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

    // import "./utils/console.sol";

    import "./utils/math.sol";

    import "hardhat/console.sol";

    interface I_Listrack {
    function sendTxForSettlement (bytes32[] memory) external;
        }


    contract MerkleContract is ReentrancyGuard  {

   // using SignatureChecker for bytes32;

    // Event to emit when a new Merkle root consensus is achieved
    event AlienMerkleConsensus   (uint256 indexed blockNumber, 
                                bytes32 indexed alienRootHash);

    // Event to emit when a new set of Approvers is requested
    event PendingNewApprovers   (address[] indexed approvers, uint256[] indexed weights,
                                bytes32 indexed hash);

    event NewApprovers (bytes32 indexed hash);

    struct listApprovers {
        address pKey;
        uint256 weight;
    }

/*
    struct MempoolTX {
        bytes32 txId;
        bool    paid;
        bool    alienConfirmed;
    }
    */

    struct TxMerkleDetails {
        bool    paid;
        bool    alienConfirmed;
    }


    // historic list of approvers 
   // mapping (uint256 => address[]) public approvers;

   // mapping that stores the merkle trees
   // blockNumber => Merkle Tree
    mapping (uint256 => bytes32) merkleHashesbyBlock;

    // list of verified tx inserted by any user whose root is equal to a 
    // merkle root already voted;
    mapping (uint256 => bytes32[]) verifiedTxbyBlock;

    // current approvers
    listApprovers[] public currentApprovers;

    // list of pendingApprovers by their committed hash
    mapping (bytes32 => listApprovers[]) public pendingApprovers;

    // current weight of currentApprovers;
    uint256 currentWeight;

    // pending weight of pendingApprovers;
    uint256 pendingWeight;

    // current approvers Map that links address to weight
     mapping (address => uint256) public approversWeightMap;

    // pending Approvers Hash that must be signed by current approvers
    bytes32 public pendingApproversHash;

    // number of votes for each MerkleRoot
    // block number => merkle root => number of votes
    mapping (uint256=>mapping(bytes32=>uint256)) pollList;

    // hash of new voters => number of votes
    mapping (bytes32=>uint256) pollListNewApprovers;

    // mapping of Merkle Hashes to approvers that voted or not
    // blockNumber => Merkle Hash => approver Address => true or false
    mapping (uint256=>mapping(bytes32=>mapping(address=>bool))) alreadyVoted;

    // mapping of Merkle Hashes to approvers that are willing to change the Approvers set
    mapping (bytes32=>mapping(address=>bool)) alreadyVotedNewApprovers;

    // currentRatioApproval is the minimum quorum for approving the Alien Merkle Root
    uint256 currentRatioApproval;

    // value of the service provided by DrexMerkle Contract in native tokens
    uint256 valueServiceProvided;

    // transactions sent to mempool to confirm in AlienListrack
    bytes32 [] mempoolTx;

    // mapping that stores the details of each Merkle Transaction
    mapping (bytes32 => TxMerkleDetails) txMerkleDetails;
    
    // Modifier to restrict access to owner
    modifier onlyOwner() {
        bool _existApprover = false;
        for (uint i=0 ; i < currentApprovers.length ; i++) {
            if ((currentApprovers[i].pKey == msg.sender) && (currentApprovers[i].weight!=0))
            _existApprover = true;
        }
        require(_existApprover,
            "Unauthorized: Only owner can perform this action"
        );
        _;
    }

    constructor (address[] memory _approvers, uint256[] memory _weights, uint256 _valueServiceProvided) {
     require (_approvers.length == _weights.length, 
        "Array of approvers is no/t equal to weights");

    valueServiceProvided = _valueServiceProvided;

    currentWeight = 0;
    
    listApprovers memory eachApprover;

    for (uint i=0 ; i<_approvers.length; i++) {
    eachApprover.pKey = _approvers[i];
    eachApprover.weight = _weights[i];
    currentApprovers.push(eachApprover);

    approversWeightMap[_approvers[i]] = _weights[i];
    currentWeight += _weights[i];
    }
    currentRatioApproval = 7000; // at least 70% of approvers must confirm Merkle Root
    console.log ("@@@ Merkle Contract Deployed - Current Weight ",currentWeight);
    //console.log ("Approver 0 ",currentApprovers[0].pKey);
    //console.log ("Approver 1 ",currentApprovers[1].pKey);
    //console.log ("Approver 2 ",currentApprovers[2].pKey);
    //console.log ("Approver 3 ",currentApprovers[3].pKey);
    }


    function requireNewApprovers (address[] memory _approvers, uint256[] memory _weights) 
    external onlyOwner {

        uint256 _sizeApprovers = _approvers.length;

        require (_sizeApprovers == _weights.length, "Address and Weight are not the same size");
        listApprovers[] memory _pendingApprovers = new listApprovers[](_sizeApprovers);

        // console.log ("Size Approvers", _sizeApprovers);

        bytes32 _hash = bytes32(0);

        for (uint i=0 ; i<_approvers.length; i++) {
        _pendingApprovers[i].pKey = _approvers[i];
       //  console.log ("Pending Approvers Key",  _pendingApprovers[i].pKey );
        _pendingApprovers[i].weight = _weights[i];
        _hash = keccak256(abi.encodePacked(_hash,_approvers[i],_weights[i]));
        }

        //console.log("Hash of the Approvers");
        //console.logBytes32( _hash);

        emit PendingNewApprovers (_approvers,_weights,_hash);
        for (uint j=0; j<_sizeApprovers ; j++) {
        listApprovers memory _approver = _pendingApprovers[j];
        pendingApprovers[_hash].push(_approver);
        }
    }

     function agreeNewApprovers (bytes32 _hash) external onlyOwner nonReentrant {
        //console.log ("Already voted for new approvers ? ", 
        //alreadyVotedNewApprovers[_hash][msg.sender]);

        require (!alreadyVotedNewApprovers[_hash][msg.sender],
                "Approver already voted");

        alreadyVotedNewApprovers[_hash][msg.sender] = true;
        pollListNewApprovers[_hash] += approversWeightMap[msg.sender];

        uint256 _multiplier = 10000/currentWeight;
        
        if ((pollListNewApprovers[_hash]*_multiplier) >= (currentRatioApproval))
         {
            //console.log ("Consensus achieved");
          //console.log ("Current Ratio : ", (pollListNewApprovers[_hash]*_multiplier));
          

          // ATTENTION !!! 
          /// ATTENTION !!! CONVERT TO UNCOMMENTED AFTER DEVELOPMENT IN HARDHAT
          // The below statement warrants payments to all current approvers before changing the set
          // splitMerkleValueService ();


          // the below statement converts the map pendingApprovers to Current Approvers
          currentApprovers = pendingApprovers[_hash];  
          uint256 _cumulativeWeight = 0;
          for (uint i=0 ; i < currentApprovers.length; i++) {
            approversWeightMap [currentApprovers[i].pKey] = currentApprovers[i].weight;
            _cumulativeWeight += currentApprovers[i].weight;
          }
          currentWeight = _cumulativeWeight;
          emit NewApprovers (_hash);
        }
    }

    function insertMerkleForApproval (bytes32 _pendingMerkle, uint256 _alienBlock) 
                                        public onlyOwner nonReentrant {
        
        //console.log ("Already Voted for the Merkle Hash? ", alreadyVoted[_alienBlock][_pendingMerkle][msg.sender]);
        
        require (!alreadyVoted[_alienBlock][_pendingMerkle][msg.sender],
                "Approver already voted");

        require (merkleHashesbyBlock[_alienBlock] == bytes32(0),
        "Merkle Hash for this block is already written");

        alreadyVoted[_alienBlock][_pendingMerkle][msg.sender] = true;
        pollList[_alienBlock][_pendingMerkle] += approversWeightMap[msg.sender];

        //console.log ("Current vote for block: ", _alienBlock);
        //console.log ("Current weighted vote without multiplier: ", pollList[_alienBlock][_pendingMerkle]);

        uint256 _multiplier = 10000/currentWeight;
        //console.log ("Current Weight ",currentWeight);
        //console.log ("Multiplier ", _multiplier);
        //console.log ("Current Weighted Vote ",pollList[_alienBlock][_pendingMerkle]*_multiplier);

        
        if (((pollList[_alienBlock][_pendingMerkle]*_multiplier) >= currentRatioApproval)) {
          merkleHashesbyBlock[_alienBlock] = _pendingMerkle;  
          console.log ("Consensus achieved for Merkle Root");
          //console.log ("Current Weighted Vote : ", (pollList[_pendingMerkle][_alienBlock]*_multiplier));
          emit AlienMerkleConsensus (_alienBlock, _pendingMerkle);
        }
    }

     function getRootByBlock (uint256 _blockNumber) external view returns (bytes4, bytes32) {
        bytes4   _success = bytes4(0);
        bytes4   _magicNumber = 0x1626ba7e;
        bytes32 _returnedValue = bytes32(0);

        _returnedValue = merkleHashesbyBlock[_blockNumber];
        if (_returnedValue!=bytes32(0)) _success = _magicNumber;
        return (_success,_returnedValue);
     }

    // the below function does not require Merkle Proof because all transactions are listed
    // Drex Listrack only settles the transactions that this Merkle Contract is responsible
    // Drex Listrack does not settle transactions that the current Merkle Contract is not in charge
     function validateAllTxForSettlementForOneAlienBlock (uint256 _alienBlock,
                                        bytes32[] memory _transactions,
                                        address _drexListrack) external onlyOwner nonReentrant {
        require (verifiedTxbyBlock[_alienBlock].length==0,
        "Transactions already validated for this alien block");
        bytes32 _hash = genMerkleTree (_transactions);
        if (_hash == merkleHashesbyBlock[_alienBlock]) {
            verifiedTxbyBlock[_alienBlock] = _transactions;
            I_Listrack(_drexListrack).sendTxForSettlement(_transactions);
        }
    }

     function validateSomeTxForSettlement (bytes32[] memory _txId, uint256[] memory _txIndex, 
                                        bytes32[][] memory _merkleProof, uint256[] memory _alienBlock, 
                                        address _drexListrack) external onlyOwner nonReentrant {
        //require (verifiedTxbyBlock[_alienBlock].length==0,
        //"Transactions already validated for this alien block");
       // bytes32[] memory _txSend = new bytes32[](1);
        uint256 _successCounter = 0;
        bool _merkleValidated;

       for (uint256 i = 0 ; i < _txId.length ; i++) {
        _merkleValidated = false;
        if (txMerkleDetails[_txId[i]].alienConfirmed) {
            _merkleValidated = true;
            } else {
            _merkleValidated = validateMerkleProof(_txId[i], _txIndex[i], _merkleProof[i], _alienBlock[i]);
            if (_merkleValidated) txMerkleDetails[_txId[i]].alienConfirmed = true;                   
            }
            // ATTENTION
            // ATTENTION
            // ATTENTION
            // CHANGE TO BELOW STATEMENT AFTER HARDHAT PRELIMINARY TESTS
       // if ((_merkleValidated) && (txMerkleDetails[_txId[i]].paid)) _successCounter++;
            if (_merkleValidated) _successCounter++;
       }
       if (_successCounter == _txId.length) {
        I_Listrack(_drexListrack).sendTxForSettlement(_txId);
       }
        }

/* FOR DEV PURPOSES ONE TX FOR SETTLEMENT FOR TESTS
    function validateOneTxForSettlement (bytes32 _txId, uint256 _txIndex, 
                                        bytes32[] memory _merkleProof, uint256 _alienBlock, 
                                        address _drexListrack) external onlyOwner {
        require (verifiedTxbyBlock[_alienBlock].length==0,
        "Transactions already validated for this alien block");
        bytes32[] memory _txSend = new bytes32[](1);
        _txSend[0] = _txId;
        if (validateMerkleProof(_txId, _txIndex, _merkleProof, _alienBlock)) {
            I_Listrack(_drexListrack).sendTxForSettlement(_txSend); }
        }

        */

    function genMerkleTree(bytes32[] memory _transactions) public pure returns (bytes32) {

    uint _numberTx = _transactions.length;
    
    bytes32[] memory _data = new bytes32[](_numberTx);
    _data = _transactions;

    require(_data.length > 0, "No data to create Merkle tree");


    while (_data.length > 1) {
    
        bytes32[] memory temp = new bytes32[]((_data.length / 2) + (_data.length % 2));

        
        for (uint256 i = 0; i < _data.length; i += 2) {
            // computing Hashes
            if (i + 1 < _data.length) {
            temp[i / 2] = keccak256(abi.encodePacked(_data[i], _data[i + 1]));
            } else { // if there is an odd number of elements, hash the last one with itself
            temp[i / 2] = keccak256(abi.encodePacked(_data[i], _data[i]));
            }
        }
        _data = temp;
    }
    // https://volito.digital/implementing-a-merkle-tree-in-solidity-a-comprehensive-guide/
    // the above merkle tree was adapted from the above link and corrected
    // the merkle proof was also include in this code because it was not part of the original code
    console.log ("Merkle Root");
    console.logBytes32 (_data[0]);
    return _data[0];

    }


    function validateMerkleProof (bytes32 _txId, uint256 _txIndex, 
    bytes32[] memory _merkleProof, uint256 _alienBlock) private view returns (bool) {

        bool _success = false;
        
        bytes32 _hash = _txId;

        for (uint i=0; i < _merkleProof.length; i++) {
            if (_txIndex % 2 == 0) {
                _hash = keccak256(abi.encodePacked(_hash,_merkleProof[i]));
            } else {
                _hash = keccak256(abi.encodePacked(_merkleProof[i],_hash));
            }
            _txIndex /= 2;
        }

        if (merkleHashesbyBlock[_alienBlock] == _hash) {
            _success = true;
        } 
        return (_success);
    }

    function payTxToMerkleContract (bytes32 _TxId) external 
    payable returns (bool) {
        bool  _success = false;

        require (msg.value == valueServiceProvided, 
        "Value is not the exact value for the Service to confirm Tx by Merkle Contract");

         (_success,)= payable(address(this)).call{value:msg.value}("");

        if (_success) {
            mempoolTx.push(_TxId);
            txMerkleDetails[_TxId].paid = true;
            txMerkleDetails[_TxId].alienConfirmed = false;
        }
        return (_success);
        }

    function splitMerkleValueService () public payable onlyOwner {
        uint256 _multiplier = address(this).balance/currentWeight;
        uint256 _valueforEach = 0;
        bool    _success;
        
        for (uint256 i=0 ; i<currentApprovers.length ; i++) {
            _valueforEach = _multiplier * currentApprovers[i].weight; 
            (_success,) = payable(currentApprovers[i].pKey).call{value:_valueforEach}("");
            _valueforEach = 0;
        }
        
        }

    function getVerifiedTxbyBlock (uint256 _alienBlock) public view returns (bool,bytes32[] memory) {
        bool _success = false;
        bytes32[] memory _TxIdArray = verifiedTxbyBlock[_alienBlock];
        if (_TxIdArray.length!=0) _success = true;
        return (_success,_TxIdArray);
    }
        
        
     }

    
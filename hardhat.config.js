require ("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require ("hardhat-switch-network");
//require("hardhat-change-network");
//const {API_URL} = process.env;
/** @type import('hardhat/config').HardhatUserConfig */

  module.exports = {
  //solidity: "0.8.28",
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gas: "auto",
    },
    mainnet: {  // drex ufrj
      url: 'http://127.0.0.1:8253',
      accounts: 
      [ 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', // owner
        '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63', // alice
        'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f']  // mike
    },
    alien: {  // moonbeam
      url: 'https://rpc.api.moonbase.moonbeam.network',
      chainId: 1287,
      accounts: 
      [ 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', // owner
        '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63', // alice
        'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f']  // mike
  },
    sepolia: {
      //url: '${process.env.API_URL}',
      url: 'https://sepolia.infura.io/v3/bdbe3f664e2c4fe09240e7c3cffa1f56',
      chainId: 11155111,
      accounts: 
      [ 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', // owner
        '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63', // alice
        'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f']  // mike
    },
    moonbeam: {
      url: 'https://rpc.api.moonbase.moonbeam.network',
      chainId: 1287,
      accounts: 
      [ 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', // owner
        '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63', // alice
        'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f']  // mike

  },
    alien_ufrj: {
      url: 'http://172.16.239.4:8545',
      accounts: 
      [ 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', // owner
        '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63', // alice
        'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f']  // mike 
    },
    drex_ufrj: {
      url: 'http://127.0.0.1:8253',
      accounts: 
      [ 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', // owner
        '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63', // alice
        'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f']  // mike
    }
  }
};

// Public Keys
// Alice  : 0x572E667DC233755EC1EEcd551BC3A93cd4Db5030
// Bob    : 0x9Ab84adFCec90367f54C3489000cF42D8cB462a0
// Charlie: 0xB526B323D6A008cB4929aFc6C2Ae06488E044CCb
// Debbie : 0x44B455740aA32E49d03995F5D72C58ed753a572c
// Eva    : 0xB6e2739Acf44F7998Be3E52d25Cc8151e252ba12
// Mike   : 0xA8b0dF0abe2d5b44d98bCF80F91f0f0D8F467402
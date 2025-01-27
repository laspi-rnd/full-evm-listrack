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
  mainnet:  { // UFRJ
    url: 'http://84.247.184.185:8253',
    accounts: 
    [ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',  // owner
      '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',  // alice
      '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',  // bob
      '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',  // charlie
      'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',  // debbie
      '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',  // eva
      '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1']  // mike
  },
  alien:  { // sepolia
    //url: '${process.env.API_URL}',
    url: 'https://sepolia.infura.io/v3/bdbe3f664e2c4fe09240e7c3cffa1f56',
    chainId: 11155111,
    accounts: 
    [ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',  // owner in sepolia
      '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',  // alice
      '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',  // bob
      '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',  // charlie
      'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',  // debbie
      '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',  // eva
      '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1']  // mike
  },
  sepolia: {
      //url: '${process.env.API_URL}',
      url: 'https://sepolia.infura.io/v3/bdbe3f664e2c4fe09240e7c3cffa1f56',
      chainId: 11155111,
      accounts: 
      [ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',  // owner in sepolia
        '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',  // alice
        '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',  // bob
        '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',  // charlie
        'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',  // debbie
        '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',  // eva
        '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1']  // mike
    },
  moonbeam: {  // moonbeam
    url: 'https://rpc.api.moonbase.moonbeam.network',
    chainId: 1287,
    accounts: 
    [ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',  // owner
      '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',  // alice
      '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',  // bob
      '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',  // charlie
      'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',  // debbie
      '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',  // eva
      '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1']  // mike
  },
  drex_ufrj: {
    url: 'http://84.247.184.185:8253',
    accounts: 
    [ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',  // owner
      '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',  // alice
      '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',  // bob
      '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',  // charlie
      'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',  // debbie
      '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',  // eva
      '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1']  // mike
  },
  alien_ufrj: {
      url: 'http://84.247.184.185:8549',
      accounts: 
      [ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',  // owner
        '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',  // alice
        '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',  // bob
        '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',  // charlie
        'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',  // debbie
        '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',  // eva
        '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1']  // mike
    }
  }
};

// Public Keys
// Owner  : 0x92d0FF8Fa0BD6D0F365cEE0721d34eDBE6E42F33
// Alice  : 0x572E667DC233755EC1EEcd551BC3A93cd4Db5030
// Bob    : 0x9Ab84adFCec90367f54C3489000cF42D8cB462a0
// Charlie: 0xB526B323D6A008cB4929aFc6C2Ae06488E044CCb
// Debbie : 0x44B455740aA32E49d03995F5D72C58ed753a572c
// Eva    : 0xB6e2739Acf44F7998Be3E52d25Cc8151e252ba12
// Mike   : 0xA8b0dF0abe2d5b44d98bCF80F91f0f0D8F467402
/*
accounts: 
[ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',  // owner in sepolia
  '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',
  '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',
  '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',
  'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',
  '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',
  '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1'] 
*/

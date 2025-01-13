require ("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require ("hardhat-switch-network");
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
    sepolia: {
      //url: '${process.env.API_URL}',
      url: 'https://sepolia.infura.io/v3/bdbe3f664e2c4fe09240e7c3cffa1f56',
      accounts: 
      [ '64fcd5bfca4beb158d341ea8729f3572409cd82b3dc8ee938747a3b109bf037e',
        '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',
        '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',
        '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',
        'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',
        '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',
        '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1'] 
    },
    alien_ufrj: {
      url: 'http://172.16.239.4:8545',
      accounts: 
      [ '5391f21042f4de6f8b099ef78fcf313a6db49495307c83f49dada171641239b8',
        '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',
        '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',
        '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',
        'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',
        '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',
        '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1'] 
    },
    drex_ufrj: {
      url: 'http://172.16.238.9:8545',
      accounts: 
      [ '5391f21042f4de6f8b099ef78fcf313a6db49495307c83f49dada171641239b8',
        '95b4154d870c7f4d8be947b20c19eeec9ad5a6fc00fe9c2936fcf06c4149309f',
        '355138760889ceb11307c098bad2da2414f57e580aa92c92295a196d96f985ef',
        '3fc855b6cb5bb052c72bab7600dd5b4080c8f2fa0e331be242d2fb787719f018',
        'ba15b4f8659e6dbcba29e6ad21483f742d397a90ee9c88ab98bf89f88a58bebd',
        '21b07198907e720575b9590478110904c8788a3b508063cae003f0063e565827',
        '2214a90679770647740e88a649c92f50a428f6fd2264820ecff0a0bb18b8d3b1'] 
    }
  }
};

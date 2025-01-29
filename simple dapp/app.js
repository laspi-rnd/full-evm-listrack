window.addEventListener('load', async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            // Request account access if needed
            await window.ethereum.enable();
            // Acccounts now exposed
        } catch (error) {
            console.error('User denied account access');
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
    }
    // Non-dapp browsers...
    else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }

    const web3 = window.web3;

    document.getElementById('getAccounts').addEventListener('click', () => {
        web3.eth.getAccounts().then(accounts => {
            document.getElementById('accounts').innerText = accounts.join('\\\\n');
        });
    });
});

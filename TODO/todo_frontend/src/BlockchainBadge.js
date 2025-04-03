import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

const BlockchainBadge = ({ task }) => {
  const { web3, contract } = useWeb3();
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    const accounts = await web3.eth.getAccounts();
    const verified = await contract.methods
      .verifyHash(accounts[0], web3.utils.sha3(task))
      .call();
    setVerified(verified);
  };

  return (
    <div className="blockchain-badge">
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
};
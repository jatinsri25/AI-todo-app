// frontend/context/Web3Context.js
import { createContext, useContext } from 'react';
import Web3 from 'web3';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const web3 = new Web3(Web3.givenProvider);
  return (
    <Web3Context.Provider value={{ web3 }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}
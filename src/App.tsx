import React, { useEffect, useState } from 'react';
import abi from "./utils/ElectionPortal.json";
import { ethers } from "ethers";
import './App.css';
import backgroundVideo from './assets/br.mp4';
import Swal from 'sweetalert2'

function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [allVotes, setAllVotes] = useState([]);
  const [lula, setLula] = useState<any>([]);
  const [bolsonaro, setBolsonaro] = useState<any>([]);
  const [msgLoading, setMsgLoading] = useState("Loading");
  const contractAddress = "0xb942AE4F6C09b5408D40cbdF3980135cf8965435";
  const contractABI = abi.abi;

  useEffect(() => {
    getAllVotes()
  }, [])

  const getLoading = () => {
    Swal.fire({
      title: 'Waiting...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
  }

  const getAllVotes = async () => {
    getLoading()
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const votePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const votes = await votePortalContract.getAllVotes();

        
        let votesCleaned: any = [];
        setLula([]);
        let tempLula:any = [];
        setBolsonaro([]);
        let tempBolsonaro:any = []
        votes.forEach((vote: any) => {
          
          if(vote.candidate === 'Lula'){
            tempLula.push({
              address: vote.voter,
              timestamp: new Date(vote.timestamp * 1000),
              candidate: vote.candidate
            });
            
          }else if(vote.candidate === 'Bolsonaro'){
            tempBolsonaro.push({
              address: vote.voter,
              timestamp: new Date(vote.timestamp * 1000),
              candidate: vote.candidate
            });
          }
        });

        setLula(tempLula);
        setBolsonaro(tempBolsonaro);

        setAllVotes(votesCleaned);
        Swal.close()
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllVotes()
      } else {
        console.log("No authorized account found")
      }
      Swal.close()
    } catch (error) {
      Swal.close()
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Get Metamask!',
        })
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const vote = async (candidate: string) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const votePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await votePortalContract.getTotalVotes();

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await votePortalContract.vote(candidate, { gasLimit: 300000 });
        setMsgLoading("Minning");
        getLoading()
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setMsgLoading("Mined");
        count = await votePortalContract.getTotalVotes();
        getAllVotes()
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message,
      })
      console.log(error);
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">
      <video className='appVideo' id="background-video" muted loop autoPlay>
        <source src={backgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className='contentBackground'></div>
      <div className='mainContent'>
        <div className="dataContainer">

          {!currentAccount && (
            <div className='alertBox'>
              This is just an experimental project for learning, a Smart Contract was developed to store the voting intention, currently this Smart Contract is in the Rinkeby test network
              <button className="waveButton" onClick={connectWallet}>
                Connect your wallet in MetaMask
              </button>
            </div>

          )}

          {currentAccount && (
            <>

              <div className='alertBolsonaro' onClick={() => vote('Bolsonaro')}>
                Vote in Bolsonaro <br />
                {bolsonaro.length} votes
              </div>

              <div className='alertLula' onClick={() => vote('Lula')}>
                Vote in Lula<br />
                {lula.length} votes
              </div>

              {allVotes.map((vote: any, index) => {
                return (
                  <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                    <div>Address: {vote.address}</div>
                    <div>Time: {vote.timestamp.toString()}</div>
                    <div>Candidato: {vote.candidate}</div>
                  </div>)
              })}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default App;

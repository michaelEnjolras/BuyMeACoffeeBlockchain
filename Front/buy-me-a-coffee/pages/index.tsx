import abi from '../utils/BuyMeACoffee.json';
import { ethers } from "ethers";
import Head from 'next/head'
import Image from 'next/image'
import React, { useEffect, useState } from "react";
import styles from '../styles/Home.module.css'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
  interface Window{
    ethereum?:MetaMaskInpageProvider
  }
}
export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0x2Ea006eF3e5B6843714483CACbB908286B27eA69";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }

  const onMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  }

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
      const accounts = await ethereum.request<string[]>({method: 'eth_accounts'});
      //console.log("accounts: ", accounts);

      if (accounts && Object.values(accounts).length !== 0) {
        const account = Object.values(accounts)[0];
        console.log("wallet is connected! " + account);
        toast.success("🦄 Wallet is Connected", {
                           position: "top-right",
                           autoClose: 5000,
                           hideProgressBar: false,
                           closeOnClick: true,
                           pauseOnHover: true,
                           draggable: true,
                           progress: undefined,
                         });
      } else {
        console.log("make sure MetaMask is connected");
      }
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const buyCoffee = async () => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("buying coffee..")
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "anon",
          message ? message : "Enjoy your coffee!",
          {value: ethers.utils.parseEther("0.001")}
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name
        }
      ]);
    };

    const {ethereum} = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Buy Mika a Coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Buy Mika a Coffee!
        </h1>

        {currentAccount ? (
          <div>
            <form>
              <div>
                <label>
                  Name
                </label>
                <br/>

                <input
                  id="name"
                  type="text"
                  placeholder="anon"
                  onChange={onNameChange}
                  />
              </div>
              <br/>
              <div>
                <label>
                  Send Mika a message
                </label>
                <br/>

                <textarea
                  rows={3}
                  placeholder="Enjoy your coffee!"
                  id="message"
                  onChange={onMessageChange}
                  required
                >
                </textarea>
              </div>
              <div>
                <button
                  type="button"
                  onClick={buyCoffee}
                >
                  Send 1 Coffee for 0.001ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={connectWallet}> Connect your wallet </button>
        )}
      </main>
      <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />

      {currentAccount && (<h1>Memos received</h1>)}

      {currentAccount && (memos.map((memo, idx) => {
        return (
          <div key={idx} style={{border:"2px solid", "borderRadius":"5px", padding: "5px", margin: "5px"}}>
            <p style={{"fontWeight":"bold"}}>"{memo.message}"</p>
            <p>From: {memo.name} at {memo.timestamp.toString()}</p>
          </div>
        )
      }))}
    </div>
  )
}
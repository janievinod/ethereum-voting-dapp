import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractABI from "./contractABI.json";

const CONTRACT_ADDRESS = "0x99d00Ba7d06ECb92e236c25EbA20EE0a17D08333";

export default function App() {
  const [account, setAccount] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    setError("");
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to vote.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      await loadVotingData();
    } catch (err) {
      console.error("Connection rejected:", err);
      setError("Wallet connection was rejected.");
    }
  };

  const loadVotingData = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        provider
      );

      const list = await contract.getAllCandidates();
      setCandidates(list);

      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const voted = await contract.voters(accounts[0]);
        setHasVoted(voted);
      }
    } catch (err) {
      console.error("Error loading contract data:", err);
      setError(
        "Failed to load candidates. Ensure MetaMask is switched to the Sepolia test network."
      );
    }
  };

  const voteForCandidate = async (index) => {
    setError("");
    if (!account) {
      setError("Please connect your wallet first.");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        signer
      );

      const tx = await contract.vote(index);
      await tx.wait();

      await loadVotingData();
    } catch (err) {
      console.error("Voting transaction failed:", err);
      setError(
        err?.reason || "Transaction failed or rejected. Check MetaMask for details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVotingData();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => loadVotingData());
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6">
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4 py-5 border-b border-slate-800 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-emerald-400">
            DECENTVOTE
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Sepolia: {CONTRACT_ADDRESS}
          </p>
        </div>

        {account ? (
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full text-sm text-emerald-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Connect Wallet
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl">
        {error && (
          <div className="mb-6 bg-red-950/60 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              Active Candidates
            </h2>
            {hasVoted && (
              <span className="text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full">
                Vote Recorded On-Chain
              </span>
            )}
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>No candidates loaded yet.</p>
              <p className="text-xs mt-1">
                Connect your MetaMask wallet on the Sepolia network to fetch live contract data.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((candidate, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-5 rounded-xl flex flex-col justify-between transition"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white">
                        {candidate.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-500">
                        #{idx + 1}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-2">
                      Total Votes:{" "}
                      <span className="text-emerald-400 font-bold text-base">
                        {Number(candidate.voteCount)}
                      </span>
                    </p>
                  </div>

                  <button
                    disabled={!account || hasVoted || loading}
                    onClick={() => voteForCandidate(idx)}
                    className={`mt-5 py-2.5 px-4 rounded-xl font-semibold text-sm transition ${
                      hasVoted
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : !account
                        ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                        : loading
                        ? "bg-emerald-700 text-slate-200 cursor-wait"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
                    }`}
                  >
                    {loading
                      ? "Confirming in MetaMask..."
                      : hasVoted
                      ? "Already Voted"
                      : !account
                      ? "Connect Wallet to Vote"
                      : "Cast Vote"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
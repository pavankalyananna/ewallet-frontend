import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  // Auth state
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [user, setUser] = useState(null); // { userId, username, email, walletId, walletBalance }

  // Signup form
  const [suUsername, setSuUsername] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");

  // Login form
  const [liUsername, setLiUsername] = useState("");
  const [liPassword, setLiPassword] = useState("");

  // Wallet + TX after login
  const [wallet, setWallet] = useState(null);
  const [Rwallet, setRWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // 🔹 Recharge form state
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeDescription, setRechargeDescription] = useState("");

  // 🔹 Transfer form state
  const [transferToId, setTransferToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");

  // Messages
  const [globalError, setGlobalError] = useState(null);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setGlobalError(null);
    setGlobalMessage(null);
  };

  // ---- API helpers ----

  const loadWalletAndTransactions = async (walletId) => {
    try {
      const [walletRes, txRes] = await Promise.all([
        axios.get(`/api/wallets/${walletId}`),
        axios.get(`/api/wallets/${walletId}/transactions`),
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      setGlobalError(err.response?.data || "Error loading wallet data");
    }
  };
  const loadWalletName = async (walletId) => {
    try {
      setLoading(true);
      const walletRes= await axios.get(`/api/wallets/${walletId}`);
      setRWallet(walletRes.data);
    } catch (err) {
      setRWallet(null); 
      setGlobalError(err.response?.data || "Error loading Rwallet data");
    }
    finally {
      setLoading(false);
    }
  };

  // When user logs in / signs up, load wallet and tx
  useEffect(() => {
    if (user?.walletId) {
      loadWalletAndTransactions(user.walletId);
    }
  }, [user]);

  // ---- Signup / Login handlers ----

  const handleSignup = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/signup", {
        username: suUsername,
        email: suEmail,
        password: suPassword,
      });
      setUser(res.data);
      setGlobalMessage("Signup successful. Logged in!");
      setSuUsername("");
      setSuEmail("");
      setSuPassword("");
    } catch (err) {
      setGlobalError(err.response?.data || "Error during signup");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", {
        username: liUsername,
        password: liPassword,
      });
      setUser(res.data);
      setGlobalMessage("Login successful.");
      setLiUsername("");
      setLiPassword("");
    } catch (err) {
      setGlobalError(err.response?.data || "Error during login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setWallet(null);
    setTransactions([]);
    clearMessages();
  };

  // ---- 🔹 Recharge handler ----

  const handleRecharge = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!user || !wallet) {
      setGlobalError("Please login first.");
      return;
    }
    if (!rechargeAmount) {
      setGlobalError("Please enter recharge amount.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/api/wallets/${wallet.id}/recharge`, {
        amount: Number(rechargeAmount),
        description: rechargeDescription || "Recharge",
      });

      setGlobalMessage("Recharge successful.");
      setRechargeAmount("");
      setRechargeDescription("");

      // Refresh wallet + transactions
      await loadWalletAndTransactions(wallet.id);
    } catch (err) {
      setGlobalError(err.response?.data || "Error during recharge");
    } finally {
      setLoading(false);
    }
  };

  // ---- 🔹 Transfer handler ----

  const handleTransfer = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!user || !wallet) {
      setGlobalError("Please login first.");
      return;
    }
    if (!transferToId || !transferAmount) {
      setGlobalError("Please fill destination wallet ID and amount.");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/wallets/transfer", {
        fromWalletId: wallet.id,
        toWalletId: Number(transferToId),
        amount: Number(transferAmount),
        description: transferDescription || "Transfer",
      });

      setGlobalMessage("Transfer successful.");
      setTransferAmount("");
      setTransferDescription("");

      // Refresh wallet + transactions
      await loadWalletAndTransactions(wallet.id);
    } catch (err) {
      setGlobalError(err.response?.data || "Error during transfer");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- RENDERING --------------------

  // Not logged in -> show login/signup
  if (!user) {
    return (
      <div className="app auth-page">
        <h1>E-Wallet Transaction System</h1>

        {globalError && <div className="alert alert-error">{globalError}</div>}
        {globalMessage && (
          <div className="alert alert-success">{globalMessage}</div>
        )}

        <div className="auth-tabs">
          <button
            className={authMode === "login" ? "tab active" : "tab"}
            onClick={() => {
              clearMessages();
              setAuthMode("login");
            }}
          >
            Login
          </button>
          <button
            className={authMode === "signup" ? "tab active" : "tab"}
            onClick={() => {
              clearMessages();
              setAuthMode("signup");
            }}
          >
            Sign Up
          </button>
        </div>

        <div className="card auth-card">
          {authMode === "login" ? (
            <>
              <h2>Login</h2>
              <form onSubmit={handleLogin} className="form">
                <label>
                  Username
                  <input
                    type="text"
                    value={liUsername}
                    onChange={(e) => setLiUsername(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={liPassword}
                    onChange={(e) => setLiPassword(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2>Sign Up</h2>
              <form onSubmit={handleSignup} className="form">
                <label>
                  Username
                  <input
                    type="text"
                    value={suUsername}
                    onChange={(e) => setSuUsername(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={suPassword}
                    onChange={(e) => setSuPassword(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" disabled={loading}>
                  {loading ? "Signing up..." : "Create Account"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // Logged in -> dashboard with BOTH recharge + transfer
  return (
    <div className="app">
      <header className="header">
        <h1>E-Wallet Dashboard</h1>
        <div className="header-right">
          <span>Hi, {user.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {globalError && <div className="alert alert-error">{globalError}</div>}
      {globalMessage && (
        <div className="alert alert-success">{globalMessage}</div>
      )}

      <div className="grid dashboard-grid">
        {/* Profile + Recharge + Transfer */}
        <section className="card">
          <h2>Profile</h2>
          <div className="profile-info">
            <p>
              <strong>Username : </strong> {user.username}
            </p>
            <p>
              <strong>Email: </strong> {user.email}
            </p>
            <p>
              <strong>Wallet ID: </strong> {wallet?.id ?? user.walletId}
            </p>
            <p>
              <strong>Balance:</strong>{" "}
              {wallet ? wallet.balance : user.walletBalance}
            </p>
          </div>

        </section>

        <section className="card"> 
        {/* 🔹 Transfer section */}
          <h3>Transfer Funds</h3>
          <form onSubmit={(e) => {e.preventDefault();
          loadWalletName(transferToId);
  }}
  className="form">
  <label>
    To Wallet ID  
    <input
      type="number"
      min="1"
      value={transferToId}
      onChange={(e) => setTransferToId(e.target.value)}
      placeholder="Destination wallet ID"
      required
    />
  </label>
<strong>Receiver Name : {Rwallet?.ownerName}</strong>

  <button type="submit" disabled={loading}>
    {loading ? "Processing..." : "Get Details"}
  </button>
</form>
<br/>

          <form onSubmit={handleTransfer} className="form">
            <label>
              To Wallet ID
              <input
                type="number"
                min="1"
                value={transferToId}
                onChange={(e) => setTransferToId(e.target.value)}
                placeholder="Destination wallet ID"
                required
              />
            </label>
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Amount"
                required
              />
            </label>
            <label>
              Description 
              <input
                type="text"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                placeholder="Description optional"
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Transfer"}
            </button>
          </form>

        </section>

        <section className="card">
          {/* 🔹 Recharge section */}
          <h3>Recharge Wallet</h3>
          <form onSubmit={handleRecharge} className="form">
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Recharge amount"
                required
              />
            </label>
            <label>
              Description
              <input
                type="text"
                value={rechargeDescription}
                onChange={(e) => setRechargeDescription(e.target.value)}
                placeholder="Description optional"
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Recharge"}
            </button>
          </form>
        </section>
        </div>
        <div className="grid1">

        {/* Transactions list */}
        <section className="card">
          <h2>Transactions</h2>
          {!wallet ? (
            <p>Loading wallet...</p>
          ) : transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
            <table className="tx-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.id}</td>
                    <td>{tx.type}</td>
                    <td>{tx.amount}</td>
                    <td>{tx.balanceAfter}</td>
                    <td>{tx.description}</td>
                    <td>{tx.reference} </td>
                    <td>{tx.createdAt}</td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;

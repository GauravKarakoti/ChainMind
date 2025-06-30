import { useState } from 'react';
import styles from './AlertConfig.module.css';

export default function AlertConfig({ onSave }) {
  const [alert, setAlert] = useState({
    name: '',
    type: 'price',
    chain: 'ethereum/mainnet',
    token: '',
    chatID: '',
    condition: 'above',
    value: 0,
    frequency: 'once'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({...alert});
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Create Alert</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Alert Name</label>
            <input
              type="text"
              value={alert.name}
              onChange={(e) => setAlert({...alert, name: e.target.value})}
              className={styles.input}
              placeholder="e.g., ETH Price Alert"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Blockchain</label>
            <select
              value={alert.chain}
              onChange={(e) => setAlert({...alert, chain: e.target.value})}
              className={styles.select}
            >
              <option value="ethereum/mainnet">Ethereum</option>
              <option value="tron/mainnet">Tron</option>
              <option value="xrpl/mainnet">XRP Ledger</option>
              <option value="bitcoin/mainnet">Bitcoin</option>
              <option value="dogecoin/mainnet">Dogecoin</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Token/Asset</label>
            <input
              type="text"
              value={alert.token}
              onChange={(e) => setAlert({...alert, token: e.target.value})}
              className={styles.input}
              placeholder="ETH, USDT, BTC..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Telegram Chat ID</label>
            <input
              type="text"
              value={alert.chatID}
              onChange={(e) => setAlert({...alert, chatID: e.target.value})}
              className={styles.input}
              placeholder="Use @RawDataBot to get it"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Condition</label>
            <div className={styles.inputGroup}>
              <select
                value={alert.condition}
                onChange={(e) => setAlert({...alert, condition: e.target.value})}
                className={styles.conditionSelect}
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
                <option value="change">% Change</option>
              </select>
              <input
                type="number"
                value={alert.value}
                onChange={(e) => setAlert({...alert, value: parseFloat(e.target.value) || 0})}
                className={styles.valueInput}
                placeholder="Value"
                required
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Frequency</label>
            <select
              value={alert.frequency}
              onChange={(e) => setAlert({...alert, frequency: e.target.value})}
              className={styles.select}
            >
              <option value="once">Alert Once</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
        </div>
        
        <div className={styles.buttonContainer}>
          <button
            type="submit"
            className={styles.submitButton}
          >
            Create Alert
          </button>
        </div>
      </form>
    </div>
  );
}
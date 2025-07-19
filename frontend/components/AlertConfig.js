import { useState, useEffect } from 'react';
import { X, Check, ChevronDown, Bell, Zap, Activity, DollarSign } from 'lucide-react';
import styles from './AlertConfig.module.css';

export default function AlertConfig({ onSave, onCancel }) {
  const [alertType, setAlertType] = useState('price');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tokenSuggestions, setTokenSuggestions] = useState([]);
  
  const [alert, setAlert] = useState({
    name: '',
    type: 'price',
    chain: 'ethereum/mainnet',
    token: '',
    chatID: '',
    condition: 'above',
    value: 0,
    frequency: 'recurring',
    thresholdType: 'value',
    custom_message: '',
    cooldown: 5, // minutes
    active: true,
  });

  useEffect(() => {
    const fetchTokens = async () => {
      const response = await fetch('/api/tokens');
      const data = await response.json();
      setTokenSuggestions(data.slice(0, 10));
    };
    fetchTokens();
  }, []);

  // Handle token input with suggestions
  const handleTokenChange = (e) => {
    const value = e.target.value;
    setAlert({...alert, token: value});
    
    if (value.length > 1) {
      const filtered = tokenSuggestions.filter(token => 
        token.symbol.toLowerCase().includes(value.toLowerCase())
      );
      setTokenSuggestions(filtered);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({...alert});
    console.log('Alert created:', alert);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Bell size={20} className={styles.icon} />
          <span> Create Smart Alert</span>
        </h2>
        <button onClick={onCancel} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Alert Name <span className={styles.required}>*</span>
              <span className={styles.charCounter}>{alert.name.length}/30</span>
            </label>
            <input
              type="text"
              value={alert.name}
              onChange={(e) => setAlert({...alert, name: e.target.value.slice(0, 30)})}
              className={styles.input}
              placeholder="e.g., ETH Price Drop Alert"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Alert Type <span className={styles.required}>*</span></label>
            <div className={styles.typeGrid}>
              {[
                {id: 'price', label: 'Price', icon: <DollarSign size={16} />},
                {id: 'gas', label: 'Gas', icon: <Zap size={16} />},
                {id: 'whale', label: 'Whale', icon: <Activity size={16} />},
                {id: 'activity', label: 'Activity', icon: <div className={styles.iconPlaceholder}>A</div>}
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`${styles.typeButton} ${alertType === type.id ? styles.typeActive : ''}`}
                  onClick={() => {
                    setAlertType(type.id);
                    setAlert({...alert, type: type.id});
                  }}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Blockchain <span className={styles.required}>*</span></label>
            <div className={styles.selectContainer}>
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
              <ChevronDown size={16} className={styles.selectIcon} />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {alertType === 'gas' ? 'Gas Metric' : 'Token/Asset'} 
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.tokenInputContainer}>
              <input
                type="text"
                value={alert.token}
                onChange={handleTokenChange}
                className={styles.input}
                placeholder={alertType === 'gas' ? "Gas price" : "ETH, USDT, BTC..."}
                required
              />
              {tokenSuggestions.length > 0 && (
                <div className={styles.suggestions}>
                  {tokenSuggestions.map(token => (
                    <div 
                      key={token.symbol}
                      className={styles.suggestionItem}
                      onClick={() => setAlert({...alert, token: token.symbol})}
                    >
                      <img src={token.logo} alt={token.symbol} className={styles.tokenLogo} />
                      {token.symbol}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <label className={styles.label}>Condition <span className={styles.required}>*</span></label>
            <div className={styles.conditionGroup}>
              <select
                value={alert.condition}
                onChange={(e) => setAlert({...alert, condition: e.target.value})}
                className={styles.conditionSelect}
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
                <option value="change">Changes by</option>
                <option value="volatility">High Volatility</option>
              </select>
              <input
                type="number"
                value={alert.value}
                onChange={(e) => setAlert({...alert, value: parseFloat(e.target.value) || 0})}
                className={styles.valueInput}
                placeholder="Value"
                required
              />
              <span className={styles.unit}>
                {alertType === 'gas' ? 'gwei' : alertType === 'whale' ? (alert.thresholdType === 'value' ? 'USD' : '%') : ''}
              </span>
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

          {alert.type === 'gas' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Gas Threshold (gwei)</label>
              <input
                type="number"
                value={alert.value}
                className={styles.input}
                onChange={e => setAlert({...alert, value: e.target.value})}
              />
            </div>
          )}

          {alert.type === 'whale' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Threshold Type</label>
                <select
                  value={alert.thresholdType}
                  onChange={e => setAlert({...alert, thresholdType: e.target.value})}
                  className={styles.select}
                >
                  <option value="value">USD Value</option>
                  <option value="percentage">% Supply</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Threshold {alert.thresholdType === 'value' ? '($)' : '(%)'}</label>
                <input
                  type="number"
                  value={alert.value}
                  onChange={e => setAlert({...alert, value: e.target.value})}
                  className={styles.valueInput}
                />
              </div>
            </>
          )}

          <div className={styles.advancedToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
            <span>Advanced Settings</span>
            <ChevronDown size={16} className={`${styles.chevron} ${showAdvanced ? styles.rotated : ''}`} />
          </div>

          {showAdvanced && (
            <div className={styles.advancedSettings}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Custom Alert Message</label>
                <textarea
                  value={alert.custom_message}
                  onChange={(e) => setAlert({...alert, custom_message: e.target.value})}
                  className={styles.textarea}
                  placeholder="Customize the notification message"
                  rows={2}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Alert Cooldown (minutes)</label>
                <input
                  type="number"
                  value={alert.cooldown}
                  onChange={(e) => setAlert({...alert, cooldown: parseInt(e.target.value) || 5})}
                  className={styles.input}
                  min="1"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.toggleLabel}>
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      checked={alert.active}
                      onChange={(e) => setAlert({...alert, active: e.target.checked})}
                      className={styles.toggleInput}
                    />
                    <span className={`${styles.toggle} ${alert.active ? styles.toggleActive : ''}`} />
                  </div>
                  Enable immediately
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.buttonContainer}>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" className={styles.submitButton}>
            <Check size={16} className={styles.buttonIcon} />
            Create Alert
          </button>
        </div>
      </form>
    </div>
  );
}
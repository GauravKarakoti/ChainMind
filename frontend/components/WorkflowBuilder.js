import { useState } from 'react';
import styles from './WorkflowBuilder.module.css';

const apiOptions = [
  { id: 'getTransactionsByAccount', name: 'Get Account Transactions (BTC, DOGE, TRX, XRP)' },
  { id: 'getTokenTransfersByAccount', name: 'Get Token Transfers (ETH)' },
  { id: 'getTokenPricesByContracts', name: 'Get Token Price (ETH)' },
  { id: 'getNftMetadataByTokenIds', name: 'Get NFT Metadata (ETH)' },
  { id: 'getDailyTransactionsStats', name: 'Get Daily Tx Stats (ETH)' },
];

function ApiStep({ step, index, updateStep, removeStep }) {
  const { api, params = {}, chain } = step.details;

  // Update a specific parameter in the params object
  const handleParamChange = (paramName, value) => {
    updateStep(step.id, {
      details: { ...step.details, params: { ...params, [paramName]: value } },
    });
  };

  const renderParams = () => {
    switch (api) {
      case 'getTransactionsByAccount':
      case 'getTokenTransfersByAccount':
        return (
          <>
            <label>Account Address</label>
            <input
              type="text"
              placeholder="Enter account address"
              value={params.accountAddress || ''}
              onChange={(e) => handleParamChange('accountAddress', e.target.value)}
            />
          </>
        );
      case 'getTokenPricesByContracts':
        return (
          <>
            <label>Token Symbol</label>
            <input
              type="text"
              placeholder="e.g., AAVE, PUSH, UNI"
              value={params.tokenName || ''}
              onChange={(e) => handleParamChange('tokenName', e.target.value)}
            />
          </>
        );
      case 'getNftMetadataByTokenIds':
        return (
          <>
            <label>Contract Address</label>
            <input
              type="text"
              placeholder="Enter NFT contract address"
              value={params.contractAddress || ''}
              onChange={(e) => handleParamChange('contractAddress', e.target.value)}
            />
            <label>Token ID</label>
            <input
              type="text"
              placeholder="Enter the Token ID"
              value={params.tokenId || ''}
              onChange={(e) => handleParamChange('tokenId', e.target.value)}
            />
          </>
        );
      case 'getDailyTransactionsStats':
        return <p>No parameters required for this API call.</p>;
      default:
        return <p>Select an API method to see its parameters.</p>;
    }
  };

  return (
    <div className={styles.workflowStep}>
      <div className={styles.stepHeader}>
        <span className={styles.stepIcon}>📡</span>
        <span className={styles.stepTitle}>API Call #{index + 1}</span>
        <button className={styles.removeStep} onClick={() => removeStep(step.id)}>x</button>
      </div>
      <div className={styles.stepForm}>
        <label>Blockchain</label>
        <select
          value={chain || 'ethereum/mainnet'}
          onChange={(e) => updateStep(step.id, { details: { ...step.details, chain: e.target.value } })}
        >
          <option value="ethereum/mainnet">Ethereum</option>
          <option value="xrpl/mainnet">XRP Ledger</option>
          <option value="tron/mainnet">Tron</option>
          <option value="bitcoin/mainnet">Bitcoin</option>
          <option value="dogecoin/mainnet">Dogecoin</option>
        </select>

        <label>API Method</label>
        <select
          value={api || ''}
          onChange={(e) => updateStep(step.id, { details: { ...step.details, api: e.target.value, params: {} } })}
        >
          <option value="">Select API</option>
          {apiOptions.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
        {renderParams()}
      </div>
    </div>
  );
}


export default function WorkflowBuilder({ onSave }) {
  const [steps, setSteps] = useState([]);

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        type: 'api',
        details: { api: '', params: {}, chain: 'ethereum/mainnet' },
      }
    ]);
  };

  const updateStep = (id, updates) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, ...updates } : step));
  };

  const removeStep = (id) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className={styles.workflowBuilder}>
      <div className={styles.stepCreator}>
        <button onClick={addStep} className={styles.addStepButton}>
          Add API Call to Workflow
        </button>
      </div>

      <div className={styles.stepsContainer}>
        {steps.map((step, index) => (
          <ApiStep
            key={step.id}
            step={step}
            index={index}
            updateStep={updateStep}
            removeStep={removeStep}
          />
        ))}
      </div>

      <button
        className={styles.saveWorkflow}
        onClick={() => onSave(steps)}
        disabled={steps.length === 0}
      >
        Save Workflow
      </button>
    </div>
  );
}
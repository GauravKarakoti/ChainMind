import { useState } from 'react';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
import { ExternalLinkIcon, X } from 'lucide-react';

// Register required Chart.js components
ChartJS.register(
  ArcElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

// CSS for chart containers 
import styles from './Dashboard.module.css';
import { useMemo } from 'react';

export default function Dashboard({ data, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  console.log('Dashboard data:', data);
  const { api, chain, normalizedData } = data;
  let transfers = {}, dailyStats = {}, tokenPrices = {}, nftMetadata = {};

  const chartData = useMemo(() => {
    if (!normalizedData) return null;
    
    switch(normalizedData.type) {
      case 'transfers':
        return generateTransfersChart(normalizedData.items);
      case 'stats':
        return generateStatsChart(normalizedData.items);
      case 'prices':
        return generatePricesChart(normalizedData.items);
      default:
        return null;
    }
  }, [normalizedData]);

  console.log(chartData);

  const chainNames = {
    'ethereum/mainnet': 'Ethereum',
    'tron/mainnet': 'Tron',
    'xrpl/mainnet': 'XRP Ledger',
    'bitcoin/mainnet': 'Bitcoin',
    'dogecoin/mainnet': 'Dogecoin'
  };

  const apiNames = {
    'getTokenTransfersByAccount': 'Token Transfers',
    'getTokenPricesByContracts': 'Token Prices',
    'getDailyTransactionsStats': 'Transaction Statistics',
    'getNftMetadataByTokenIds': 'NFT Metadata',
    'getTransactionsByAccount': 'Account Transactions'
  };

  switch (data.api) {
    case 'getTokenTransfersByAccount':
    case 'getTransactionsByAccount':
      transfers = data.transfers;
      break;
    case 'getDailyTransactionsStats':
      // Bar chart for daily transaction stats
      dailyStats = data.dailyStats;
      break;
    case 'getTokenPricesByContracts':
      // Doughnut chart for token price metrics (e.g., percentChange7d, percentChange24h, percentChange1h)
      tokenPrices = data.tokenPrices;
      break;
    case 'getNftMetadataByTokenIds':
      nftMetadata = data.data;
      break;
    default:
      console.error('Unknown API:', data.api);
  }

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose(); // Call parent's close handler if provided
  };

  if (!isVisible) return null;

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className={styles.chainBadge}>
            {chainNames[data.chain] || data.chain.split('/')[0]}
          </div>
          <div className={styles.apiBadge}>
            {apiNames[data.api] || data.api}
          </div>
        </div>
        <button 
          onClick={handleClose}
          className={styles.closeButton}
          aria-label="Close dashboard"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className={styles.dashboardGrid}>
        {normalizedData?.type === 'transfers' && normalizedData.items.length > 0 && (
          <div className={styles.chartCard}>
            <h2>Token Distribution</h2>
            <div className={styles.chartContainer}>
              <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: {legend: {position: 'top'}} }} />
            </div>
          </div>
        )}

        {normalizedData?.type === 'stats' && normalizedData.items.length > 0 && (
          <div className={styles.chartCard}>
            <h2>Daily Transactions</h2>
            <div className={styles.chartContainer}>
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        )}

        {normalizedData?.type === 'prices' && normalizedData.items.length > 0 && (
          <div className={styles.chartCard}>
            <h2>Price Change Ratios</h2>
            <h3>The current price is <strong>{tokenPrices[0].price}</strong></h3>
            <div className={styles.chartContainer}>
              <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        )}

        {normalizedData?.type === 'nft' && normalizedData.items.length > 0 && (
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>NFT Details</h2>
            {nftMetadata.map(nft => (
              <div key={nft.tokenId} className={styles.nftCard}>
                <div className="flex items-start gap-4">
                  {nft.contracts?.logoUrl ? (
                    <img 
                      src={nft.logoUrl} 
                      alt={nft.contract?.name} 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{nft.contract?.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-500">Contract:
                          <span className="truncate max-w-[150px]"> {nft.contract?.address}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Token ID:
                          <span>{nft.tokenId}</span>
                        </p>
                      </div>
                    </div>
                    
                    <a 
                      href={nft.tokenUri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-blue-600 text-sm"
                    >
                      View metadata <ExternalLinkIcon className="ml-1" size={14} />
                    </a>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Attributes</h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(nft.rawMetadata).attributes.map((attr, i) => (
                      <div key={i} className="px-3 py-1 bg-gray-100 rounded-full">
                        <span className="font-medium">{attr.trait_type}:</span> {attr.value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function generateTransfersChart(items) {
  const aggregated = items.reduce((acc, item) => {
    const token = item.token || 'Unknown';
    if (!acc[token]) {
      acc[token] = 0;
    }
    acc[token] += item.amount;
    return acc;
  }, {});

  const labels = Object.keys(aggregated);
  const amounts = Object.values(aggregated);
  return {
    labels,
    datasets: [{
      data: amounts,
      backgroundColor: labels.map(() => randomColor())
    }]
  };
}

function generateStatsChart(items) {
  return {
    labels: items?.map(d => d.date),
    datasets: [{
      label: 'Tx Count',
      data: items?.map(d => d.count),
      backgroundColor: randomColor()
    }]
  };
}

function generatePricesChart(items) {
  return items?.[0] ? {
    labels: ['1h %', '24h %', '7d %'],
    datasets: [{
      data: [
        items[0].changes['1h'],
        items[0].changes['24h'],
        items[0].changes['7d']
      ],
      backgroundColor: [
        randomColor(),
        randomColor(),
        randomColor()
      ]
    }]
  } : null;
}

function randomColor() {
  return `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},0.7)`;
}
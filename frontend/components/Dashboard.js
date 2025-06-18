import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
import { ExternalLinkIcon } from 'lucide-react';

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

export default function Dashboard({ data }) {
  console.log('Dashboard data:', data);
  let transfers={} , dailyStats={} , tokenPrices={} , nftMetadata={}, chartData={};

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
      chartData = {
        labels: transfers?.map(t => t.token),
        datasets: [{
          data: transfers?.map(t => t.amount),
          backgroundColor: transfers.map(() => `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},0.7)`),
          borderColor: '#fff',
          borderWidth: 1
        }]
      };
      break;
    case 'getDailyTransactionsStats':
      // Bar chart for daily transaction stats
      dailyStats = data.dailyStats;
      chartData = {
        labels: dailyStats.map(d => d.date),
        datasets: [{
          label: 'Tx Count',
          data: dailyStats.map(d => d.count),
          backgroundColor: `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},0.7)`,  
        }]
      };
      break;
    case 'getTokenPricesByContracts':
      // Doughnut chart for token price metrics (e.g., percentChange7d, percentChange24h, percentChange1h)
      tokenPrices = data.tokenPrices;
      chartData = tokenPrices.length > 0 ? {
        labels: ['1h %', '24h %', '7d %'],
        datasets: [{
          data: [
            parseFloat(tokenPrices[0].percentChangeFor1h),
            parseFloat(tokenPrices[0].percentChangeFor24h),
            parseFloat(tokenPrices[0].percentChangeFor7d)
          ],
          backgroundColor: [
            tokenPrices.map(() => `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},0.7)`),
            tokenPrices.map(() => `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},0.7)`),
            tokenPrices.map(() => `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},0.7)`)
          ]
        }]
      } : null;
      break;
    case 'getNftMetadataByTokenIds':
      nftMetadata = data.data;
      break;
    default:
      console.error('Unknown API:', data.api);
  }

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.chainBadge}>
          {chainNames[data.chain] || data.chain.split('/')[0]}
        </div>
        <div className={styles.apiBadge}>
          {apiNames[data.api] || data.api}
        </div>
      </div>
      <div className={styles.dashboardGrid}>
        {transfers.length > 0 && (
          <div className={styles.chartCard}>
            <h2>Token Distribution</h2>
            <div className={styles.chartContainer}>
              <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false , plugins: {legend: {position: 'top'}} }} />
            </div>
          </div>
        )}

        {dailyStats.length > 0 && (
          <div className={styles.chartCard}>
            <h2>Daily Transactions</h2>
            <div className={styles.chartContainer}>
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        )}

        {tokenPrices.length > 0 && (
          <div className={styles.chartCard}>
            <h2>Price Change Ratios</h2>
            <h3>The current price is <strong>{tokenPrices[0].price}</strong></h3>
            <div className={styles.chartContainer}>
              <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        )}

        {nftMetadata.length > 0 && (
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
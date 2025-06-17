import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';

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
          <h2 className={styles.chartTitle}>NFT Metadata</h2>
          {nftMetadata.map(nft => (
            <div key={nft.tokenId} className={styles.nftCard}>
              <p className={styles.nftLine}><strong>Contract:</strong> <span className={styles.nftContract}>{nft.contract.symbol}</span> ({nft.contract.address})</p>
              <p className={styles.nftLine}><strong>Token ID:</strong> <span className={styles.nftContract}>{nft.tokenId}</span></p>
              <p className={styles.nftLine}><strong>URI:</strong> <a className={styles.nftLink} href={nft.tokenUri} target="_blank" rel="noopener noreferrer">View on IPFS</a></p>
              <p className={styles.nftAttributesTitle}><strong>Attributes:</strong></p>
              <ul className={styles.nftAttributesList}>
                {JSON.parse(nft.rawMetadata).attributes.map(attr => (
                  <li key={attr.trait_type} className={styles.nftAttributeItem}>{attr.trait_type}: {attr.value}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
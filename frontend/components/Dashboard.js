import { Pie } from 'react-chartjs-2';
import { processPieData } from '../lib/chartData';
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

export default function Dashboard({ transfers}) {
  const tokenDistribution = processPieData(transfers);
  console.log(tokenDistribution);

  // Common chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    }
  };

  return (
    <div className={styles.dashboardGrid}>
      <div className={styles.chartCard}>
        <h2>Token Distribution</h2>
        <div className={styles.chartContainer}>
          <Pie 
            data={tokenDistribution}
            options={chartOptions}
            redraw={true}
          />
        </div>
      </div>
    </div>
  );
}
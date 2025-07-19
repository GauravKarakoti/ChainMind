import { Bell, Zap, Activity, X, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';
import styles from './AlertCard.module.css';

export default function AlertCard({ alert, onEdit, onDelete, onToggle }) {
  const icons = {
    price: <DollarSign size={16} />,
    gas: <Zap size={16} />,
    whale: <Activity size={16} />,
    activity: <div>A</div>
  };

  return (
    <div className={`${styles.alertCard} ${alert.active ? styles.active : styles.inactive}`}>
      <div className={styles.alertHeader}>
        <div className={styles.alertIcon}>
          {icons[alert.type] || <Bell size={16} />}
        </div>
        <h3 className={styles.alertName}>{alert.name}</h3>
        <div className={styles.alertActions}>
          <button onClick={() => onEdit(alert)} className={styles.editButton}>
            Edit
          </button>
          <button onClick={() => onDelete(alert.id)} className={styles.deleteButton}>
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className={styles.alertDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Condition:</span>
          <span className={styles.detailValue}>
            {alert.token} {alert.condition} {alert.value}
            {alert.type === 'gas' ? ' gwei' : alert.type === 'whale' ? (alert.thresholdType === 'value' ? ' USD' : '%') : ''}
          </span>
        </div>
        
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Chain:</span>
          <span className={styles.detailValue}>
            {alert.chain.split('/')[0]}
          </span>
        </div>
        
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Frequency:</span>
          <span className={styles.detailValue}>
            {alert.frequency === 'once' ? 'One-time' : 'Recurring'}
          </span>
        </div>
      </div>
      
      <div className={styles.alertFooter}>
        <div className={styles.toggleContainer} onClick={() => onToggle(alert.id, !alert.active)}>
          {alert.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          <span className={styles.toggleLabel}>
            {alert.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className={styles.lastTriggered}>
          {alert.lastTriggered ? `Last triggered: ${formatDate(alert.lastTriggered)}` : 'Never triggered'}
        </div>
      </div>
    </div>
  );
}
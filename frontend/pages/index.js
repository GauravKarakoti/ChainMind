import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Dashboard from '../components/Dashboard';
import AlertConfig from '../components/AlertConfig';
import axios from 'axios';
import { HelpCircle, Bell } from 'lucide-react';
import GeneralResponse from '../components/GeneralResponse';
import AlertCard from '../components/AlertCard';

const EXAMPLE_QUERIES = [
  "Show my token transfers on 0x...",
  "What's the current price of AAVE?",
  "Display NFT metadata for 0x... #1234",
  "Transaction stats for ETH",
  "Portfolio performance on T..."
];

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

const HeaderButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: ${props => props.primary ? '#e0e7ff' : '#dbeafe'};
  color: ${props => props.primary ? '#4f46e5' : '#1d4ed8'};
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.primary ? '#c7d2fe' : '#bfdbfe'};
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  background: white;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.8rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const SearchButton = styled.button`
  padding: 0.8rem 1.5rem;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4f46e5;
  }

  &:disabled {
    background-color: #a5b4fc;
    cursor: not-allowed;
  }
`;

const ExamplesContainer = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
`;

const ExamplesTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
`;

const ExamplesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
`;

const ExampleButton = styled.button`
  padding: 0.25rem 0.75rem;
  background-color: #dbeafe;
  color: #1e40af;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #bfdbfe;
  }
`;

const AlertsPanel = styled.div`
  margin-bottom: 1.5rem;
`;

const AlertsList = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const AlertsTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #111827;
`;

const AlertItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
`;

const AlertInfo = styled.div`
  flex: 1;
`;

const AlertName = styled.div`
  font-weight: 500;
  color: #1f2937;
`;

const AlertDetails = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const DeleteButton = styled.button`
  color: #ef4444;
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #dc2626;
  }
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: #fee2e2;
  color: #dc2626;
  border-radius: 0.375rem;
  margin-top: 1rem;
`;

const ErrorCard = styled.div`
  padding: 1.5rem;
  background-color: #fef2f2;
  border-left: 4px solid #ef4444;
  border-radius: 0.375rem;
  margin-top: 1rem;
`;

const ErrorTitle = styled.h3`
  color: #dc2626;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const ErrorDetail = styled.p`
  color: #7f1d1d;
  font-size: 0.875rem;
`;

const DebugInfo = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #fecaca;
`;

const DebugLabel = styled.span`
  font-weight: 500;
  color: #b91c1c;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 2rem;
  color: #64748b;
`;

const AlertStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #4b5563;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
`;

const AlertGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [userAlerts, setUserAlerts] = useState([]);
  const [editingAlert, setEditingAlert] = useState(null);

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setShowAlerts(true);
  };

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/ask', { query });
      setResponse(res.data);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (alertData) => {
    try {
      const userId = "user-123"; // Should come from auth system
      const response = await axios.post('/api/alert', {
        ...alertData,
        userId
      });
      
      setUserAlerts([...userAlerts, response.data]);
      setShowAlerts(false);
      alert('Alert created successfully!');
    } catch (err) {
      console.error('Failed to create alert:', err);
      alert(`Failed to create alert: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await axios.delete(`/api/alert?alertId=${id}`);
      setUserAlerts(userAlerts.filter(alert => alert.id !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
      alert(`Failed to delete alert: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleUpdateAlert = async (alertData) => {
    try {
      const response = await axios.put(`/api/alert/${alertData.id}`, alertData);
      setUserAlerts(userAlerts.map(a => a.id === alertData.id ? response.data : a));
      setEditingAlert(null);
      setShowAlerts(false);
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const handleToggleAlert = async (id, active) => {
    try {
      await axios.patch(`/api/alert/${id}/toggle`, { active });
      setUserAlerts(userAlerts.map(a => a.id === id ? {...a, active} : a));
    } catch (err) {
      console.error('Failed to toggle alert:', err);
    }
  };

  useEffect(() => {
    const fetchUserAlerts = async () => {
      try {
        const userId = "user-123"; // Should come from auth system
        const response = await axios.get(`/api/alert?userId=${userId}`);
        setUserAlerts(response.data);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };
    
    fetchUserAlerts();
  }, []);

  return (
    <Container>
      <Header>
        <HeaderTitle>ChainMind Analytics</HeaderTitle>
        <HeaderButtonGroup>
          <HeaderButton 
            primary 
            onClick={() => setShowAlerts(!showAlerts)}
          >
            <Bell size={16} />
            Alerts {userAlerts.length > 0 && `(${userAlerts.length})`}
          </HeaderButton>
          <HeaderButton onClick={() => setShowExamples(!showExamples)}>
            <HelpCircle size={16} />
            Examples
          </HeaderButton>
        </HeaderButtonGroup>
      </Header>
      
      <SearchContainer>
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., token transfers, NFT data, portfolio performance..."
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
        />
        <SearchButton onClick={handleAsk} disabled={!query.trim() || loading}>
          {loading ? 'Analyzing...' : 'Ask ChainMind'}
        </SearchButton>
      </SearchContainer>
      
      {showExamples && (
        <ExamplesContainer>
          <ExamplesTitle>Try these examples:</ExamplesTitle>
          <ExamplesGrid>
            {EXAMPLE_QUERIES.map((example, i) => (
              <ExampleButton
                key={i}
                onClick={() => {
                  setQuery(example);
                  handleAsk();
                }}
              >
                {example}
              </ExampleButton>
            ))}
          </ExamplesGrid>
        </ExamplesContainer>
      )}

      {showAlerts && (
        <AlertsPanel>
          <AlertConfig 
            onSave={editingAlert ? handleUpdateAlert : handleCreateAlert} 
            onCancel={() => {
              setEditingAlert(null);
              setShowAlerts(false);
            }}
            initialData={editingAlert}
          />
          
          {userAlerts.length > 0 && (
            <AlertsList>
              <AlertsTitle>Your Alerts</AlertsTitle>
              <AlertStats>
                <span>Active: {userAlerts.filter(a => a.active).length}</span>
                <span>Total: {userAlerts.length}</span>
              </AlertStats>
              <AlertGrid>
                {userAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onEdit={handleEditAlert}
                    onDelete={handleDeleteAlert}
                    onToggle={handleToggleAlert}
                  />
                ))}
              </AlertGrid>
            </AlertsList>
          )}
        </AlertsPanel>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {response?.error && (
        <ErrorCard>
          <ErrorTitle>{response.error}</ErrorTitle>
          <ErrorDetail>{response.details}</ErrorDetail>
          
          {response.api && (
            <DebugInfo>
              <p><DebugLabel>API:</DebugLabel> {response.api}</p>
              <p><DebugLabel>Chain:</DebugLabel> {response.chain}</p>
              {response.params && (
                <p><DebugLabel>Params:</DebugLabel> {JSON.stringify(response.params)}</p>
              )}
            </DebugInfo>
          )}
        </ErrorCard>
      )}

      {loading && <LoadingIndicator>Analyzing blockchain data...</LoadingIndicator>}

      {response && response.type === 'general' && (
        <GeneralResponse response={response.response} />
      )}
      
      {response && response.type !== 'general' && (
        <Dashboard data={response} />
      )}
    </Container>
  );
}
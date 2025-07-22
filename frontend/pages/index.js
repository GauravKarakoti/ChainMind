import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import Dashboard from '../components/Dashboard';
import AlertConfig from '../components/AlertConfig';
import axios from 'axios';
import { HelpCircle, Bell, X, Search, Zap, Activity } from 'lucide-react';
import GeneralResponse from '../components/GeneralResponse';
import AlertCard from '../components/AlertCard';
import LogoutButton from '../components/LogoutButton';

const EXAMPLE_QUERIES = [
  "Show my token transfers on 0x...",
  "What's the current price of AAVE?",
  "Display NFT metadata for 0x... #1234",
  "Transaction stats for ETH",
  "Portfolio performance on T..."
];

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #e0f4ff 0%, #f8fafc 50%, #ffffff 100%);
  position: relative;
  overflow-x: hidden;
  
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(147, 197, 253, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(219, 234, 254, 0.1) 0%, transparent 50%);
    pointer-events: none;
     
  }
`;

const Container = styled.div`
  width:100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  position:relative;
  z-index:1;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding: 2rem 2.5rem;
  background: linear-gradient(135deg, #dbeafe 0%, #ffffff 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1.5rem;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.05),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(59, 130, 246, 0.05);
  backdrop-filter: blur(10px);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(147, 197, 253, 0.05) 100%);
    border-radius: inherit;
    pointer-events: none;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  z-index: 1;
  
  &::after {
    content: '⛓️';
    font-size: 1.5rem;
    filter: none;
    -webkit-text-fill-color: initial;
  }
`;

const HeaderButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  position:relative;
  z-index: 1;
`;

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: ${props => props.primary 
    ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' 
    : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)'};
  color: ${props => props.primary ? '#ffffff' : '#1e40af'};
  border: 1px solid ${props => props.primary ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'};
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -3px rgba(59, 130, 246, 0.2);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1.5rem;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.05),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.01) 0%, rgba(147, 197, 253, 0.02) 100%);
    border-radius: inherit;
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 800px;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 1rem;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const SearchInputGroup = styled.div`
  display: flex;
  gap: 1rem;
  position: relative;
  z-index: 1;
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  z-index: 2;
`;

const SearchButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.39);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.5);
    
    &::before {
      left: 100%;
    }
  }

  &:disabled {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
`;

const Panel = styled.div`
  margin-bottom: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.01) 0%, rgba(147, 197, 253, 0.02) 100%);
    border-radius: inherit;
    pointer-events: none;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
`;

const PanelTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
  }
`;

const ExamplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  position: relative;
  z-index: 1;
`;

const ExampleButton = styled.button`
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
`;

const AlertsList = styled.div`
  margin-top: 1.5rem;
  position: relative;
  z-index: 1;
`;

const AlertStats = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f4ff 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e40af;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AlertGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
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

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [userAlerts, setUserAlerts] = useState([]);
  const [editingAlert, setEditingAlert] = useState(null);
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setShowAlerts(true);
  };

  const handleAsk = async () => {
    if (!query.trim()) return;
    const token = localStorage.getItem('token');
    
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/ask', { query }, {
        headers: { 'x-auth-token': token }
      });
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
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/alert', alertData, {
        headers: { 'x-auth-token': token }
      });
      
      setUserAlerts(prev => [
      ...prev, 
      {
        ...response.data,
        userId: user.id, // Add user ID
        active: true,
        address: response.data.accountAddress // Map to expected field
      }
    ]);
      setShowAlerts(false);
      alert('Alert created successfully!');
    } catch (err) {
      console.error('Failed to create alert:', err);
      alert(`Failed to create alert: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/alert?alertId=${id}`, {
        headers: { 'x-auth-token': token }
      });
      setUserAlerts(userAlerts.filter(alert => alert.id !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
      alert(`Failed to delete alert: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleUpdateAlert = async (alertData) => {
    try {
      const id = editingAlert.id;
      const token = localStorage.getItem('token');
      console.log('Updating alert:', id, alertData);
      const response = await axios.put(`/api/alert?alertId=${id}`, { 
        updateData: alertData,
        id
      },{
        headers: { 'x-auth-token': token }
      });
      setUserAlerts(userAlerts.map(a => a.id === alertData.id ? response.data : a));
      setEditingAlert(null);
      setShowAlerts(false);
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const handleToggleAlert = async (id, active) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/alert?alertId=${id}`, { active },{
        headers: { 'x-auth-token': token }
      });
      setUserAlerts(prev => prev.map(a => 
        a.id === id ? {...a, active} : a
      ));
    } catch (err) {
      console.error('Failed to toggle alert:', err);
    }
  };

  const handleCloseDashboard = () => {
    setResponse(null);
    setQuery(''); // Clear the search input
  };

  useEffect(() => {
    // Set flag to indicate we're on the client side
    setIsClient(true);
    
    // Only run on client side
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      fetchUserAlerts();
    } else {
      console.warn('No user found, redirecting to register');
      router.push('/register');
    }
  }, []);

  const fetchUserAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/alert', {
        headers: { 'x-auth-token': token }
      });
      setUserAlerts(response.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <PageWrapper>
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
            <LogoutButton />
          </HeaderButtonGroup>
        </Header>
        
        <SearchContainer>
          <SearchInputGroup>
            <SearchInputWrapper>
              <SearchIcon size={20} />
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., token transfers, NFT data, portfolio performance..."
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              />
            </SearchInputWrapper>
            <SearchButton onClick={handleAsk} disabled={!query.trim() || loading}>
              {loading ? (
                <>
                  <Activity size={16} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Ask ChainMind
                </>
              )}
            </SearchButton>
          </SearchInputGroup>
        </SearchContainer>
        
        {showExamples && (
          <Panel>
            <PanelHeader>
              <PanelTitle>
                <HelpCircle size={20} />
                Try these examples:
              </PanelTitle>
              <CloseButton onClick={() => setShowExamples(false)}>
                <X size={16} />
              </CloseButton>
            </PanelHeader>
            <ExamplesGrid>
              {EXAMPLE_QUERIES.map((example, i) => (
                <ExampleButton
                  key={i}
                  onClick={() => {
                    setQuery(example);
                    setShowExamples(false);
                    handleAsk();
                  }}
                >
                  {example}
                </ExampleButton>
              ))}
            </ExamplesGrid>
          </Panel>
        )}

        {showAlerts && (
          <Panel>
            <PanelHeader>
              <PanelTitle>
                <Bell size={20} />
                Alert Configuration
              </PanelTitle>
              <CloseButton onClick={() => {
                setEditingAlert(null);
                setShowAlerts(false);
              }}>
                <X size={16} />
              </CloseButton>
            </PanelHeader>
            
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
                <PanelTitle style={{ marginBottom: '1rem' }}>Your Alerts</PanelTitle>
                <AlertStats>
                  <StatItem>
                    <Activity size={16} />
                    Active: {userAlerts.filter(a => a.active).length}
                  </StatItem>
                  <StatItem>
                    <Bell size={16} />
                    Total: {userAlerts.length}
                  </StatItem>
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
          </Panel>
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
          <GeneralResponse response={response.response}
           onClose={() => setQuery('')} />
        )}
        
        {response && response.type !== 'general' && (
          <Dashboard 
            data={response} 
            onClose={handleCloseDashboard}
          />
        )}
      </Container>
    </PageWrapper>
  );
}
import { useState } from 'react';
import styled from 'styled-components';
import Dashboard from '../components/Dashboard';
import axios from 'axios';

const Container = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
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

const Input = styled.input`
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

const Button = styled.button`
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

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: #64748b;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: #fee2e2;
  color: #dc2626;
  border-radius: 0.375rem;
  margin-top: 1rem;
`;

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAsk = async () => {
    if (!query.trim()) {
      // Don’t send a request if the input is empty/whitespace.
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/ask', { query });
      setResponse(res.data);
      console.log(res.data);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderChainInfo = () => {
    if (!response) return null;
    
    return (
      <div className="chain-badge">
        {response.chain.split('/')[0].toUpperCase()}
      </div>
    );
  };

  return (
    <Container>
      <SearchContainer>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about wallet activity, token performance, or set alerts..."
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
        />
        <Button onClick={handleAsk} disabled={!query.trim() || loading}>
          {loading ? 'Analyzing...' : 'Ask ChainMind'}
        </Button>
      </SearchContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading && <Loading>Analyzing blockchain data...</Loading>}

      {response && (
        <>
          {renderChainInfo()}
          <Dashboard
            data={response}
          />
        </>
      )}
    </Container>
  );
}
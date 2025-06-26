import { useState } from 'react';
import styled from 'styled-components';
import Dashboard from '../components/Dashboard';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import { HelpCircle } from 'lucide-react';

const EXAMPLE_QUERIES = [
  "Show my token transfers on 0x...",
  "What's the current price of AAVE?",
  "Display NFT metadata for 0x... #1234",
  "Transaction stats for ETH",
  "Portfolio performance on T..."
];

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

const ExampleDiv = styled.div`
  margin-bottom: 1rem;
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

const ExampleButton = styled.button`
  margin-right: 0.8rem;
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

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExamples, setShowExamples] = useState(false);

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

  return (
    <Container>
      <SearchContainer>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., token transfers, NFT data, portfolio performance..."
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
        />
        <HelpCircle 
          className="absolute right-3 top-3 text-gray-400 cursor-pointer"
          size={20}
          onClick={() => setShowExamples(!showExamples)}
          data-tooltip-id="help-tooltip"
        />
        <Tooltip id="help-tooltip" place="top">
          Show example queries
        </Tooltip>
        <Button onClick={handleAsk} disabled={!query.trim() || loading}>
          {loading ? (
            <span className="flex items-center">
              Analyzing...
            </span>
          ) : 'Ask ChainMind'}
        </Button>
      </SearchContainer>
      
      {showExamples && (
        <ExampleDiv className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Try these examples:</h3>
          <div className="flex flex-wrap gap-2 p-2">
            {EXAMPLE_QUERIES.map((example, i) => (
              <ExampleButton
                key={i}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full"
                onClick={() => {
                  setQuery(example);
                  handleAsk();
                }}
              >
                {example}
              </ExampleButton>
            ))}
          </div>
        </ExampleDiv>
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

      {loading && <Loading>Analyzing blockchain data...</Loading>}

      {response && (
        <>
          <Dashboard data={response} />
        </>
      )}
    </Container>
  );
}
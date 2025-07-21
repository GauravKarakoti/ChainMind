import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

const Container = styled.div`
  position: relative;
  padding: 1.75rem;
  background-color: white;
  border-radius: 0.875rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  margin-top: 2rem;
  border: 1px solid #f0f0f0;
  display: ${props => props.visible ? 'block' : 'none'};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
`;

const Title = styled.h2`
  font-size: 1.375rem;
  font-weight: 650;
  color: #111827;
  margin: 0;
  letter-spacing: -0.015em;
  background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
`;

const CloseButton = styled.button`
  background-color: #fef2f2;
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #ef4444;
    color: white;
    transform: scale(1.08);
  }
`;

const ResponseContent = styled.div`
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 0.625rem;
  line-height: 1.7;
  font-size: 1.05rem;
  color: #374151;
  border: 1px solid #e5e7eb;
  font-weight: 450;
  
  p {
    margin: 0 0 1.25rem 0;
    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: #111827;
    font-weight: 600;
  }

  a {
    color: #3b82f6;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ResponseText = styled.div`
  white-space: pre-line;
  word-break: break-word;
`;

export default function GeneralResponse({ response ,onClose }) {
  const [visible, setVisible] = useState(true);
  

  useEffect(() => {
    setVisible(true);
  }, [response]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose(); 
    }
  };

  return (
    <Container visible={visible}>
      <Header>
        <Title>ChainMind Response</Title>
        <CloseButton onClick={handleClose}>
          <X size={18} />
        </CloseButton>
      </Header>
      <ResponseContent>
        <ResponseText>
          {typeof response === 'string' ? (
            <p>{response}</p>
          ) : (
            response
          )}
        </ResponseText>
      </ResponseContent>
    </Container>
  );
}
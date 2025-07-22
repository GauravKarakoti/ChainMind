import { useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import axios from 'axios';

// Styled components
const Container = styled.div`
  max-width: 480px;
  margin: 3rem auto;
  padding: 2.5rem;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 1.5rem;
  box-shadow: 
    0 20px 40px rgba(59, 130, 246, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(59, 130, 246, 0.15);
  position: relative;
  overflow: hidden;
  min-height: fit-content;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8, #2563eb, #3b82f6);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { background-position: 200% 0; }
    50% { background-position: -200% 0; }
  }

  @media (max-width: 640px) {
    margin: 2rem 1rem;
    padding: 2rem;
  }
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 1.25rem;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #2563eb 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.1;
  text-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
`;

const InfoText = styled.p`
  font-size: 1.05rem;
  color: #475569;
  margin-bottom: 2rem;
  text-align: center;
  line-height: 1.6;
  padding: 0 0.5rem;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 400px;
  padding: 1.1rem 1.25rem;
  padding-left: 3.25rem;
  font-size: 1.05rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 
    0 3px 10px rgba(59, 130, 246, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  font-weight: 600;
  color: #1e293b;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    background: #ffffff;
    box-shadow: 
      0 0 0 4px rgba(59, 130, 246, 0.15),
      0 8px 25px rgba(59, 130, 246, 0.12);
    transform: translateY(-2px);
  }
  
  &::placeholder {
    color: #94a3b8;
    font-weight: 500;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1.1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 1.2rem;
  transition: color 0.3s ease;
  z-index: 1;
  pointer-events: none;
`;

const Button = styled.button`
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #2563eb 100%);
  color: white;
  font-size: 1.15rem;
  font-weight: 800;
  border: none;
  border-radius: 0.875rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.3),
    0 4px 12px rgba(59, 130, 246, 0.2);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 12px 35px rgba(59, 130, 246, 0.4),
      0 8px 20px rgba(59, 130, 246, 0.25);
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1d4ed8 100%);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      transform: none;
      box-shadow: 
        0 8px 25px rgba(59, 130, 246, 0.3),
        0 4px 12px rgba(59, 130, 246, 0.2);
    }
  }
`;

const Error = styled.div`
  padding: 1.25rem;
  background: linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border-radius: 0.875rem;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  border: 1px solid #fecaca;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 2.5rem;
  color: #475569;
  font-size: 1.05rem;
  font-weight: 600;
  
  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 800;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    transition: all 0.3s ease;
    
    &:hover {
      text-decoration: underline;
      text-decoration-color: #3b82f6;
      text-decoration-thickness: 2px;
    }
  }
`;

// Icons as components
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.2 2.9L3.1 10.1c-1.5.6-1.4 1.4-.3 1.7l4.4 1.3 2.3 7c.3.8.6.9 1.2.5l3.3-2.4 3.4 2.5c.6.4 1.1.2 1.3-.5l2.3-10.7c.3-1.3.5-1.5-1.2-2.4z"></path>
    <path d="M9.5 13.4l7.1-5.3"></path>
  </svg>
);

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        '/api/auth?action=register', 
        { 
          email, 
          password, 
          telegram_chat_id: telegramChatId 
        }
      );
      
      const data = response.data;
      
      if (response.status === 201) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          email: data.email,
          telegram_chat_id: data.telegram_chat_id
        }));
        router.push('/');

      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Title>Create Account</Title>
      <InfoText>
        Get your Telegram Chat ID from @RawDataBot on Telegram. This will be used to send you alerts.
      </InfoText>
      
      <Form onSubmit={handleSubmit}>
        {error && <Error>{error}</Error>}
        
        <InputGroup>
          <InputIcon>
            <EmailIcon />
          </InputIcon>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </InputGroup>
        
        <InputGroup>
          <InputIcon>
            <LockIcon />
          </InputIcon>
          <Input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </InputGroup>
        
        <InputGroup>
          <InputIcon>
            <TelegramIcon />
          </InputIcon>
          <Input
            type="text"
            placeholder="Telegram Chat ID"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            required
          />
        </InputGroup>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Register'}
        </Button>
      </Form>
      
      <FooterText>
        Already have an account? <a href="/login">Sign in</a>
      </FooterText>
    </Container>
  );
}
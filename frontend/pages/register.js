import { useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import axios from 'axios';

// Styled components
const Container = styled.div`
  max-width: 500px;
  margin: 5rem auto;
  padding: 3rem;
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #eaeaea;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 1.5rem;
  color: #4f46e5;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
`;

const InfoText = styled.p`
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 2rem;
  text-align: center;
  line-height: 1.6;
  padding: 0 1rem;
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
  width: 100%;
  padding: 1.1rem 0rem;
  padding-left: 3rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.25rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 1.1rem;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  font-size: 1.05rem;
  font-weight: 600;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(79, 70, 229, 0.25);
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Error = styled.div`
  padding: 1rem;
  background-color: #fef2f2;
  color: #ef4444;
  border-radius: 0.75rem;
  text-align: center;
  font-size: 0.95rem;
  border: 1px solid #fee2e2;
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 2rem;
  color: #64748b;
  font-size: 0.95rem;
  
  a {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// Icons as components
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
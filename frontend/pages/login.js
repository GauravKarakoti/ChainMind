import { useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import axios from 'axios';

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
  transition: all 0.3s;
  text-transform: uppercase;

  &:hover {
    transform: translateY(-3px);
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1d4ed8 100%);
    box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Error = styled.div`
  padding: 1rem;
  background: #fee2e2;
  color: #dc2626;
  font-weight: 700;
  text-align: center;
  border-radius: 0.75rem;
  border: 1px solid #fecaca;
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 2rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: #475569;

  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 800;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const EmailIcon = () => (
  <InputIcon>
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  </InputIcon>
);
const LockIcon = () => (
  <InputIcon>
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  </InputIcon>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth?action=login', { email, password });
      const { token, id, telegram_chat_id } = res.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ id, email, telegram_chat_id }));
        router.push('/');
      } else {
        setError(res.data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Try again.');
    }
  };

  return (
    <Container>
      <Title>Welcome Back</Title>

      <Form onSubmit={handleSubmit}>
        {error && <Error>{error}</Error>}

        <InputGroup>
          <EmailIcon />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </InputGroup>

        <InputGroup>
          <LockIcon />
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </InputGroup>

        <Button type="submit">Login</Button>
      </Form>

      <FooterText>
        New here? <a href="/register">Create an account</a>
      </FooterText>
    </Container>
  );
}

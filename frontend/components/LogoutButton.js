import { Power } from 'lucide-react';
import styled from 'styled-components';
import { useRouter } from 'next/router';

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #fecaca;
  }
`;

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <Button onClick={handleLogout}>
      <Power size={16} />
      Logout
    </Button>
  );
}
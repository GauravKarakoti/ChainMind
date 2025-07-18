import styled from 'styled-components';

const Container = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-top: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
`;

const ResponseContent = styled.div`
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  line-height: 1.6;
  font-size: 1rem;
`;

export default function GeneralResponse({ response }) {
  return (
    <Container>
      <Header>
        <Title>ChainMind Response</Title>
      </Header>
      <ResponseContent>
        {response}
      </ResponseContent>
    </Container>
  );
}
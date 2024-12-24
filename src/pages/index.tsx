// src/pages/index.tsx
import React from 'react';
import { Container, Typography } from '@mui/material';
import Chat from '../components/Chat';
import { StateProvider } from '../context/StateContext';

const HomePage = () => {
  return (
    <StateProvider>
      <Container maxWidth="md" style={{ marginTop: '50px' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Multi-LLM Chat Interface
        </Typography>
        <Chat />
      </Container>
    </StateProvider>
  );
};

export default HomePage;

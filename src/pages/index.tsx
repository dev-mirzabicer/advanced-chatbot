// src/pages/index.tsx
import React from 'react';
import { Container, Typography } from '@mui/material';
import Chat from '../components/Chat';
import Layout from '../components/Layout';
import { StateProvider } from '../context/StateContext';

const HomePage = () => {
  return (
    <StateProvider>
      <Layout>
        <Container maxWidth="md">
          <Chat />
        </Container>
      </Layout>
    </StateProvider>
  );
};

export default HomePage;

// src/components/Chatroom.tsx
import React, { useContext } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PDFUpload from './PDFUpload';
import { StateContext } from '../context/StateContext';

const Chatroom = () => {
  const { loading } = useContext(StateContext);

  return (
    <Box display="flex" flexDirection="column" height="100vh" padding={2}>
      <Typography variant="h4" gutterBottom>
        Advanced Chatbot System
      </Typography>
      <Box flex={1} overflow="auto" mb={2}>
        <MessageList />
      </Box>
      <PDFUpload />
      <MessageInput />
      {loading && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default Chatroom;

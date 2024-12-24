// src/components/Chat.tsx
import React from 'react';
import { Box } from '@mui/material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const Chat = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      height="80vh"
      p={2}
      border="1px solid #ccc"
      borderRadius="8px"
    >
      <Box overflow="auto" flexGrow={1}>
        <MessageList />
      </Box>
      <Box mt={2}>
        <MessageInput />
      </Box>
    </Box>
  );
};

export default Chat;

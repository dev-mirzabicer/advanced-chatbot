// src/components/MessageList.tsx
import React, { useContext, useEffect, useRef } from 'react';
import { StateContext } from '../context/StateContext';
import { Box, Typography, Paper } from '@mui/material';

const MessageList = () => {
  const { messages } = useContext(StateContext);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatRole = (role: string) => {
    if (role === 'user') return 'User';
    if (role === 'moderator') return 'Moderator';
    if (role.startsWith('assistant-'))
      return `Assistant (${role.split('-')[1].replace('-', ' ')})`;
    if (role === 'context') return 'Context Document';
    return role;
  };

  return (
    <Box>
      {messages.map((msg) => (
        <Box key={msg.id} mb={2}>
          <Typography variant="subtitle2" color="textSecondary">
            {formatRole(msg.role)}{' '}
            <span style={{ fontSize: '0.8em', color: '#888' }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </Typography>
          <Paper
            elevation={1}
            style={{
              padding: '10px',
              backgroundColor:
                msg.role === 'user'
                  ? '#e0f7fa'
                  : msg.role.startsWith('assistant-')
                  ? '#f1f8e9'
                  : msg.role === 'moderator'
                  ? '#ffe0b2'
                  : '#f5f5f5',
            }}
          >
            <Typography variant="body1">{msg.content}</Typography>
          </Paper>
        </Box>
      ))}
      <div ref={endOfMessagesRef} />
    </Box>
  );
};

export default MessageList;

// src/components/MessageList.tsx
import React, { useContext, useEffect, useRef } from 'react';
import { StateContext } from '../context/StateContext';
import { Box, Typography, Paper } from '@mui/material';

/**
 * Capitalizes the first letter of a string.
 * @param text - The string to capitalize.
 * @returns The capitalized string.
 */
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Determines the background color based on the assistant's role.
 * @param role - The role of the assistant.
 * @returns A hexadecimal color code.
 */
const getAssistantColor = (role: string): string => {
  const assistantName = role.split('-')[1].toLowerCase();
  switch (assistantName) {
    case 'researcher':
      return '#fce4ec'; // Pinkish for Researcher
    case 'planner':
      return '#e8f5e9'; // Greenish for Planner
    case 'software engineer':
      return '#e3f2fd'; // Blueish for Software Engineer
    case 'mike':
      return '#fff3e0'; // Orangeish for Mike
    case 'academician':
      return '#ede7f6'; // Purpleish for Academician
    default:
      return '#f1f8e9'; // Default color
  }
};

const MessageList = () => {
  const { messages } = useContext(StateContext);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Formats the role for display purposes.
   * @param role - The role of the message sender.
   * @returns A user-friendly role name.
   */
  const formatRole = (role: string) => {
    if (role === 'user') return 'User';
    if (role === 'moderator') return 'Moderator';
    if (role.startsWith('assistant-'))
      return `Assistant (${capitalize(role.split('-')[1].replace('-', ' '))})`;
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
                  ? getAssistantColor(msg.role)
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

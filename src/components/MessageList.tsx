// src/components/MessageList.tsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import { StateContext, DispatchContext } from '../context/StateContext';
import { Box, Typography, Paper, IconButton, Tooltip, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Capitalizes the first letter of each word in a string.
 * @param text - The string to capitalize.
 * @returns The capitalized string.
 */
const capitalizeWords = (text: string) =>
  text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
    case 'software-engineer':
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
  const { chats, activeChatId } = useContext(StateContext);
  const messages = chats[activeChatId]?.messages || [];
  const dispatch = useContext(DispatchContext);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // State for editing messages
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<string>('');

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
      return `Assistant: ${capitalizeWords(role.split('-')[1])}`;
    if (role === 'context') return 'Context Document';
    return role;
  };

  const handleEditClick = (messageId: string, content: string) => {
    setEditingId(messageId);
    setDraftContent(content);
  };

  const handleSave = (messageId: string) => {
    if (draftContent.trim() === '') return;
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { chatId: activeChatId, id: messageId, newContent: draftContent },
    });
    setEditingId(null);
    setDraftContent('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setDraftContent('');
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
            sx={{
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
            {editingId === msg.id ? (
              // Editing mode
              <Box display="flex" alignItems="center">
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                />
                <Tooltip title="Save">
                  <IconButton onClick={() => handleSave(msg.id)}>
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton onClick={handleCancel}>
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              // Display mode
              <Box display="flex" alignItems="center">
                <Box flexGrow={1}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </Box>
                {msg.role === 'user' && (
                  <Tooltip title="Edit Message">
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(msg.id, msg.content)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      ))}
      <div ref={endOfMessagesRef} />
    </Box>
  );
};

export default MessageList;

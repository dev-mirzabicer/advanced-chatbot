// src/components/MessageList.tsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import { StateContext, DispatchContext, Message } from '../context/StateContext';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Capitalizes the first letter of each word in a string.
 * @param text - The string to capitalize.
 * @returns The capitalized string.
 */
const capitalizeWords = (text: string) => {
  if (text.search("-")) return text
    .split('-')
    .map((word) => word.charAt(1).toUpperCase() + word.slice(2))
    .join(' ');
  else return text.charAt(1).toUpperCase() + text.slice(2);
}
/**
 * Determines the background color based on the assistant's role.
 * @param role - The role of the assistant.
 * @returns A hexadecimal color code.
 */
const getAssistantColor = (role: string): string => {
  const assistantName = role.split('-')[1].toLowerCase().replace("{","").replace("}","");
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
        return `Assistant: ${capitalizeWords(role.split('-')[1]).replace("{", "").replace("}", "")}`;
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
  
    /**
     * Parses moderator commands to display them in a user-friendly manner.
     * @param rawContent - The raw command string from the moderator.
     * @returns JSX.Element representing the parsed content.
     */
    const renderModeratorContent = (rawContent: string) => {
      // Regular expressions to capture commands
      const teamRegex = /!team\s*\{([^}]*)\}/;
      const allowSpeakRegex = /!allowspeak\s*\{([^}]*)\}/g;
      const denyRegex = /!deny\s*\{([^}]*)\}/g;
      const yieldRegex = /!yield/;
  
      let teamMessage = '';
      const teamMatch = teamRegex.exec(rawContent);
      if (teamMatch) {
        teamMessage = teamMatch[1]; // Content inside !team { ... }
      }
  
      const allowedSpeakers: string[] = [];
      let allowSpeakMatch;
      while ((allowSpeakMatch = allowSpeakRegex.exec(rawContent)) !== null) {
        allowedSpeakers.push(allowSpeakMatch[1]);
      }
  
      let denySpeakers: string[] = [];
      let denySpeakMatch;
      while ((denySpeakMatch = denyRegex.exec(rawContent)) !== null) {
        denySpeakers.push(denySpeakMatch[1]);
      }
  
      const isYield = yieldRegex.test(rawContent);
  
      return (
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="moderator-content"
            id="moderator-content-header"
          >
            <Typography variant="subtitle2" color="textSecondary">
              [Moderator sent a message to the team (click to toggle)]
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {teamMessage && (
              <Typography variant="body2" gutterBottom>
                <strong>Team Message:</strong> {teamMessage}
              </Typography>
            )}
            {allowedSpeakers.length > 0 && (
              <Typography variant="body2" gutterBottom>
                <strong>Allowed Speakers:</strong> {allowedSpeakers.join(', ')}
              </Typography>
            )}
            {denySpeakers.length > 0 && (
              <Typography variant="body2" gutterBottom>
                <strong>Denied Speakers:</strong> {denySpeakers.join(', ')}
              </Typography>
            )}
            {isYield && (
              <Typography variant="body2" gutterBottom>
                <strong>Yielded Control:</strong> Moderator has yielded control back to the user.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      );
    };
  
    /**
     * Renders assistant messages, transforming '!OK' into a friendly acknowledgment.
     * @param msg - The message object.
     * @returns JSX.Element representing the assistant message.
     */
    const renderAssistantContent = (msg: Message) => {
      const assistantName = capitalizeWords(msg.role.split('-')[1]).replace("{","").replace("}","");
  
      if (msg.content.trim() === '!OK') {
        return (
          <Box>
            <Paper elevation={1} sx={{ padding: '10px', backgroundColor: getAssistantColor(msg.role) }}>
            <Typography variant="subtitle2" color="textSecondary">
              {assistantName} nodded.
            </Typography>
            </Paper>
          </Box>
        );
      }
  
      // Regular assistant message
      return (
        <Box>
          <Paper elevation={1} sx={{ padding: '10px', backgroundColor: getAssistantColor(msg.role) }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </Paper>
        </Box>
      );
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
            {msg.role === 'moderator' ? (
              renderModeratorContent(msg.content)
            ) : msg.role.startsWith('assistant-') ? (
              renderAssistantContent(msg)
            ) : (
              <Paper
                elevation={1}
                sx={{
                  padding: '10px',
                  backgroundColor:
                    msg.role === 'user'
                      ? '#e0f7fa'
                      : msg.role === 'context'
                      ? '#f5f5f5'
                      : '#ffe0b2', // Default for moderator
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
                      <>
                        <Tooltip title="Edit Message">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(msg.id, msg.content)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete This Message & Subsequent">
                          <IconButton
                            size="small"
                            onClick={() => {
                              dispatch({
                                type: 'DELETE_MESSAGE_AND_SUBSEQUENT',
                                payload: { chatId: activeChatId, messageId: msg.id },
                              });
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        ))}
        <div ref={endOfMessagesRef} />
      </Box>
    );
  };
  
  export default MessageList;
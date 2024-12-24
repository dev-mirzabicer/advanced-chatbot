// src/components/MessageInput.tsx
import React, { useState, useContext } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { StateContext, DispatchContext } from '../context/StateContext';
import { v4 as uuidv4 } from 'uuid';
import { callLLM } from '../utils/assistantAPI';

const MessageInput = () => {
  const [input, setInput] = useState('');
  const state = useContext(StateContext);
  const dispatch = useContext(DispatchContext);

  const handleSend = async () => {
    if (!input.trim()) return;

    const isCommand = input.trim().startsWith('!');
    if (isCommand) {
      handleCommand(input.trim());
    } else {
      await handleUserMessage(input.trim());
    }
    setInput('');
  };

  const handleUserMessage = async (message: string) => {
    // The user is speaking
    const userMessage = {
      id: uuidv4(),
      role: 'user' as
        | 'user'
        | 'moderator'
        | 'assistant-planner'
        | 'assistant-researcher'
        | 'assistant-software-engineer'
        | 'assistant-mike'
        | 'assistant-academician'
        | 'context',
      content: message,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: { chatId: state.activeChatId, message: userMessage } });
    dispatch({ type: 'SET_LOADING', payload: true });

    // Prepare the conversation to pass
    let fullConversation = [
      ...state.chats[state.activeChatId].messages,
      userMessage,
      ...state.chats[state.activeChatId].contextDocs.map((doc, idx) => ({
        id: uuidv4(),
        role: 'context',
        content: `Context Document ${idx + 1}: ${doc}`,
        timestamp: Date.now(),
      })),
    ];

    try {
      // Call the moderator
      const moderatorResponse = await callLLM('moderator', fullConversation, state.activeChatId);

      // Add moderator’s message
      const moderatorMessage = {
        id: uuidv4(),
        role: 'moderator' as
          | 'user'
          | 'moderator'
          | 'assistant-planner'
          | 'assistant-researcher'
          | 'assistant-software-engineer'
          | 'assistant-mike'
          | 'assistant-academician'
          | 'context',
        content: moderatorResponse,
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: { chatId: state.activeChatId, message: moderatorMessage } });

      fullConversation = [...fullConversation, moderatorMessage];

      // Parse commands from the moderator to see which assistants to call
      await parseModeratorCommandsAndTrigger(moderatorResponse, fullConversation);
    } catch (error) {
      console.error('Error during LLM calls:', error);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          chatId: state.activeChatId,
          message: {
            id: uuidv4(),
            role: 'moderator',
            content: 'There was an error processing your request.',
            timestamp: Date.now(),
          },
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const parseModeratorCommandsAndTrigger = async (text: string, conversation: any[]) => {
    const { activeChatId } = state;
    const lines = text.split('\n').map((l) => l.trim());
    const toAllow: string[] = [];
    let doYield = false;

    lines.forEach((line) => {
      if (line.startsWith('!allowspeak')) {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          const assistant = parts[1].toLowerCase();
          toAllow.push(assistant);
        }
      } else if (line.startsWith('!deny')) {
        // We can implement deny functionality if needed
      } else if (line.startsWith('!yield')) {
        doYield = true;
      }
      // Additional command parsing can be added here
    });

    if (doYield) {
      dispatch({ type: 'RESET_ROUND', payload: activeChatId });
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          chatId: activeChatId,
          message: {
            id: uuidv4(),
            role: 'moderator',
            content: 'Moderator has yielded control to the user.',
            timestamp: Date.now(),
          },
        },
      });
      return;
    }

    // Call allowed assistants
    for (const assistant of toAllow) {
      try {
        const assistantResponse = await callLLM(assistant, conversation, activeChatId);
        const assistantMessage = {
          id: uuidv4(),
          role: `assistant-${assistant}` as
            | 'user'
            | 'moderator'
            | 'assistant-planner'
            | 'assistant-researcher'
            | 'assistant-software-engineer'
            | 'assistant-mike'
            | 'assistant-academician'
            | 'context',
          content: assistantResponse,
          timestamp: Date.now(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: { chatId: activeChatId, message: assistantMessage } });
        conversation = [...conversation, assistantMessage];
        dispatch({ type: 'ADD_RESPONDED_ASSISTANT', payload: { chatId: activeChatId, assistant } });
      } catch (err) {
        console.error(`Error calling assistant ${assistant}:`, err);
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            chatId: activeChatId,
            message: {
              id: uuidv4(),
              role: 'moderator',
              content: `Error retrieving response from ${assistant}.`,
              timestamp: Date.now(),
            },
          },
        });
      }
    }
  };

  // Handling direct user-typed commands
  const handleCommand = (commandText: string) => {
    const [command, ...args] = commandText.split(' ');

    switch (command.toLowerCase()) {
      case '!allowspeak':
      case '!deny':
      case '!yield':
      case '!team':
      case '!user':
        // Treat user-typed commands as moderator commands
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            chatId: state.activeChatId,
            message: {
              id: uuidv4(),
              role: 'moderator',
              content: `(User typed) ${commandText}`,
              timestamp: Date.now(),
            },
          },
        });
        break;
      default:
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            chatId: state.activeChatId,
            message: {
              id: uuidv4(),
              role: 'moderator',
              content: `Unknown command: ${command}`,
              timestamp: Date.now(),
            },
          },
        });
        break;
    }
  };

  return (
    <Box display="flex" mt={2}>
      <TextField
        fullWidth
        variant="outlined"
        label="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') handleSend();
        }}
        disabled={state.loading}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSend}
        sx={{ marginLeft: '8px' }}
        disabled={state.loading}
      >
        Send
      </Button>
    </Box>
  );
};

export default MessageInput;

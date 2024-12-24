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
      role: 'user' as (
        | 'user'
        | 'moderator'
        | 'assistant-planner'
        | 'assistant-researcher'
        | 'assistant-software-engineer'
        | 'assistant-mike'
        | 'assistant-academician'
        | 'context'),
      content: message,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });


    // Prepare the conversation to pass
    let fullConversation = [
      ...state.messages,
      userMessage,
      ...state.contextDocs.map((doc, idx) => ({
        id: uuidv4(),
        role: 'context',
        content: `Context Document ${idx + 1}: ${doc}`,
        timestamp: Date.now(),
      })),
    ];

    try {
      // Call the moderator
      const moderatorResponse = await callLLM('moderator', fullConversation);

      // Add moderator’s message
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: moderatorResponse,
          timestamp: Date.now(),
        },
      });

        fullConversation = [
            ...fullConversation,
            {
            id: uuidv4(),
            role: 'moderator',
            content: moderatorResponse,
            timestamp: Date.now(),
            },
        ];
    

      // Parse commands from the moderator to see which assistants to call
      await parseModeratorCommandsAndTrigger(moderatorResponse, fullConversation);
    } catch (error) {
      console.error('Error during LLM calls:', error);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'There was an error processing your request.',
          timestamp: Date.now(),
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const parseModeratorCommandsAndTrigger = async (
    text: string,
    conversation: any[]
  ) => {
    const lines = text.split('\n').map(l => l.trim());
    const toAllow: string[] = [];
    let doYield = false;

    lines.forEach(line => {
      if (line.startsWith('!allowspeak')) {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          const assistant = parts[1].toLowerCase();
          toAllow.push(assistant);
        }
      } else if (line.startsWith('!deny')) {
        // We can do something if we want
      } else if (line.startsWith('!yield')) {
        doYield = true;
      }
      // !user ... might appear but ideally only after the team discussion
      // !team ... might just be the moderator instructing the team, but we don't do anything special for that in the code for now
    });

    // If doYield = true, we can reset conversation round or do nothing
    if (doYield) {
      // Example: reset or something
      dispatch({ type: 'RESET_ROUND' });
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'Moderator has yielded control to the user.',
          timestamp: Date.now(),
        },
      });
      return;
    }

    // Now for each allowed assistant, call them
    // Filter out duplicates or already-responded
    const finalToAllow = toAllow;

    for (const assistant of finalToAllow) {
        try {
          // Call the assistant and get their response
          const assistantResponse = await callLLM(assistant, conversation);
      
          // Construct the new message object for the assistant's response
          const assistantMessage = {
            id: uuidv4(),
            role: `assistant-${assistant}` as (
              | 'user'
              | 'moderator'
              | 'assistant-planner'
              | 'assistant-researcher'
              | 'assistant-software-engineer'
              | 'assistant-mike'
              | 'assistant-academician'
              | 'context'),
            content: assistantResponse,
            timestamp: Date.now(),
          };
      
          // Add the assistant's response to the state
          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
      
          // Update the conversation with the assistant's response
          conversation = [...conversation, assistantMessage];
      
          // Mark the assistant as responded
          dispatch({ type: 'ADD_RESPONDED_ASSISTANT', payload: assistant });
      
          // If the assistant's text might contain a !user or !yield, parse it (future work)
        } catch (err) {
          console.error(`Error calling assistant ${assistant}:`, err);
      
          // Handle errors by notifying the moderator in the conversation
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id: uuidv4(),
              role: 'moderator',
              content: `Error retrieving response from ${assistant}.`,
              timestamp: Date.now(),
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
        // In the new plan, these are moderator commands, but the user typed them manually?
        // We can either treat them as if the moderator did it, or just show an error.
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: uuidv4(),
            role: 'moderator',
            content: `(User typed) ${commandText}`,
            timestamp: Date.now(),
          },
        });
        break;
      default:
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: uuidv4(),
            role: 'moderator',
            content: `Unknown command: ${command}`,
            timestamp: Date.now(),
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
        style={{ marginLeft: '8px' }}
        disabled={state.loading}
      >
        Send
      </Button>
    </Box>
  );
};

export default MessageInput;

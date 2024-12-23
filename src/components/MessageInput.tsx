// src/components/MessageInput.tsx
import React, { useState, useContext } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { StateContext, DispatchContext } from '../context/StateContext';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

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
      handleUserMessage(input.trim());
    }

    setInput('');
  };

  const handleCommand = (commandText: string) => {
    const [command, ...args] = commandText.split(' ');

    switch (command.toLowerCase()) {
      case '!whisper':
        handleWhisper(args);
        break;
      case '!raisehand':
        handleRaiseHand();
        break;
      case '!allowspeak':
        handleAllowSpeak(args);
        break;
      case '!deny':
        handleDeny(args);
        break;
      case '!yield':
        handleYield();
        break;
      case '!note':
        handleNote(args);
        break;
      case '!permanentnote':
        handlePermanentNote(args);
        break;
      case '!user':
        handleUserCommand(args);
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
    }
  };

  const handleWhisper = (args: string[]) => {
    const receiver = args[0];
    const message = args.slice(1).join(' ');

    if (!receiver || !message) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'Usage: !whisper {assistant} {message}',
          timestamp: Date.now(),
        },
      });
      return;
    }

    // Implement the whisper logic, e.g., sending a private message to an assistant
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'moderator',
        content: `Whisper to ${receiver}: ${message}`,
        timestamp: Date.now(),
      },
    });
  };

  const handleRaiseHand = () => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'moderator',
        content: 'A user has raised their hand to speak.',
        timestamp: Date.now(),
      },
    });
  };

  const handleAllowSpeak = (args: string[]) => {
    const assistant = args[0];
    if (!assistant) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'Usage: !allowspeak {assistant}',
          timestamp: Date.now(),
        },
      });
      return;
    }

    dispatch({
      type: 'SET_ALLOWED_ASSISTANTS',
      payload: [...state.allowedAssistants, assistant],
    });

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'moderator',
        content: `Permission granted for ${assistant} to speak.`,
        timestamp: Date.now(),
      },
    });
  };

  const handleDeny = (args: string[]) => {
    const assistant = args[0];
    if (!assistant) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'Usage: !deny {assistant}',
          timestamp: Date.now(),
        },
      });
      return;
    }

    dispatch({
      type: 'SET_ALLOWED_ASSISTANTS',
      payload: state.allowedAssistants.filter(a => a !== assistant),
    });

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'moderator',
        content: `Permission denied for ${assistant} to speak.`,
        timestamp: Date.now(),
      },
    });
  };

  const handleYield = () => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'moderator',
        content: 'Moderation: Control is now yielded back to the user.',
        timestamp: Date.now(),
      },
    });
    dispatch({ type: 'RESET_ROUND' });
  };

  const handleNote = (args: string[]) => {
    const note = args.join(' ');
    if (!note) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'Usage: !note {note}',
          timestamp: Date.now(),
        },
      });
      return;
    }

    dispatch({
      type: 'ADD_CONTEXT_DOC',
      payload: note,
    });

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'moderator',
        content: 'Note added for the current session.',
        timestamp: Date.now(),
      },
    });
  };

  const handlePermanentNote = (args: string[]) => {
    const note = args.join(' ');
    if (!note) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'Usage: !permanentnote {note}',
          timestamp: Date.now(),
        },
      });
      return;
    }

    // Implement logic to store permanent notes
    // For demonstration, we'll treat it similarly to session notes
    dispatch({
      type: 'ADD_CONTEXT_DOC',
      payload: note, // Adjust based on how you handle permanent notes
    });

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'moderator',
        content: 'Permanent note added.',
        timestamp: Date.now(),
      },
    });
  };

  const handleUserCommand = (args: string[]) => {
    const message = args.join(' ');
    if (!message) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'Usage: !user {message}',
          timestamp: Date.now(),
        },
      });
      return;
    }

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      },
    });
  };

  const handleUserMessage = async (message: string) => {
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });

    // Prepare the full conversation including context documents
    const fullConversation = [
      ...state.messages,
      userMessage,
      ...state.contextDocs.map((doc, index) => ({
        id: uuidv4(),
        role: 'context',
        content: `Context Document ${index + 1}: ${doc}`,
        timestamp: Date.now(),
      })),
    ];

    try {
      // Call Moderator
      const moderatorResponse = await axios.post('/api/llm', {
        messages: fullConversation,
      });

      let responseText = moderatorResponse.data.text.trim();

      // Post-processing: Remove any code fences
      responseText = stripCodeFences(responseText);

      if (responseText === "!OK") {
        // Initial response; session started
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: uuidv4(),
            role: 'moderator',
            content: 'Session started. Please enter your prompt.',
            timestamp: Date.now(),
          },
        });
        return;
      }

      // Parse and execute commands from Moderator
      executeModeratorCommands(responseText);
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

  // Function to strip code fences from the response
  const stripCodeFences = (text: string): string => {
    // Remove ```json and ``` or any other code fences
    return text
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();
  };

  // Function to parse and execute Moderator commands

    const executeModeratorCommands = (commandsText: string) => {
        const lines = commandsText.split('\n').map(line => line.trim());
    
        lines.forEach(commandLine => {
        if (!commandLine.startsWith('!')) return;
    
        const [command, ...args] = commandLine.split(' ');
    
        switch (command.toLowerCase()) {
            case '!ok':
            // Already handled separately; no action needed
            break;
            case '!team':
            handleTeamCommand(args);
            break;
            case '!whisper':
            handleWhisper(args);
            break;
            case '!allowspeak':
            handleAllowSpeak(args);
            break;
            case '!deny':
            handleDeny(args);
            break;
            case '!yield':
            handleYield();
            break;
            case '!note':
            handleNote(args);
            break;
            case '!permanentnote':
            handlePermanentNote(args);
            break;
            case '!user':
            handleUserCommand(args);
            break;
            default:
            dispatch({
                type: 'ADD_MESSAGE',
                payload: {
                id: uuidv4(),
                role: 'moderator',
                content: `Unknown command received from Moderator: ${command}`,
                timestamp: Date.now(),
                },
            });
        }
        });
    };
    
  const handleTeamCommand = (args: string[]) => {
    const message = args.join(' ').replace(/^\{|\}$/g, ''); // Remove surrounding braces
    if (!message) {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: uuidv4(),
          role: 'moderator',
          content: 'Usage: !team {message}',
          timestamp: Date.now(),
        },
      });
      return;
    }

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: uuidv4(),
        role: 'moderator',
        content: `Team Message: ${message}`,
        timestamp: Date.now(),
      },
    });

    // Here, you can implement logic to distribute the team message to all assistants
    // For demonstration, we'll assume it's a broadcast message
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
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSend}
        style={{ marginLeft: '8px' }}
      >
        Send
      </Button>
    </Box>
  );
};

export default MessageInput;

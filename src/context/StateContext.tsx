// src/context/StateContext.tsx
import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { role } from '../utils/types';

export interface Message {
  id: string;
  role: role,
  content: string;
  timestamp: number;
}

interface Chat {
  id: string;
  messages: Message[];
  contextDocs: string[];
  conversationRound: number;
  respondedAssistants: string[];
  allowedAssistants: string[];
}

interface State {
  chats: Record<string, Chat>;
  activeChatId: string;
  assistants: string[]; // ["planner","researcher","software-engineer","mike","academician"]
  allowedAssistants: string[]; // Not strictly required, but let's keep
  loading: boolean;
}

const initialState: State = {
  chats: {},
  activeChatId: '',
  assistants: ['planner', 'researcher', 'software-engineer', 'mike', 'academician', 'industrial-engineer'],
  allowedAssistants: [],
  loading: false,
};

type Action =
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ALLOWED_ASSISTANTS'; payload: { chatId: string; assistants: string[] } }
  | { type: 'ADD_CONTEXT_DOC'; payload: { chatId: string; doc: string } }
  | { type: 'CLEAR_MESSAGES'; payload: string }
  | { type: 'INCREMENT_ROUND'; payload: string }
  | { type: 'RESET_ROUND'; payload: string }
  | { type: 'SET_RESPONDED_ASSISTANTS'; payload: { chatId: string; assistants: string[] } }
  | { type: 'ADD_RESPONDED_ASSISTANT'; payload: { chatId: string; assistant: string } }
  | { type: 'CREATE_CHAT'; payload: string }
  | { type: 'SWITCH_CHAT'; payload: string }
  | { type: 'SET_CHATS_FROM_STORAGE'; payload: Record<string, Chat> }
  | { type: 'UPDATE_MESSAGE'; payload: { chatId: string; id: string; newContent: string } }
  | { type: 'DELETE_MESSAGE_AND_SUBSEQUENT'; payload: { chatId: string; messageId: string } }
  | { type: 'DELETE_CHAT'; payload: { chatId: string } };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CHATS_FROM_STORAGE':
      return {
        ...state,
        chats: action.payload,
        activeChatId: Object.keys(action.payload)[0] || '',
      };
    case 'CREATE_CHAT':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload]: {
            id: action.payload,
            messages: [],
            contextDocs: [],
            conversationRound: 0,
            respondedAssistants: [],
            allowedAssistants: []
          },
        },
        activeChatId: action.payload,
      };
    case 'SWITCH_CHAT':
      return {
        ...state,
        activeChatId: action.payload,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload.chatId]: {
            ...state.chats[action.payload.chatId],
            messages: [...(state.chats[action.payload.chatId]?.messages || []), action.payload.message],
          },
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ALLOWED_ASSISTANTS':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload.chatId]: {
            ...state.chats[action.payload.chatId],
            allowedAssistants: action.payload.assistants,
          },
        },
      };
    case 'ADD_CONTEXT_DOC':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload.chatId]: {
            ...state.chats[action.payload.chatId],
            contextDocs: [...state.chats[action.payload.chatId].contextDocs, action.payload.doc],
          },
        },
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload]: {
            ...state.chats[action.payload],
            messages: [],
            contextDocs: [],
            conversationRound: 0,
            respondedAssistants: [],
          },
        },
      };
    case 'INCREMENT_ROUND':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload]: {
            ...state.chats[action.payload],
            conversationRound: state.chats[action.payload].conversationRound + 1,
          },
        },
      };
    case 'RESET_ROUND':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload]: {
            ...state.chats[action.payload],
            conversationRound: 0,
            allowedAssistants: [],
            respondedAssistants: [],
          },
        },
      };
    case 'SET_RESPONDED_ASSISTANTS':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload.chatId]: {
            ...state.chats[action.payload.chatId],
            respondedAssistants: action.payload.assistants,
          },
        },
      };
    case 'ADD_RESPONDED_ASSISTANT':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload.chatId]: {
            ...state.chats[action.payload.chatId],
            respondedAssistants: [
              ...state.chats[action.payload.chatId].respondedAssistants,
              action.payload.assistant,
            ],
          },
        },
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload.chatId]: {
            ...state.chats[action.payload.chatId],
            messages: state.chats[action.payload.chatId].messages.map((msg) =>
              msg.id === action.payload.id ? { ...msg, content: action.payload.newContent } : msg
            ),
          },
        },
      };
    
      case 'DELETE_MESSAGE_AND_SUBSEQUENT': {
        const { chatId, messageId } = action.payload;
        const chat = state.chats[chatId];
        if (!chat) return state;
  
        const indexOfMessage = chat.messages.findIndex((msg) => msg.id === messageId);
        if (indexOfMessage === -1) return state;
  
        const updatedMessages = chat.messages.slice(0, indexOfMessage);
  
        return {
          ...state,
          chats: {
            ...state.chats,
            [chatId]: {
              ...chat,
              messages: updatedMessages,
            },
          },
        };
      }
  
      case 'DELETE_CHAT': {
        const { chatId } = action.payload;
        const newChats = { ...state.chats };
        delete newChats[chatId];
  
        let newActiveChatId = state.activeChatId;
        if (chatId === state.activeChatId) {
          const remainingIds = Object.keys(newChats);
          newActiveChatId = remainingIds.length > 0 ? remainingIds[0] : '';
        }
  
        return {
          ...state,
          chats: newChats,
          activeChatId: newActiveChatId,
        };
      }

    default:
      return state;
  }
}

export const StateContext = createContext<State>(initialState);
export const DispatchContext = createContext<Dispatch<Action>>(() => {});

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('chatSessions');
    if (savedChats) {
      const parsedChats: Record<string, Chat> = JSON.parse(savedChats);
      dispatch({ type: 'SET_CHATS_FROM_STORAGE', payload: parsedChats });
    } else {
      // Initialize with a default chat
      const defaultChatId = uuidv4();
      dispatch({ type: 'CREATE_CHAT', payload: defaultChatId });
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(state.chats));
  }, [state.chats]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
};

// src/context/StateContext.tsx
// (unchanged except no references to raisehand or whisper)
import React, { createContext, useReducer, ReactNode, Dispatch } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role:
    | 'user'
    | 'moderator'
    | 'assistant-planner'
    | 'assistant-researcher'
    | 'assistant-software-engineer'
    | 'assistant-mike'
    | 'assistant-academician'
    | 'context';
  content: string;
  timestamp: number;
}

interface State {
  messages: Message[];
  assistants: string[]; // ["planner","researcher","software-engineer","mike","academician"]
  allowedAssistants: string[]; // Not strictly required, but let's keep
  contextDocs: string[]; 
  loading: boolean;
  conversationRound: number;
  respondedAssistants: string[];
}

const initialState: State = {
  messages: [],
  assistants: ['planner','researcher','software-engineer','mike','academician'],
  allowedAssistants: [],
  contextDocs: [],
  loading: false,
  conversationRound: 0,
  respondedAssistants: [],
};

type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ALLOWED_ASSISTANTS'; payload: string[] }
  | { type: 'ADD_CONTEXT_DOC'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'INCREMENT_ROUND' }
  | { type: 'RESET_ROUND' }
  | { type: 'SET_RESPONDED_ASSISTANTS'; payload: string[] }
  | { type: 'ADD_RESPONDED_ASSISTANT'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ALLOWED_ASSISTANTS':
      return { ...state, allowedAssistants: action.payload };
    case 'ADD_CONTEXT_DOC':
      return { ...state, contextDocs: [...state.contextDocs, action.payload] };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'INCREMENT_ROUND':
      return { ...state, conversationRound: state.conversationRound + 1 };
    case 'RESET_ROUND':
      return { 
        ...state, 
        conversationRound: 0, 
        allowedAssistants: [],
        respondedAssistants: []
      };
    case 'SET_RESPONDED_ASSISTANTS':
      return { ...state, respondedAssistants: action.payload };
    case 'ADD_RESPONDED_ASSISTANT':
      return { 
        ...state, 
        respondedAssistants: [...state.respondedAssistants, action.payload]
      };
    default:
      return state;
  }
}

export const StateContext = createContext<State>(initialState);
export const DispatchContext = createContext<Dispatch<Action>>(() => {});

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

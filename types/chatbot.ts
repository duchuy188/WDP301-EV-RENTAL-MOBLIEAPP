export interface MessagePayload {
  session_id?: string;
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatbotAPIResponse {
  success?: boolean;
  data?: {
    success?: boolean;
    session_id?: string;
    message?: string;
    response?: string;
    conversation_id?: string;
    context?: string;
    suggestions?: string[];
    actions?: string[];
    messages?: ChatMessage[];
    conversations?: any[];
  };
  message?: string;
  suggestions?: string[];
  actions?: string[];
}

export interface ChatHistoryResponse {
  success?: boolean;
  data?: {
    success?: boolean;
    data?: {
      session_id?: string;
      messages?: ChatMessage[];
      total_messages?: number;
      last_activity?: string;
      user_role?: string;
    };
    session_id?: string;
    messages?: ChatMessage[];
  };
  message?: string;
}


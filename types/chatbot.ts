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
  success: boolean;
  data?: {
    session_id: string;
    response?: string;
    messages?: ChatMessage[];
    conversations?: any[];
  };
  message?: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  data?: {
    session_id: string;
    messages: ChatMessage[];
  };
  message?: string;
}


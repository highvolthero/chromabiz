import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import axios from 'axios';
import { Send, Loader2, Trash2, MessageCircle, Clock, AlertCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
      data-testid={`chat-message-${message.role}`}
    >
      <div 
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-foreground text-background rounded-br-md' 
            : 'bg-secondary text-foreground rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs mt-1 opacity-60">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export const ChatPanel = ({ className = '' }) => {
  const { 
    chatHistory, 
    addChatMessage, 
    clearChatHistory,
    isChatting,
    setIsChatting,
    rateLimits,
    setRateLimits,
    palettes,
    businessInfo,
    sessionId
  } = useAppContext();

  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!inputValue.trim() || isChatting) return;
    
    if (rateLimits.revisions_remaining <= 0) {
      toast.error('Daily revision limit reached. Please try again tomorrow.');
      return;
    }

    if (palettes.length === 0) {
      toast.error('Please generate palettes first before chatting.');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    addChatMessage('user', userMessage);
    setIsChatting(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: userMessage,
        context: {
          palettes: palettes.map(p => ({
            name: p.name,
            colors: p.colors.map(c => ({ hex: c.hex, name: c.name, usage: c.usage }))
          })),
          business_info: businessInfo
        },
        session_id: sessionId
      });

      addChatMessage('assistant', response.data.response);
      setRateLimits(prev => ({
        ...prev,
        revisions_remaining: response.data.remaining_revisions
      }));
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Daily revision limit reached.');
        addChatMessage('assistant', 'Daily revision limit reached. Please try again tomorrow.');
      } else {
        toast.error('Failed to get response. Please try again.');
        addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      }
    } finally {
      setIsChatting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasNoPalettes = palettes.length === 0;
  const limitExceeded = rateLimits.revisions_remaining <= 0;

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid="chat-panel">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="font-heading font-bold text-xl flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI Design Assistant
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {limitExceeded ? (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Limit reached
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {rateLimits.revisions_remaining}/3 revisions left
              </span>
            )}
          </div>
        </div>
        {chatHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChatHistory}
            className="text-muted-foreground hover:text-destructive"
            data-testid="clear-chat-button"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4" ref={scrollRef}>
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            {hasNoPalettes ? (
              <>
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm">
                  Generate palettes first to start chatting with the AI assistant.
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="font-medium mb-2">How can I help?</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Ask me to refine colors, explain psychology, or suggest alternatives.
                </p>
                <div className="space-y-2 w-full">
                  {[
                    'Make the primary color more vibrant',
                    'Suggest a warmer accent color',
                    'Explain the psychology behind palette 1'
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInputValue(suggestion)}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                      data-testid={`chat-suggestion-${i}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 px-1">
            {chatHistory.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {isChatting && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasNoPalettes 
                ? 'Generate palettes first...' 
                : limitExceeded 
                  ? 'Daily limit reached' 
                  : 'Ask about colors, psychology...'
            }
            disabled={hasNoPalettes || isChatting || limitExceeded}
            className="flex-1"
            data-testid="chat-input"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || hasNoPalettes || isChatting || limitExceeded}
            size="icon"
            data-testid="chat-send-button"
          >
            {isChatting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Send, MessageCircle, Sparkles, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  videoFileName?: string;
}

export const Chatbot = ({ videoFileName }: ChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I've analyzed your video${videoFileName ? ` "${videoFileName}"` : ''} and I'm ready to answer any questions. You can ask me about specific scenes, objects, people, timestamps, or anything else you noticed in the video.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the backend chat endpoint
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          video_filename: videoFileName
        }),
      });
      
      const result = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.status === 'success' ? result.response : 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling chat API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting to the chat service. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the main topics discussed in this video?",
    "Can you summarize what happens around the 2-minute mark?",
    "What specific details are mentioned about the subject?",
    "Are there any important timestamps I should know about?"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/50 p-4 gradient-surface">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-primary mr-3">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">AI Video Assistant</h3>
              <p className="text-sm text-muted-foreground">Ask me anything about your video</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-80 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`
                  flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg
                  ${message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-primary'
                  }
                `}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                
                <div className={`
                  flex-1 space-y-2 overflow-hidden rounded-lg p-3 text-sm
                  ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-muted mr-12'
                  }
                `}>
                  <p className="leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="bg-primary flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3 mr-12">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 animate-pulse bg-foreground/60 rounded-full"></div>
                    <div className="h-2 w-2 animate-pulse bg-foreground/60 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 animate-pulse bg-foreground/60 rounded-full" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested questions */}
        {messages.length === 1 && (
          <div className="border-t border-border/50 p-4 gradient-surface">
            <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => setInput(question)}
                  className="text-left text-sm p-2 rounded-lg bg-background/50 hover:bg-background transition-smooth border border-border/30"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border/50 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your video..."
              disabled={isLoading}
              className="flex-1"
            />
            
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              variant="premium"
              className="transition-smooth"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
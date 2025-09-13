import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage } from '@shared/schema';

export default function Chat() {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat messages
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/chat/messages', {
        role: 'user',
        content,
        metadata: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setInputMessage('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;
    
    sendMessageMutation.mutate(trimmedMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Asistente IA</h1>
          <p className="text-sm text-muted-foreground">Pregúntame sobre tus grabaciones</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">¡Hola! Soy tu asistente IA</p>
              <p className="text-sm text-muted-foreground">
                Puedo ayudarte con información sobre tus grabaciones, tareas y más.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.id}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-1">
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <p 
                        className={`text-xs mt-2 ${
                          message.role === 'user' 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 mt-auto">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe tu pregunta..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            size="icon"
            data-testid="button-send-message"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {sendMessageMutation.isPending && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center">
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
            Generando respuesta...
          </p>
        )}
      </div>
    </div>
  );
}
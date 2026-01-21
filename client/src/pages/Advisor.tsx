import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { 
  Bot, 
  Send, 
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Shield,
  HelpCircle
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What is bankroll management and why is it important?",
  "How do I identify value bets?",
  "What's the difference between moneyline and spread betting?",
  "How do parlays work and what are the risks?",
  "What is expected value (EV) in sports betting?",
  "How can I develop a sustainable betting strategy?",
];

export default function Advisor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getAdviceMutation = trpc.advisor.getAdvice.useMutation({
    onSuccess: (data) => {
      const advice = typeof data.advice === 'string' ? data.advice : 'Unable to generate advice';
      setMessages(prev => [...prev, { role: "assistant", content: advice }]);
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error("Failed to get advice: " + error.message);
      setIsLoading(false);
    },
  });

  const handleSend = (question?: string) => {
    const text = question || input.trim();
    if (!text) return;

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true);
    getAdviceMutation.mutate({ question: text });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">
              <strong>Educational Purposes Only:</strong> The AI advisor provides general information about sports betting concepts. 
              This is not financial advice. Always gamble responsibly and never bet more than you can afford to lose.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI Betting Advisor
                </CardTitle>
                <CardDescription>
                  Ask questions about betting strategies, bankroll management, and more
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Welcome to the AI Advisor</h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        I can help you understand betting concepts, strategies, and responsible gambling practices. 
                        Ask me anything or try one of the suggested questions.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSend(q)}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <Streamdown>{msg.content}</Streamdown>
                            ) : (
                              <p>{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-secondary rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <div className="animate-pulse flex gap-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                              <span className="text-sm text-muted-foreground">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about betting strategies, bankroll management..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                  <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Suggested Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleSend(q)}
                    disabled={isLoading}
                  >
                    <HelpCircle className="h-4 w-4 mr-2 shrink-0" />
                    <span className="text-sm">{q}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <p>Never chase losses - stick to your bankroll plan</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <p>Look for value, not just winners</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <p>Keep detailed records of all your bets</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <p>Specialize in sports you know well</p>
                </div>
              </CardContent>
            </Card>

            {/* Responsible Gambling */}
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-500" />
                  Responsible Gambling
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>Remember:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Set a budget and stick to it</li>
                  <li>Never bet money you can't afford to lose</li>
                  <li>Take breaks regularly</li>
                  <li>Don't bet under the influence</li>
                  <li>Seek help if gambling becomes a problem</li>
                </ul>
                <Button variant="link" className="p-0 h-auto text-yellow-500" asChild>
                  <a href="/responsible-gambling">Learn more about responsible gambling</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

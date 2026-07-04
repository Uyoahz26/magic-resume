import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { useAIConfiguration } from "@/hooks/useAIConfiguration";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatDialogProps {
  resumeText?: string;
  className?: string;
}

const SYSTEM_PROMPT = `你是一个专业的简历助手。用户会给你发送简历内容，请根据简历内容回答用户的问题。

你可以帮助用户：
1. 分析简历内容的优点和不足
2. 给出简历撰写建议
3. 回答关于简历制作的问题
4. 帮助优化简历中的表述
5. 解释简历中可能存在的语法或用词问题

请用专业、友好的语气回答。如果用户的问题与简历无关，可以提醒用户先粘贴简历内容。`;

export function AIChatDialog({ resumeText, className }: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { checkConfiguration } = useAIConfiguration();
  const {
    selectedModel,
    deepseekApiKey,
    doubaoApiKey,
    doubaoModelId,
    openaiApiKey,
    openaiModelId,
    openaiApiEndpoint,
    geminiApiKey,
    geminiModelId,
  } = useAIConfigStore();

  useEffect(() => {
    if (messages.length === 0) {
      // 欢迎消息
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: resumeText
            ? "你好！我是你的 AI 简历助手。我已经看到你的简历内容了，有什么可以帮你的吗？"
            : "你好！我是你的 AI 简历助手。请先粘贴你的简历内容，然后告诉我你想问什么。",
          timestamp: new Date(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!checkConfiguration()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiKey = selectedModel === "deepseek" ? deepseekApiKey
        : selectedModel === "doubao" ? doubaoApiKey
        : selectedModel === "openai" ? openaiApiKey
        : geminiApiKey;

      const modelId = selectedModel === "deepseek" ? "deepseek-v4-flash"
        : selectedModel === "doubao" ? doubaoModelId || "doubao-pro-32k"
        : selectedModel === "openai" ? openaiModelId || "gpt-4o-mini"
        : geminiModelId || "gemini-flash-latest";

      // 构建上下文 - 优先使用 prop 传入的 resumeText,否则从 DOM 中提取
      const extractedText = resumeText
        || (typeof document !== "undefined"
          ? (document.getElementById("resume-preview")?.innerText?.trim() || undefined)
          : undefined);
      const contextContent = extractedText
        ? `用户的简历内容：\n${extractedText}\n\n用户的问题：${userMessage.content}`
        : userMessage.content;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: contextContent },
          ],
          model: selectedModel,
          apiKey,
          modelId,
          apiEndpoint: selectedModel === "openai" ? openaiApiEndpoint : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || "请求失败");
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || "抱歉，我没有收到有效的回复。";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发送失败，请重试");
      // 移除用户消息
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="space-y-3 p-2">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-2",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                </div>
                <div
                  className={cn(
                    "flex-1 min-w-0 max-w-[85%] rounded-xl px-3 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-xs whitespace-pre-wrap leading-relaxed break-words">
                    {message.content}
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-1",
                      message.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <span className="text-[10px] opacity-50">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleCopy(message.id, message.content)}
                      >
                        {copiedId === message.id ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    思考中…
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-1.5"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题…"
            disabled={isLoading}
            className="flex-1 h-8 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
            title="重新开始"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          AI 助手基于简历内容回答问题
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Folder, Trash2, Key, Sparkles, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFileHandle,
  getConfig,
  storeFileHandle,
  storeConfig,
  verifyPermission,
} from "@/utils/fileSystem";
import { useResumeStore } from "@/store/useResumeStore";
import { syncResumesFromDirectory } from "@/utils/resumeFileSync";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { toast } from "sonner";

const AI_PROVIDERS = [
  { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat"] },
  { id: "doubao", name: "豆包 (Doubao)", models: ["doubao-pro-32k", "doubao-lite-32k"] },
  { id: "openai", name: "OpenAI", models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"] },
  { id: "gemini", name: "Google Gemini", models: ["gemini-flash-latest", "gemini-pro"] },
] as const;

type AIProvider = "deepseek" | "doubao" | "openai" | "gemini";

const SettingsPage = () => {
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderPath, setFolderPath] = useState<string>("");
  const [testing, setTesting] = useState(false);

  const {
    selectedModel,
    setSelectedModel,
    doubaoApiKey, setDoubaoApiKey,
    doubaoModelId, setDoubaoModelId,
    deepseekApiKey, setDeepseekApiKey,
    deepseekModelId, setDeepseekModelId,
    openaiApiKey, setOpenaiApiKey,
    openaiModelId, setOpenaiModelId,
    openaiApiEndpoint, setOpenaiApiEndpoint,
    geminiApiKey, setGeminiApiKey,
    geminiModelId, setGeminiModelId,
  } = useAIConfigStore();

  const updateResumeFromFile = useResumeStore(
    (state) => state.updateResumeFromFile
  );

  useEffect(() => {
    const loadSavedConfig = async () => {
      try {
        const handle = await getFileHandle("syncDirectory");
        const path = await getConfig("syncDirectoryPath");

        if (handle && path) {
          const hasPermission = await verifyPermission(handle);
          if (hasPermission) {
            setDirectoryHandle(handle as FileSystemDirectoryHandle);
            setFolderPath(path);
          }
        }
      } catch (error) {
        console.error("Error loading saved config:", error);
      }
    };

    loadSavedConfig();
  }, []);

  const handleSelectDirectory = async () => {
    try {
      if (!("showDirectoryPicker" in window)) {
        alert(
          "您的浏览器不支持选择文件夹。请使用现代浏览器。"
        );
        return;
      }

      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      const hasPermission = await verifyPermission(handle);
      if (hasPermission) {
        setDirectoryHandle(handle);
        const path = handle.name;
        setFolderPath(path);
        await storeFileHandle("syncDirectory", handle);
        await storeConfig("syncDirectoryPath", path);
        await syncResumesFromDirectory(updateResumeFromFile);
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
    }
  };

  const handleRemoveDirectory = async () => {
    try {
      setDirectoryHandle(null);
      setFolderPath("");
      await storeFileHandle("syncDirectory", null as any);
      await storeConfig("syncDirectoryPath", "");
    } catch (error) {
      console.error("Error removing directory:", error);
    }
  };

  const handleTestAI = async () => {
    setTesting(true);
    try {
      const apiKey = selectedModel === "deepseek" ? deepseekApiKey
        : selectedModel === "doubao" ? doubaoApiKey
        : selectedModel === "openai" ? openaiApiKey
        : geminiApiKey;

      if (!apiKey) {
        toast.error("请先填写 API Key");
        return;
      }

      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          apiKey,
          modelId: selectedModel === "deepseek" ? deepseekModelId
            : selectedModel === "doubao" ? doubaoModelId
            : selectedModel === "openai" ? openaiModelId
            : geminiModelId,
          endpoint: selectedModel === "openai" ? openaiApiEndpoint : undefined,
        }),
      });

      if (response.ok) {
        toast.success("AI 连接成功！");
      } else {
        toast.error("AI 连接失败，请检查配置");
      }
    } catch {
      toast.error("AI 连接失败");
    } finally {
      setTesting(false);
    }
  };

  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedModel) || AI_PROVIDERS[0];
  const currentApiKey = selectedModel === "deepseek" ? deepseekApiKey
    : selectedModel === "doubao" ? doubaoApiKey
    : selectedModel === "openai" ? openaiApiKey
    : geminiApiKey;
  const currentModelId = selectedModel === "deepseek" ? deepseekModelId
    : selectedModel === "doubao" ? doubaoModelId
    : selectedModel === "openai" ? openaiModelId
    : geminiModelId;

  const setCurrentApiKey = (val: string) => {
    if (selectedModel === "deepseek") setDeepseekApiKey(val);
    else if (selectedModel === "doubao") setDoubaoApiKey(val);
    else if (selectedModel === "openai") setOpenaiApiKey(val);
    else setGeminiApiKey(val);
  };

  const setCurrentModelId = (val: string) => {
    if (selectedModel === "deepseek") setDeepseekModelId(val);
    else if (selectedModel === "doubao") setDoubaoModelId(val);
    else if (selectedModel === "openai") setOpenaiModelId(val);
    else setGeminiModelId(val);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto py-8 px-6 lg:px-8">
      <div className="flex flex-col space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            设置
          </h2>
        </div>

        {/* AI 配置 */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900/50">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800/50 pb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 shrink-0">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  AI 配置
                </CardTitle>
                <CardDescription className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                  配置 AI 模型以启用语法检查和内容润色功能
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 px-6 pb-8 md:px-8 space-y-6">
            {/* 模型选择 */}
            <div className="space-y-2">
              <Label htmlFor="model">AI 提供商</Label>
              <Select
                value={selectedModel}
                onValueChange={(val) => setSelectedModel(val as AIProvider)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={`输入 ${currentProvider.name} API Key`}
                  value={currentApiKey}
                  onChange={(e) => setCurrentApiKey(e.target.value)}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            {/* 模型 ID（部分需要） */}
            {selectedModel !== "deepseek" && (
              <div className="space-y-2">
                <Label htmlFor="modelId">模型 ID</Label>
                <Select
                  value={currentModelId}
                  onValueChange={setCurrentModelId}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProvider.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* OpenAI 专用：自定义端点 */}
            {selectedModel === "openai" && (
              <div className="space-y-2">
                <Label htmlFor="endpoint">API 端点（可选）</Label>
                <Input
                  id="endpoint"
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={openaiApiEndpoint}
                  onChange={(e) => setOpenaiApiEndpoint(e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            {/* 测试按钮 */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                onClick={handleTestAI}
                disabled={testing || !currentApiKey}
                className="h-11"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    测试中…
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    测试连接
                  </>
                )}
              </Button>
              {currentApiKey && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  已配置
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 文件夹同步 */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900/50">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800/50 pb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 shrink-0">
                <Folder className="h-6 w-6 text-[#D97757] dark:text-[#D97757]/90" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  文件夹同步
                </CardTitle>
                <CardDescription className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                  选择一个本地文件夹，自动同步简历文件
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 px-6 pb-8 md:px-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1 relative group">
                {directoryHandle ? (
                  <div className="h-12 px-4 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors group-hover:border-[#D97757]/30 group-hover:bg-orange-50/30 dark:group-hover:bg-orange-900/10">
                    <Folder className="h-5 w-5 text-[#D97757]" />
                    <span className="truncate font-medium text-gray-700 dark:text-gray-300 font-mono text-sm">
                      {folderPath}
                    </span>
                  </div>
                ) : (
                  <div className="h-12 px-4 flex items-center justify-center sm:justify-start text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    未配置文件夹
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={handleSelectDirectory}
                  variant="default"
                  className="flex-1 sm:flex-none h-12 px-6 text-white shadow-sm hover:shadow transition-all duration-200 rounded-xl font-medium cursor-pointer"
                >
                  选择文件夹
                </Button>
                {directoryHandle && (
                  <Button
                    onClick={handleRemoveDirectory}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900/50 transition-colors"
                    title="移除同步文件夹"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const runtime = "edge";

export default SettingsPage;

import { useRouter } from "@/lib/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAIConfigStore } from "@/store/useAIConfigStore";

export const useAIConfiguration = () => {
  const router = useRouter();
  const { isConfigured, selectedModel } = useAIConfigStore();

  const checkConfiguration = () => {
    if (!isConfigured()) {
      toast.error(
        <>
          <span>{"请先配置 ApiKey 和 模型Id"}</span>
          <Button
            variant="link"
            className="p-0 h-auto ml-1 font-bold underline decoration-[#D97757]/30 underline-offset-4 text-[#D97757]"
            onClick={() => router.push("/app/dashboard/settings")}
          >
            {"去配置"}
          </Button>
        </>
      );
      return false;
    }

    return true;
  };

  return {
    checkConfiguration,
  };
};

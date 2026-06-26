import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { Reorder } from "framer-motion";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CertificateItem from "./CertificateItem";
import { Certificate } from "@/types/resume";
import { generateUUID } from "@/utils/uuid";
import { useRef, useEffect } from "react";
import { compressImage, estimateBase64Size } from "@/utils/imageUtils";
import { toast } from "sonner";

const CertificatesPanel = () => {
    const { activeResume, updateCertificatesBatch, addCertificate } = useResumeStore();
    const { certificates = [], activeSection } = activeResume || {};
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateCertificate = (url: string) => {
        const newCert: Certificate = {
            id: generateUUID(),
            url,
            width: 100,
        };
        addCertificate(newCert);
    };

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("请上传图片文件");
            return;
        }
        try {
            let imageData: string;
            if (file.size > 2 * 1024 * 1024) {
                imageData = await compressImage(file, 800, 800, 0.7);
                let compressedSize = estimateBase64Size(imageData);
                if (compressedSize > 2 * 1024 * 1024) {
                    imageData = await compressImage(file, 600, 600, 0.5);
                    compressedSize = estimateBase64Size(imageData);
                    if (compressedSize > 2 * 1024 * 1024) {
                        imageData = await compressImage(file, 400, 400, 0.4);
                    }
                }
            } else {
                imageData = await compressImage(file, 1200, 1200, 0.8);
            }
            handleCreateCertificate(imageData);
        } catch (e) {
            toast.error("Upload error");
        }
    };

    useEffect(() => {
        if (activeSection !== "certificates") return;
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        handleFile(blob);
                        e.preventDefault();
                        break;
                    }
                }
            }
        };
        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [activeSection]);

    return (
        <div className={cn("space-y-4 px-4 py-4 rounded-lg bg-card border-border")}>
            <p className="text-sm text-gray-500">{"支持点击上传或快捷键 (Cmd/Ctrl + V) 直接粘贴图片。拖动滑块可调整宽度实现横向拼接。"}</p>

            {certificates.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400 border border-dashed rounded-lg">
                    {"暂无图片，请上传或粘贴图片"}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                        Array.from(files).forEach((file) => handleFile(file));
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }}
            />

            <Reorder.Group
                axis="y"
                values={certificates}
                onReorder={updateCertificatesBatch}
                className="space-y-3"
            >
                {certificates.map((cert) => (
                    <CertificateItem key={cert.id} certificate={cert} />
                ))}

                <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                    <ImagePlus className="w-4 h-4 mr-2" />
                    {"添加照片或证书"}
                </Button>
            </Reorder.Group>
        </div>
    );
};
export default CertificatesPanel;

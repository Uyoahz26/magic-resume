import { ReactNode } from "react";
import { Metadata } from "next";
import Document from "@/components/Document";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: "Magic Resume · 云端简历编辑器",
};

export default function LocaleLayout({ children }: Props) {
  return (
    <Document
      locale="zh-CN"
      bodyClassName="overflow-y-hidden w-full"
    >
      <Providers>
        {children}
        <Toaster position="top-center" richColors />
      </Providers>
    </Document>
  );
}

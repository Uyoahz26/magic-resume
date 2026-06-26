import { ReactNode } from "react";
import { Metadata } from "next";
import Document from "@/components/Document";
import { Providers } from "@/app/providers";
import Client from "./client";

export const metadata: Metadata = {
  title: "Magic Resume · 云端简历编辑器",
};

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return (
    <Document locale="zh-CN">
      <Providers>
        <Client>{children}</Client>
      </Providers>
    </Document>
  );
}

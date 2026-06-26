import { ReactNode } from "react";
import Document from "@/components/Document";
import { Providers } from "@/app/providers";

type Props = {
  children: ReactNode;
};

export default function LocaleLayout({ children }: Props) {
  return (
    <Document locale="zh-CN" bodyClassName="overflow-y-hidden w-full">
      <Providers>{children}</Providers>
    </Document>
  );
}

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../app/globals.css?url";
import tiptapCss from "../styles/tiptap.scss?url";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Resume · 简历编辑器" },
      {
        name: "description",
        content:
          "极简的简历编辑器。一键 AI 润色、多模板导出,让好简历不再难产。",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: tiptapCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound,
});

function RootComponent() {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers>
          <Outlet />
          <Toaster position="top-center" richColors />
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-2xl font-medium tracking-tight">页面不存在</p>
        <a
          href="/"
          className="mt-4 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          返回首页
        </a>
      </div>
    </main>
  );
}

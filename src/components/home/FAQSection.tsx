import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "免费使用吗?有没有付费方案?",
    a: "注册即可免费使用全部简历编辑功能。AI 润色每月有 200 次免费额度,超出后可通过邀请好友或后续付费方案扩展。",
  },
  {
    q: "数据存在哪里?会泄露吗?",
    a: "简历内容存储在腾讯云对象存储 (COS) 中,Bucket 私有读写,所有访问走我们 Worker 网关,前端永不见密钥。账号元数据存储在 Cloudflare D1。",
  },
  {
    q: "支持哪些简历模板?",
    a: "目前内置 9 套模板:经典、双栏、左/右布局、时间线、极简、优雅、创意、Editorial、瑞士美学,后续会持续新增。",
  },
  {
    q: "可以导出 PDF / Word 吗?",
    a: "支持导出 PDF,样式与编辑器内一致。后续将支持 Markdown、Word 和图片长图导出。",
  },
  {
    q: "支持多设备同步吗?",
    a: "支持。登录账号后,简历自动同步到云端,在任意设备登录都能看到一致的简历数据。",
  },
];

export default function FAQSection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-[900px] px-6">
        <div className="max-w-xl">
          <span className="text-xs tracking-widest text-muted-foreground uppercase">
            FAQ
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-medium tracking-tight">
            常见问题
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-normal hover:no-underline py-6">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

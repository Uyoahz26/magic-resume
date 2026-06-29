import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "免费使用吗?有没有付费方案?",
    a: "注册即可免费使用全部简历编辑功能。AI 润色每月有 200 次免费额度,超出后联系管理员扩充",
  },
  {
    q: "数据存在哪里?会泄露吗?",
    a: "存在你本地，已植入木马，大胆泄露。我们会收集任何个人数据,也会上传到云端。",
  },
  {
    q: "支持哪些简历模板?",
    a: "目前内置 9 套模板:经典、双栏、左/右布局、时间线、极简、优雅、创意、Editorial、瑞士美学,后续会持续新增。",
  },
  {
    q: "可以导出 PDF / Word 吗?",
    a: "支持导出 PDF,样式与编辑器内一致。后续将支持 Markdown、Word 和图片长图导出。",
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

import { Sparkles, Layout, Cloud } from "lucide-react";
import Image from "@/lib/image";

interface Feature {
  icon: React.ComponentType<{ className?: string; size?: number }> | React.ForwardRefExoticComponent<any>;
  badge: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

const features: Feature[] = [
  {
    icon: Sparkles,
    badge: "AI",
    title: "AI 简历润色",
    description: '一键改写工作描述,识别错别字。让简历语言更专业、更精炼,告别空洞的"负责 xxx"句式。',
    image: "/features/polish.png",
    imageAlt: "AI 润色",
  },
  {
    icon: Layout,
    badge: "模板",
    title: "九套简历模板",
    description: "经典、双栏、时间线、极简、瑞士美学 …… 覆盖从工程到设计的不同场景,所见即所得。",
    image: "/features/templates.png",
    imageAlt: "简历模板",
  },
  {
    icon: Cloud,
    badge: "云端",
    title: "云端同步,随时随地",
    description: "登录账号,简历自动同步到云端。多设备无缝切换,数据安全有保障。",
    image: "/features/sync.png",
    imageAlt: "云端同步",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-[1100px] px-6">
        <div className="max-w-2xl">
          <span className="text-xs tracking-widest text-muted-foreground uppercase">
            核心能力
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-medium tracking-tight leading-tight">
            一切为了<br />一份更好的简历
          </h2>
        </div>

        <div className="mt-20 space-y-32">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={
                "grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center" +
                (i % 2 === 1 ? " md:[&>div:first-child]:order-2" : "")
              }
            >
              <div>
                <span className="inline-flex items-center gap-2 text-xs tracking-widest text-muted-foreground uppercase">
                  <f.icon size={14} />
                  {f.badge}
                </span>
                <h3 className="mt-4 text-3xl font-medium tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-md">
                  {f.description}
                </p>
              </div>
              <div className="rounded-lg overflow-hidden border border-border bg-card">
                <Image
                  src={f.image}
                  alt={f.imageAlt}
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

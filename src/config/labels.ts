export const BASIC_FIELD_LABELS: Record<string, string> = {
  name: "姓名",
  title: "职位",
  email: "邮箱",
  phone: "电话",
  website: "个人网站",
  location: "地址",
  birthDate: "生日",
  employementStatus: "状态",
};

export const SECTION_LABELS: Record<string, string> = {
  skills: "专业技能",
  experience: "工作经验",
  projects: "项目经历",
  education: "教育经历",
  selfEvaluation: "自我评价",
  certificates: "证书作品",
};

export const FAQ_ITEMS: Record<string, { question: string; answer: string }> = {
  "browser-compatibility": {
    question: "推荐使用什么浏览器？",
    answer:
      "推荐使用最新版的 Chrome (谷歌浏览器) 或 Edge 浏览器以获得最佳排版和导出体验。部分不兼容的旧版浏览器可能会导致样式错乱。",
  },
  "export-methods": {
    question: "两种导出方式有什么不同？",
    answer:
      "• PDF 导出：使用后端服务进行高精度渲染，100% 还原排版，推荐用于正式发送给 HR。\n\n• 浏览器打印：调用您当前浏览器的自带打印功能（另存为 PDF）。适合在后端导出服务繁忙或您需要通过浏览器微调打印边距时使用。",
  },
  "export-failure": {
    question: "导出失败或样式错乱怎么办？",
    answer:
      '1. 推荐使用 Google Chrome 浏览器 (https://www.google.cn/intl/zh-CN/chrome/) 以获得最佳兼容性。\n2. 如果导出依然失败，请尝试在"无痕模式"下进行操作，排除插件干扰。\n3. 或者点击导出菜单中的"PDF (备份)"选项，并在打印预览界面选择"另存为 PDF"。',
  },
  "drag-and-drop": {
    question: "如何拖拽调整模块顺序？",
    answer:
      '在左侧编辑面板的"布局"设置中，将光标悬停在模块卡片左侧的「拖拽手柄」（通常表现为六个点状图标）上，按住鼠标左键即可上下拖拽模块以重新排序整个简历的章节。',
  },
};

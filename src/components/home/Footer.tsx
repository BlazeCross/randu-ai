import Link from "next/link";

const socialLinks = [
  { label: "抖音", value: "@燃渡AI" },
  { label: "小红书", value: "@燃渡AI" },
];

const quickLinks = [
  { label: "工作流", href: "/workspace" },
  { label: "注册", href: "/register" },
  { label: "登录", href: "/login" },
  { label: "个人中心", href: "/dashboard" },
  { label: "用户协议", href: "/terms" },
  { label: "隐私政策", href: "/privacy" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[#FAF7F2]">
      <div className="mx-auto max-w-[1600px] px-6 py-12 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* 公司信息 + 平台数据 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-foreground">
              四川燃渡文化传媒有限公司
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              燃渡AI工作流服务平台，致力于让AI技术触手可及，
              为个人和企业提供高效、便捷的AI工作流解决方案。
            </p>
            {/* 平台数据 */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-white px-4 py-2 shadow-sm">
                <span className="text-2xl font-bold text-[#E67E22]">10,000+</span>
                <span className="text-sm text-muted-foreground">已服务学员</span>
              </div>
            </div>
            {/* 社交账号 */}
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <span
                  key={social.label}
                  className="inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground shadow-sm"
                >
                  {social.label}：{social.value}
                </span>
              ))}
            </div>
          </div>

          {/* 联系方式 */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">联系方式</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>邮箱：1967948530@qq.com</li>
              <li>电话：17683255002</li>
              <li>地址：四川省成都市</li>
            </ul>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">快速链接</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors duration-150 hover:text-[#E67E22]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-12 flex flex-col gap-4 border-t border-border/50 pt-8 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © 2026 四川燃渡文化传媒有限公司. 保留所有权利.
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
            <a 
              href="https://beian.mps.gov.cn/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-600"
            >
              蜀ICP备XXXXXXXX号-1
            </a>
            <span>·</span>
            <span>蜀公网安备XXXXXXXXXXXXX号</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";

export const metadata = {
  title: "隐私政策 - 燃渡AI",
  description: "燃渡AI隐私政策",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-foreground">隐私政策</h1>
        <div className="prose prose-gray max-w-none text-muted-foreground">
          <p className="text-sm text-muted-foreground mb-8">更新日期：2026年7月1日</p>

          <p className="mb-6">四川燃渡文化传媒有限公司（以下简称"本公司"）高度重视用户个人信息的保护。本隐私政策旨在向您说明我们如何收集、使用、存储、保护您的个人信息，以及您享有的相关权利。请您在使用燃渡AI服务前，仔细阅读并了解本政策。</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">一、个人信息的收集</h2>
          <p>根据《个人信息保护法》第十七条的规定，我们在收集您的个人信息前，向您告知以下事项：</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>收集目的：</strong>为您提供AI工作流服务、账户管理、安全保障</li>
            <li><strong>收集方式：</strong>您主动提供以及系统自动采集</li>
          </ul>
          
          <h3 className="text-lg font-medium text-foreground mt-6 mb-3">1. 基础信息</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>手机号码：用于账户注册和身份验证</li>
            <li>电子邮箱：用于账户关联和密码找回（可选）</li>
            <li>设备信息：包括设备型号、操作系统、浏览器类型，用于服务优化和安全防护</li>
            <li>IP地址：用于确定服务器节点、提供本地化服务</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2. 使用信息</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>对话记录：您与AI的交互内容，用于提供连续性服务和内容优化</li>
            <li>生成内容：您使用AI生成的文章、图片、视频等，用于内容审核和服务改进</li>
            <li>使用时间：您访问和使用服务的时间，用于统计分析</li>
            <li>操作日志：您的登录、修改密码等操作记录，用于安全保障</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground mt-6 mb-3">3. 第三方信息</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>微信UnionID：如您使用微信登录，我们可能获取您的UnionID用于账户关联</li>
            <li>第三方平台信息：如您通过第三方平台使用我们的服务，我们可能获取该平台提供的信息</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">二、信息使用目的</h2>
          <p>我们收集您的个人信息仅用于以下目的：</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>提供AI服务：响应您的请求，提供AI对话、内容生成、工作流等服务</li>
            <li>账户管理：创建和管理用户账户，提供账户安全验证</li>
            <li>安全审计：检测和预防安全威胁，保障平台和用户安全</li>
            <li>服务优化：分析使用数据，改进产品功能和服务质量</li>
            <li>法律法规要求：履行法定义务，配合监管部门要求</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">三、信息共享范围</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>不向第三方出售：</strong>我们承诺不会将您的个人信息出售给任何第三方</li>
            <li><strong>必要时的共享：</strong>在以下情况下，我们可能与第三方共享您的信息：
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>法律法规要求的情况下</li>
                <li>保护本公司或用户的合法权益</li>
                <li>企业合并、收购等资本运作</li>
              </ul>
            </li>
            <li><strong>服务提供商：</strong>我们可能委托可信的服务提供商（如阿里云）协助提供服务，这些服务商须遵守我们的数据保护要求</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">四、用户权利</h2>
          <p>根据《个人信息保护法》，您享有以下权利：</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>查阅权：</strong>您有权查阅我们持有的您的个人信息</li>
            <li><strong>更正权：</strong>您有权要求更正错误的个人信息</li>
            <li><strong>删除权：</strong>您有权要求删除您的个人信息，注销账户后我们将在30天内删除您的数据</li>
            <li><strong>撤回同意权：</strong>您有权撤回之前给予的同意，但我们可能无法继续为您提供部分服务</li>
            <li><strong>投诉权：</strong>您有权向个人信息保护部门投诉或举报</li>
          </ul>
          <p className="mt-4">如需行使上述权利，请通过本政策末尾的联系方式与我们联系。</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">五、信息存储</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>存储地点：</strong>您的个人信息存储在阿里云成都节点</li>
            <li><strong>存储期限：</strong>我们仅在为您提供服务所必需的期间内保留您的个人信息；账户注销后30天内删除所有数据</li>
            <li><strong>安全措施：</strong>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>数据传输采用HTTPS加密</li>
                <li>敏感信息采用加密存储</li>
                <li>实施访问控制，只有授权人员可访问个人信息</li>
                <li>定期安全审计和漏洞扫描</li>
              </ul>
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">六、未成年人保护</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>燃渡AI不接受14周岁以下未成年人注册</li>
            <li>14周岁以上未满18周岁的未成年人视为限制民事行为能力人，需监护人同意方可注册</li>
            <li>监护人有权查阅、删除未成年人的个人信息</li>
            <li>如您未满14周岁，请在监护人陪同下使用本服务</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">七、Cookie政策</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>必要Cookie：</strong>用于维持登录状态，确保您能够正常使用服务，禁用后将无法登录</li>
            <li><strong>统计Cookie：</strong>用于分析用户行为，帮助我们了解服务使用情况，禁用后不影响核心功能</li>
            <li><strong>管理偏好：</strong>您可以通过浏览器设置禁用Cookie，但这可能影响部分功能</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">八、政策更新</h2>
          <p>我们可能不时更新本隐私政策。更新后的政策将在平台上公布，如重大变更我们将通过站内信或邮件通知您。建议您定期查阅本政策以了解最新版本。</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">九、联系我们</h2>
          <p>如您对本隐私政策有任何疑问，或希望行使您的个人信息权利，请通过以下方式联系我们：</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>邮箱：1967948530@qq.com</li>
            <li>电话：17683255002</li>
            <li>地址：四川省成都市</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
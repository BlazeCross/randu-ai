import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/home/Footer";

export const metadata = {
  title: "用户协议 - 燃渡AI",
  description: "燃渡AI用户协议",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-foreground">用户协议</h1>
        <div className="prose prose-gray max-w-none text-muted-foreground">
          <p className="text-sm text-muted-foreground mb-8">更新日期：2026年7月1日</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">一、服务说明</h2>
          <p>燃渡AI是四川燃渡文化传媒有限公司（以下简称"本公司"）运营的AI工作流服务平台，为用户提供AI对话、图片生成、视频生成、工作流编排等功能服务。</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>服务内容：</strong>包括但不限于AI智能对话、多模态内容生成、工作流模板、工作流编排工具等</li>
            <li><strong>服务变更：</strong>本公司保留随时调整、修改或中断服务的权利，届时将通过平台公告或站内信通知您</li>
            <li><strong>服务终止：</strong>如您违反本协议或相关法律法规，本公司有权立即终止向您提供服务</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">二、用户注册与账号</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>注册条件：</strong>您需提供真实的手机号码进行注册，手机号与实名信息关联</li>
            <li><strong>账号安全：</strong>您应当妥善保管账号信息，对账号下所有活动负责。如发现账号被盗用，请立即联系我们</li>
            <li><strong>账号注销：</strong>您有权随时注销账号。注销后，我们将在30天内删除您的全部个人数据</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">三、用户行为规范</h2>
          <p>您在使用燃渡AI服务时，不得从事以下行为：</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>违反法律法规、公序良俗的行为</li>
            <li>侵犯他人合法权益的行为，包括但不限于知识产权、肖像权、隐私权等</li>
            <li>制作、传播淫秽、色情、赌博、暴力、恐怖等内容</li>
            <li>危害网络安全、干扰网络正常服务的行为</li>
            <li>将本服务用于商业转售、非法牟利等目的</li>
            <li>尝试破解、攻击本公司系统或未经授权访问他人账号</li>
            <li>利用AI技术生成虚假信息进行欺诈或误导</li>
          </ul>
          <p className="mt-4">如您违反上述规定，本公司有权采取警告、限制功能、封禁账号等措施，并保留追究法律责任的权利。</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">四、知识产权</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>平台内容：</strong>燃渡AI平台的所有内容、设计、代码等知识产权归本公司所有</li>
            <li><strong>用户生成内容：</strong>您在使用服务过程中创建的工作流、对话记录等归您所有，但本公司可将其用于服务优化和质量分析</li>
            <li><strong>AI生成内容：</strong>AI生成的内容仅供您参考，版权归您使用，但本公司不对内容的准确性、完整性承担保证责任</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">五、免责声明</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>AI生成内容：</strong>AI生成的内容仅供参考，本公司不对其准确性、完整性、适用性作任何明示或暗示的保证</li>
            <li><strong>服务中断：</strong>因系统维护、升级、故障或不可抗力导致的服务中断，本公司不承担责任，但会尽力恢复服务</li>
            <li><strong>用户行为：</strong>您在使用本服务时产生的任何行为和结果，由您自行承担法律责任</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">六、争议解决</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>适用法律：</strong>本协议的订立、执行和解释均适用中华人民共和国法律</li>
            <li><strong>争议解决：</strong>因本协议引起的任何争议，双方应首先友好协商解决；协商不成的，任一方可向本公司所在地人民法院提起诉讼</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">七、协议更新</h2>
          <p>本公司保留随时更新本协议的权利。更新后的协议将在平台上公布，并通过站内信或邮件通知您。如您继续使用服务，视为您同意更新后的协议。</p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">八、未成年人保护</h2>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>燃渡AI不接受14周岁以下未成年人注册</li>
            <li>14周岁以上未满18周岁的未成年人需在监护人同意下注册，监护人对未成年人的行为负监管责任</li>
            <li>如您未满18周岁，请在监护人的陪同下阅读本协议并取得其同意</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">九、联系我们</h2>
          <p>如您对本协议有任何疑问，请通过以下方式联系我们：</p>
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
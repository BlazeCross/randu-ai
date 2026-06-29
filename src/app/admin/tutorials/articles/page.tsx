import TutorialManager from "@/components/admin/TutorialManager";

/**
 * 图文教程管理页面
 *
 * 委托给共享组件 TutorialManager，type="article"。
 */
export default function AdminTutorialArticlesPage() {
  return <TutorialManager type="article" />;
}

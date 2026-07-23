export default function RealNameField({ defaultChecked = true }: { defaultChecked?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" name="requireRealName" value="on" id="requireRealName" defaultChecked={defaultChecked} />
      <label htmlFor="requireRealName" className="text-sm text-gray-600">
        需要实名（登录后访问）。取消勾选后，未登录的游客无需注册报名即可直接浏览本会议首页及相关展示页面
      </label>
    </div>
  );
}

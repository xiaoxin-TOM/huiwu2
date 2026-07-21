"use client";

import { useState } from "react";

export default function RegistrationPasswordField({
  defaultChecked = false,
  defaultPassword = "",
}: {
  defaultChecked?: boolean;
  defaultPassword?: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="requirePassword"
          value="on"
          id="requirePassword"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <label htmlFor="requirePassword" className="text-sm text-gray-600">
          需要报名密码（开启后用户报名时需输入正确密码才能提交）
        </label>
      </div>
      {checked && (
        <input
          name="registrationPassword"
          defaultValue={defaultPassword}
          placeholder="设置报名密码"
          required
          className="w-full rounded-lg border px-3 py-2"
        />
      )}
    </div>
  );
}

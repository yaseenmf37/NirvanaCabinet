"use client";

import { FormEvent, useState } from "react";
import { useAppState } from "./AppStateProvider";

const initialState = {
  name: "پروژه جدید",
  owner: "مدیر پروژه",
  stage: "برنامه‌ریزی",
  status: "در حال بررسی",
};

export default function ProjectForm() {
  const [form, setForm] = useState(initialState);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const { addProject } = useAppState();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.owner.trim()) {
      setError("نام پروژه و مالک پروژه الزامی است.");
      return;
    }

    setError("");

    addProject({
      name: form.name.trim(),
      owner: form.owner.trim(),
      stage: form.stage,
      status: form.status,
      progress: 18,
    });

    setForm(initialState);
    setSaved(true);

    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel__header">
        <h2>ایجاد پروژه جدید</h2>
      </div>

      <div className="form-grid">
        <label>
          نام پروژه
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label>
          مالک پروژه
          <input
            type="text"
            value={form.owner}
            onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))}
          />
        </label>
        <label>
          مرحله
          <select
            value={form.stage}
            onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))}
          >
            <option value="برنامه‌ریزی">برنامه‌ریزی</option>
            <option value="برش">برش</option>
            <option value="مونتاژ">مونتاژ</option>
            <option value="نصب">نصب</option>
          </select>
        </label>
        <label>
          وضعیت
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="در حال بررسی">در حال بررسی</option>
            <option value="در جریان">در جریان</option>
            <option value="در انتظار تایید">در انتظار تایید</option>
            <option value="تکمیل‌شده">تکمیل‌شده</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="notice notice-warn">
          <strong>خطا</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {saved ? (
        <div className="notice notice-success">
          <strong>ثبت شد</strong>
          <p>پروژه جدید به لیست اضافه شد.</p>
        </div>
      ) : null}

      <button type="submit" className="primary-btn">ذخیره پروژه</button>
    </form>
  );
}

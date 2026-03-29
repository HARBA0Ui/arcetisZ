"use client";

import { FormEvent, useState } from "react";
import { SectionHeader } from "@/backoffice/components/backoffice/section-header";
import { Spinner } from "@/components/common/spinner";
import { useToast } from "@/components/common/toast-center";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateAdminUser } from "@/backoffice/hooks/useAdmin";
import { getApiError } from "@/lib/api";

export default function BackofficeAdminsPage() {
  const createAdminUser = useCreateAdminUser();
  const toast = useToast();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: ""
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createAdminUser.mutateAsync(form);
      toast.success("Admin created", form.email);
      setForm({ email: "", username: "", password: "" });
    } catch (error) {
      toast.error("Admin create failed", getApiError(error));
    }
  };

  return (
    <div>
      <SectionHeader title="Admins" subtitle="Create and manage backoffice operators." />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Create Admin Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <Input
              type="email"
              placeholder="Admin email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <Button className="w-full" disabled={createAdminUser.isPending}>
              {createAdminUser.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Creating...
                </span>
              ) : (
                "Create Admin"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

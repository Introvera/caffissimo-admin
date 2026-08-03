"use client";

import { useState } from "react";
import {
  Save,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { useAppSelector } from "@/stores/store";
import { canManageSettings } from "@/lib/rbac";
import { UserRole } from "@/types";

export default function SettingsPage() {
  const { currentRole: uiRole } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const [taxRate, setTaxRate] = useState("8.75");
  const [serviceFeeRate, setServiceFeeRate] = useState("0");

  const canManage = canManageSettings(currentRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure system preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle>Tax & Fees</CardTitle>
          <CardDescription>
            Configure tax and service fee rates applied to orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <div className="relative w-32">
              <Input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                disabled={!canManage}
                className="pr-8"
              />
              <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Applied to all orders
            </p>
          </div>

          <div className="space-y-2">
            <Label>Service Fee Rate (%)</Label>
            <div className="relative w-32">
              <Input
                type="number"
                step="0.01"
                value={serviceFeeRate}
                onChange={(e) => setServiceFeeRate(e.target.value)}
                disabled={!canManage}
                className="pr-8"
              />
              <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Optional service fee for online orders
            </p>
          </div>

          {canManage && (
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

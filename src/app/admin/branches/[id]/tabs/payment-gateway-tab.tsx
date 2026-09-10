"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Key,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Power,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetAnzMerchantAccountsQuery,
  useCreateAnzMerchantAccountMutation,
  useUpdateAnzMerchantAccountMutation,
  useActivateAnzMerchantAccountMutation,
  useDeactivateAnzMerchantAccountMutation,
} from "@/stores/api/anzMerchantAccountApi";
import { Branch, PlatformEnvironment, UserRole } from "@/types";
import { isSuperAdmin } from "@/lib/rbac";
import { toast } from "sonner";

interface PaymentGatewayTabProps {
  branch: Branch;
  currentRole: UserRole;
}

export function PaymentGatewayTab({ branch, currentRole }: PaymentGatewayTabProps) {
  const isSuper = isSuperAdmin(currentRole);

  const { data: accounts, isLoading, refetch } = useGetAnzMerchantAccountsQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateAnzMerchantAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateAnzMerchantAccountMutation();
  const [activateAccount, { isLoading: isActivating }] = useActivateAnzMerchantAccountMutation();
  const [deactivateAccount, { isLoading: isDeactivating }] = useDeactivateAnzMerchantAccountMutation();

  const currentAccount = accounts?.find(
    (acc) => acc.branchId.toLowerCase() === branch.branchId.toLowerCase()
  );

  const [environment, setEnvironment] = useState<PlatformEnvironment>(PlatformEnvironment.Sandbox);
  const [merchantId, setMerchantId] = useState("");
  const [apiKeyId, setApiKeyId] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookKeyId, setWebhookKeyId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("AUD");
  const [isActive, setIsActive] = useState(true);

  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    if (currentAccount) {
      setEnvironment(currentAccount.environment ?? PlatformEnvironment.Sandbox);
      setMerchantId(currentAccount.merchantId || "");
      setApiKeyId(currentAccount.apiKeyId || "");
      setWebhookKeyId(currentAccount.webhookKeyId || "");
      setDefaultCurrency(currentAccount.defaultCurrency || "AUD");
      setIsActive(currentAccount.isActive ?? true);
      setApiSecret("");
      setWebhookSecret("");
    } else {
      setEnvironment(PlatformEnvironment.Sandbox);
      setMerchantId("");
      setApiKeyId("");
      setApiSecret("");
      setWebhookKeyId("");
      setWebhookSecret("");
      setDefaultCurrency("AUD");
      setIsActive(true);
    }
  }, [currentAccount]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuper) {
      toast.error("Only Super Administrators can configure payment acquiring accounts.");
      return;
    }

    if (!merchantId.trim()) {
      toast.error("Merchant ID (PSPID) is required.");
      return;
    }
    if (!apiKeyId.trim()) {
      toast.error("API Key ID is required.");
      return;
    }
    if (!webhookKeyId.trim()) {
      toast.error("Webhook Key ID is required.");
      return;
    }

    try {
      if (currentAccount) {
        await updateAccount({
          id: currentAccount.anzMerchantAccountId,
          data: {
            branchId: branch.branchId,
            environment,
            merchantId: merchantId.trim(),
            apiKeyId: apiKeyId.trim(),
            apiSecret: apiSecret.trim() || undefined,
            webhookKeyId: webhookKeyId.trim(),
            webhookSecret: webhookSecret.trim() || undefined,
            defaultCurrency: defaultCurrency.trim() || "AUD",
            isActive,
          },
        }).unwrap();
        toast.success("ANZ Merchant Account updated successfully.");
      } else {
        await createAccount({
          branchId: branch.branchId,
          environment,
          merchantId: merchantId.trim(),
          apiKeyId: apiKeyId.trim(),
          apiSecret: apiSecret.trim() || undefined,
          webhookKeyId: webhookKeyId.trim(),
          webhookSecret: webhookSecret.trim() || undefined,
          defaultCurrency: defaultCurrency.trim() || "AUD",
          isActive,
        }).unwrap();
        toast.success("ANZ Merchant Account configured successfully.");
      }
      setApiSecret("");
      setWebhookSecret("");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save ANZ merchant account.");
    }
  };

  const handleToggleActive = async () => {
    if (!currentAccount || !isSuper) return;
    try {
      if (currentAccount.isActive) {
        await deactivateAccount(currentAccount.anzMerchantAccountId).unwrap();
        toast.success("ANZ Merchant Account deactivated (immediate kill switch engaged).");
      } else {
        await activateAccount(currentAccount.anzMerchantAccountId).unwrap();
        toast.success("ANZ Merchant Account activated.");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to toggle active status.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const isConfigured = Boolean(currentAccount);
  const isPending = isCreating || isUpdating || isActivating || isDeactivating;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Overview / Status Banner */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              ANZ Worldline Payment Gateway
            </CardTitle>
            <CardDescription>
              Per-branch ANZ Worldline acquiring account for customer in-app and checkout payments.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            {isConfigured && isSuper && (
              <Button
                variant={currentAccount?.isActive ? "destructive" : "default"}
                size="sm"
                onClick={handleToggleActive}
                disabled={isPending}
                className="h-8 gap-1.5 text-white"
              >
                <Power className="h-3.5 w-3.5" />
                {currentAccount?.isActive ? "Deactivate (Kill Switch)" : "Activate Gateway"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/40 rounded-lg border border-border">
            <div>
              <p className="text-caption text-muted-foreground">Configuration Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                {isConfigured ? (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 gap-1 text-caption text-white">
                    <CheckCircle2 className="h-3 w-3" /> Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 text-caption">
                    <AlertTriangle className="h-3 w-3" /> Not Configured
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">Gateway State</p>
              <div className="flex items-center gap-1.5 mt-1">
                {currentAccount?.isActive ? (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600 gap-1 text-caption">
                    Active (Live)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 text-caption text-white">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">Environment</p>
              <p className="text-body font-medium mt-1">
                {currentAccount?.environment === PlatformEnvironment.Production || (currentAccount?.environment as any) === 1
                  ? "Production"
                  : "Sandbox (Test)"}
              </p>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">Currency</p>
              <p className="text-body font-medium mt-1">{currentAccount?.defaultCurrency || "AUD"}</p>
            </div>
          </div>

          {currentAccount && (
            <div className="mt-4 flex flex-wrap gap-4 text-caption text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  API Secret:{" "}
                  <strong className="text-foreground font-medium">
                    {currentAccount.hasApiSecret ? `Configured (${currentAccount.apiSecretStorage})` : "Missing"}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  Webhook Secret:{" "}
                  <strong className="text-foreground font-medium">
                    {currentAccount.hasWebhookSecret ? `Configured (${currentAccount.webhookSecretStorage})` : "Missing"}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            {isConfigured ? "Update Merchant Credentials" : "Setup Merchant Credentials"}
          </CardTitle>
          <CardDescription>
            Enter your ANZ Worldline PSPID, API key pair, and webhook verification secrets. Plaintext secrets are encrypted immediately upon submission and never stored or returned in raw text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSuper ? (
            <div className="p-4 bg-muted/40 rounded-lg text-body text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <span>Only Super Administrators have permission to modify merchant acquiring credentials.</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anz-env">Environment</Label>
                  <Select
                    value={environment.toString()}
                    onValueChange={(val) => setEnvironment(parseInt(val) as PlatformEnvironment)}
                  >
                    <SelectTrigger id="anz-env">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PlatformEnvironment.Sandbox.toString()}>Sandbox (Test)</SelectItem>
                      <SelectItem value={PlatformEnvironment.Production.toString()}>Production (Live)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anz-merchant-id">
                    Merchant ID (PSPID) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="anz-merchant-id"
                    placeholder="e.g. CAFFISSIMO001"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">The ANZ merchant identifier / PSPID.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anz-api-key-id">
                    API Key ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="anz-api-key-id"
                    placeholder="e.g. key_live_abc123"
                    value={apiKeyId}
                    onChange={(e) => setApiKeyId(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">Public identifier of the API key pair.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anz-api-secret">
                    API Secret {currentAccount?.hasApiSecret && <span className="text-muted-foreground font-normal">(Leave empty to keep existing)</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id="anz-api-secret"
                      type={showApiSecret ? "text" : "password"}
                      placeholder={currentAccount?.hasApiSecret ? "••••••••••••••••" : "Enter API secret"}
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiSecret(!showApiSecret)}
                    >
                      {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Secret key used to sign REST API requests to ANZ.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anz-webhook-key-id">
                    Webhook Key ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="anz-webhook-key-id"
                    placeholder="e.g. whkey_live_xyz789"
                    value={webhookKeyId}
                    onChange={(e) => setWebhookKeyId(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">Arrives as X-GCS-KeyId on webhook callbacks.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anz-webhook-secret">
                    Webhook Secret {currentAccount?.hasWebhookSecret && <span className="text-muted-foreground font-normal">(Leave empty to keep existing)</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id="anz-webhook-secret"
                      type={showWebhookSecret ? "text" : "password"}
                      placeholder={currentAccount?.hasWebhookSecret ? "••••••••••••••••" : "Enter webhook secret"}
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    >
                      {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Used to verify HMAC signature on ANZ webhook events.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 max-w-md">
                <Label htmlFor="anz-currency">Default Settlement Currency</Label>
                <Input
                  id="anz-currency"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="AUD"
                  className="w-full"
                />
                <p className="text-[11px] text-muted-foreground">3-letter ISO currency code (e.g. AUD, USD).</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border w-full">
                <div className="space-y-0.5">
                  <Label htmlFor="anz-is-active" className="text-body font-medium cursor-pointer">
                    Gateway Active
                  </Label>
                  <p className="text-caption text-muted-foreground">
                    Accept customer payments and process checkout orders through this ANZ acquiring gateway
                  </p>
                </div>
                <Switch
                  id="anz-is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isConfigured ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
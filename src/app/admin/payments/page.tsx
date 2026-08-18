"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Power,
  ShieldCheck,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useAppSelector } from "@/stores/store";
import { isSuperAdmin } from "@/lib/rbac";
import {
  useGetAnzMerchantAccountsQuery,
  useCreateAnzMerchantAccountMutation,
  useUpdateAnzMerchantAccountMutation,
  useSetAnzMerchantAccountActiveMutation,
  useGetBranchesLookupQuery,
} from "@/stores/api";
import {
  AnzMerchantAccount,
  AnzEnvironment,
  UpsertAnzMerchantAccountRequest,
  UserRole,
} from "@/types";

/**
 * ANZ Worldline merchant accounts — one per branch, per environment.
 *
 * Secrets are write-only here by design: typed in once, sent up, encrypted server-side,
 * never returned. Nothing on this page can display a stored secret because nothing in the
 * API can return one.
 */
export default function PaymentsPage() {
  const uiRole = useAppSelector((state) => state.ui.currentRole);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const canManage = isSuperAdmin(currentRole);

  const { data: accounts, isLoading, error } = useGetAnzMerchantAccountsQuery(undefined, {
    skip: !canManage,
  });
  const { data: branches } = useGetBranchesLookupQuery(undefined, { skip: !canManage });

  const [createAccount, { isLoading: isCreating }] = useCreateAnzMerchantAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateAnzMerchantAccountMutation();
  const [setActive] = useSetAnzMerchantAccountActiveMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AnzMerchantAccount | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const branchName = useMemo(() => {
    const map = new Map<string, string>();
    branches?.forEach((b) => map.set(b.branchId, b.branchName));
    return map;
  }, [branches]);

  if (!canManage) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payment Gateway" description="ANZ Worldline merchant accounts" />
        <Card>
          <CardContent className="flex items-center gap-3 py-10">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">SuperAdmin only</p>
              <p className="text-sm text-muted-foreground">
                These credentials control where a branch&apos;s takings settle, so only
                SuperAdmin roles can view or change them.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(account: AnzMerchantAccount) {
    setEditing(account);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(body: UpsertAnzMerchantAccountRequest) {
    setFormError(null);
    try {
      if (editing) {
        await updateAccount({ id: editing.anzMerchantAccountId, body }).unwrap();
      } else {
        await createAccount(body).unwrap();
      }
      setDialogOpen(false);
    } catch (e) {
      // Surface the backend's own message — it names exactly which rule was hit
      // (duplicate branch/environment, missing master key, a secret in an id field).
      const err = e as { data?: { message?: string }; error?: string };
      setFormError(err?.data?.message ?? err?.error ?? "Could not save the merchant account.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Gateway"
        description="ANZ Worldline merchant accounts, one per branch"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add account
          </Button>
        }
      />

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardContent className="flex gap-3 py-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">Secrets are write-only</p>
            <p className="text-muted-foreground">
              API and webhook secrets are encrypted before storage and can never be read
              back — not here, not through the API. If one is lost, generate a new key in
              the ANZ Merchant Portal and save it again. Editing any other field never
              requires re-entering a secret.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Merchant accounts</CardTitle>
          <CardDescription>
            Each branch settles to its own bank account, so each normally has its own
            merchant ID (PSPID). Deactivating an account stops it taking payments and stops
            its webhook key validating — immediately, with no deploy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 py-6 text-sm">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Could not load merchant accounts.</span>
            </div>
          ) : !accounts?.length ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No merchant accounts yet</p>
                <p className="text-sm text-muted-foreground">
                  Add one per branch using the credentials from the ANZ Merchant Portal.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Merchant ID</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Secrets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.anzMerchantAccountId}>
                    <TableCell className="font-medium">
                      {account.branchName ?? branchName.get(account.branchId) ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{account.merchantId}</TableCell>
                    <TableCell>
                      {/* Production is called out visually: that row is the one where a
                          mistake costs real money. */}
                      <Badge
                        variant={
                          account.environment === AnzEnvironment.Production
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {account.environment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <SecretBadge
                          label="API"
                          storage={account.apiSecretStorage}
                          present={account.hasApiSecret}
                        />
                        <SecretBadge
                          label="Webhook"
                          storage={account.webhookSecretStorage}
                          present={account.hasWebhookSecret}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={account.isActive}
                          onCheckedChange={(checked) =>
                            setActive({ id: account.anzMerchantAccountId, isActive: checked })
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {account.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(account)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        branches={branches ?? []}
        busy={isCreating || isUpdating}
        error={formError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/** Shows that a secret exists and where it is held — never anything about its value. */
function SecretBadge({
  label,
  storage,
  present,
}: {
  label: string;
  storage: string;
  present: boolean;
}) {
  if (!present) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertTriangle className="h-3 w-3" />
        {label}: missing
      </span>
    );
  }

  const encrypted = storage === "Encrypted";

  return (
    <span
      className={`flex items-center gap-1.5 text-xs ${
        encrypted ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground"
      }`}
      // Configuration-held secrets still work; they just cannot be rotated without a
      // deploy, which is the reason to finish migrating them.
      title={
        encrypted
          ? "Encrypted in the database"
          : "Held in configuration — rotating it needs a deploy"
      }
    >
      {encrypted ? <CheckCircle2 className="h-3 w-3" /> : <KeyRound className="h-3 w-3" />}
      {label}: {encrypted ? "encrypted" : "config"}
    </span>
  );
}

function AccountDialog({
  open,
  onOpenChange,
  editing,
  branches,
  busy,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AnzMerchantAccount | null;
  branches: { branchId: string; branchName: string }[];
  busy: boolean;
  error: string | null;
  onSubmit: (body: UpsertAnzMerchantAccountRequest) => void;
}) {
  const isEdit = editing !== null;

  const [branchId, setBranchId] = useState("");
  const [environment, setEnvironment] = useState<AnzEnvironment>(
    AnzEnvironment.Sandbox,
  );
  const [merchantId, setMerchantId] = useState("");
  const [apiKeyId, setApiKeyId] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookKeyId, setWebhookKeyId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("AUD");
  const [isActive, setIsActive] = useState(true);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Re-seed when the dialog opens on a different account. Secrets always start empty, even
  // when editing — there is nothing to prefill them from.
  const key = editing?.anzMerchantAccountId ?? "new";
  if (open && hydratedFor !== key) {
    setHydratedFor(key);
    setBranchId(editing?.branchId ?? "");
    setEnvironment(editing?.environment ?? AnzEnvironment.Sandbox);
    setMerchantId(editing?.merchantId ?? "");
    setApiKeyId(editing?.apiKeyId ?? "");
    setWebhookKeyId(editing?.webhookKeyId ?? "");
    setDefaultCurrency(editing?.defaultCurrency ?? "AUD");
    setIsActive(editing?.isActive ?? true);
    setApiSecret("");
    setWebhookSecret("");
  }
  if (!open && hydratedFor !== null) setHydratedFor(null);

  const secretsRequired = !isEdit;
  const canSubmit =
    Boolean(branchId) &&
    Boolean(merchantId.trim()) &&
    Boolean(apiKeyId.trim()) &&
    Boolean(webhookKeyId.trim()) &&
    defaultCurrency.trim().length === 3 &&
    (!secretsRequired || (Boolean(apiSecret.trim()) && Boolean(webhookSecret.trim())));

  function submit() {
    onSubmit({
      branchId,
      environment,
      merchantId: merchantId.trim(),
      apiKeyId: apiKeyId.trim(),
      webhookKeyId: webhookKeyId.trim(),
      defaultCurrency: defaultCurrency.trim().toUpperCase(),
      isActive,
      // Omitted means "leave the stored secret alone". That is what makes editing a
      // merchant id possible without having the secret to hand.
      ...(apiSecret.trim() ? { apiSecret: apiSecret.trim() } : {}),
      ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit merchant account" : "Add merchant account"}</DialogTitle>
          <DialogDescription>
            Values come from the ANZ Merchant Portal. Key IDs are identifiers; the two
            secrets are encrypted before storage and cannot be read back.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={branchId} onValueChange={setBranchId} disabled={isEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.branchId} value={b.branchId}>
                    {b.branchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Branch and environment are fixed after creation — changing either would
                re-point existing payments&apos; credentials. Deactivate and create a new
                account instead.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select
                value={environment}
                onValueChange={(v) => setEnvironment(v as AnzEnvironment)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AnzEnvironment.Sandbox}>Sandbox</SelectItem>
                  <SelectItem value={AnzEnvironment.Production}>Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="AUD"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Merchant ID (PSPID)</Label>
            <Input
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder="e.g. Introvera1"
              className="font-mono"
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">API credentials</p>
            <div className="space-y-2">
              <Label>API key ID</Label>
              <Input
                value={apiKeyId}
                onChange={(e) => setApiKeyId(e.target.value)}
                placeholder="Developer &rarr; Payment API"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>
                API secret{" "}
                {isEdit && (
                  <span className="text-muted-foreground">(leave blank to keep)</span>
                )}
              </Label>
              <Input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={isEdit ? "unchanged" : "Shown once, at creation"}
                className="font-mono text-xs"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Webhook credentials</p>
            <div className="space-y-2">
              <Label>Webhook key ID</Label>
              <Input
                value={webhookKeyId}
                onChange={(e) => setWebhookKeyId(e.target.value)}
                placeholder="Arrives as the X-GCS-KeyId header"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Webhook secret{" "}
                {isEdit && (
                  <span className="text-muted-foreground">(leave blank to keep)</span>
                )}
              </Label>
              <Input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder={isEdit ? "unchanged" : "Displayed for 60 seconds only"}
                className="font-mono text-xs"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                <Power className="mr-1 inline h-3 w-3" />
                Inactive accounts take no payments and their webhook key stops validating.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

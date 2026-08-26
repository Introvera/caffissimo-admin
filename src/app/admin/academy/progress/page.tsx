"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { trainingApi } from "@/lib/training-api";
import { useAppSelector } from "@/stores/store";
import { canAccessAllBranches } from "@/lib/rbac";
import {
  UserRole,
  type EmployeeTrainingStatusResponse,
  type TrainingQualificationStatus,
  type EmployeeTrainingCertificateResponse,
} from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 20;

// ─── Status helpers ──────────────────────────────────────────────────────────

const statusConfig: Record<
  TrainingQualificationStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  Passed: {
    label: "Passed",
    icon: CheckCircle2,
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0",
  },
  InProgress: {
    label: "In Progress",
    icon: Clock,
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0",
  },
  NotStarted: {
    label: "Not Started",
    icon: AlertCircle,
    className:
      "bg-muted text-muted-foreground border-0",
  },
};

function StatusBadge({ status }: { status: TrainingQualificationStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 text-caption px-2 py-0.5 ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AcademyProgressPage() {
  const currentRole = useAppSelector(
    (state) => state.ui.currentRole || state.auth.user?.role || UserRole.Cashier
  );
  const selectedBranchId = useAppSelector((state) => state.ui.selectedBranchId);
  const assignedBranchId = useAppSelector(
    (state) => state.ui.assignedBranchId || state.auth.user?.branchId
  );

  const isSuperAdmin = canAccessAllBranches(currentRole);

  // The branchId to use: super admin uses navbar selection, others use their assigned branch
  const effectiveBranchId = isSuperAdmin ? selectedBranchId : assignedBranchId;

  const [rows, setRows] = useState<EmployeeTrainingStatusResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrainingQualificationStatus | "all">("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Certificates Dialog states
  const [certsDialogOpen, setCertsDialogOpen] = useState(false);
  const [certsList, setCertsList] = useState<EmployeeTrainingCertificateResponse[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [viewingEmployeeId, setViewingEmployeeId] = useState("");
  const [viewingModuleTitle, setViewingModuleTitle] = useState("");

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleViewCertificates = async (
    employeeId: string,
    moduleId: string,
    moduleTitle: string
  ) => {
    setViewingEmployeeId(employeeId);
    setViewingModuleTitle(moduleTitle);
    setCertsDialogOpen(true);
    setCertsLoading(true);
    setCertsList([]);
    try {
      const data = await trainingApi.getEmployeeCertificates(employeeId, moduleId);
      setCertsList(data);
    } catch {
      toast.error("Failed to load employee certificates");
    } finally {
      setCertsLoading(false);
    }
  };

  const loadProgress = async (branchId: string, pg: number, q: string, status: string) => {
    setIsLoading(true);
    try {
      const statusParam = status === "all" ? undefined : status;
      const result = await trainingApi.getBranchStatuses(branchId, pg, PAGE_SIZE, q || undefined, statusParam);
      setRows(result.items);
      setTotalCount(result.totalCount);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load training progress");
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload whenever the effective branch, page, or filters change
  useEffect(() => {
    if (!effectiveBranchId) {
      setRows([]);
      setTotalCount(0);
      return;
    }
    loadProgress(effectiveBranchId, page, debouncedSearch, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBranchId, page, debouncedSearch, statusFilter]);

  // Reset page when branch or filters change
  useEffect(() => {
    setPage(1);
  }, [effectiveBranchId, debouncedSearch, statusFilter]);

  const filtered = rows;


  // ── No branch selected (super admin only scenario) ─────────────────────

  if (isSuperAdmin && !effectiveBranchId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Training Progress"
          description="View employee training completion across your branch"
        />
        <Card>
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <MapPin className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No branch selected</p>
              <p className="text-body text-muted-foreground mt-1">
                Use the branch selector in the top navigation bar to pick a branch and view its training progress.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── No assigned branch (non-super-admin edge case) ─────────────────────

  if (!isSuperAdmin && !effectiveBranchId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Training Progress"
          description="View employee training completion for your branch"
        />
        <Card>
          <CardContent className="py-20">
            <EmptyState
              icon={GraduationCap}
              title="No branch assigned"
              description="Your account is not assigned to a branch. Contact your administrator."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Progress"
        description="Track employee training completion and quiz results"
      />

      {/* Summary KPI strip */}
      {!isLoading && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {(["Passed", "InProgress", "NotStarted"] as TrainingQualificationStatus[]).map(
            (s) => {
              const cfg = statusConfig[s];
              const Icon = cfg.icon;
              const count = rows.filter((r) => r.status === s).length;
              return (
                <Card
                  key={s}
                  className={`cursor-pointer border transition-all ${
                    statusFilter === s ? "ring-2 ring-primary" : "hover:shadow-sm"
                  }`}
                  onClick={() =>
                    setStatusFilter((prev) => (prev === s ? "all" : s))
                  }
                >
                  <CardContent className="py-4 px-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.className}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-h3 font-bold text-foreground">{count}</p>
                      <p className="text-caption text-muted-foreground">{cfg.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as TrainingQualificationStatus | "all")}
          >
            <SelectTrigger className="w-auto h-9 gap-1.5 rounded-lg border-border/80 bg-background px-3.5 text-body font-medium shadow-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Passed">Passed</SelectItem>
              <SelectItem value="InProgress">In Progress</SelectItem>
              <SelectItem value="NotStarted">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="progress-search"
            placeholder="Search module or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-[240px]"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <CardContent className="py-24 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="py-16">
            <EmptyState
              icon={GraduationCap}
              title="No records found"
              description={
                search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No training records exist for this branch yet"
              }
            />
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead>Module</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Passed At</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, idx) => (
                  <TableRow key={`${row.employeeId}-${row.trainingModuleId}-${idx}`}>
                    <TableCell>
                      <span className="font-medium text-body text-foreground">
                        {row.trainingModuleTitle}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-body text-muted-foreground font-mono">
                        {row.employeeId.slice(0, 8)}…
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={row.status} />
                        {row.certificateCount > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary hover:bg-primary/10"
                            onClick={() =>
                              handleViewCertificates(
                                row.employeeId,
                                row.trainingModuleId,
                                row.trainingModuleTitle
                              )
                            }
                            title="View uploaded certificates"
                            id={`view-certificates-${row.employeeId}-${row.trainingModuleId}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-body text-muted-foreground">
                        {row.passedAt ? formatDate(row.passedAt) : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-body text-muted-foreground">
                        {formatDate(row.updatedAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
                <p className="text-body text-muted-foreground">
                  Page{" "}
                  <span className="font-medium text-foreground">{page}</span> of{" "}
                  <span className="font-medium text-foreground">{totalPages}</span>
                  {" "}·{" "}
                  <span className="font-medium text-foreground">{totalCount}</span> total records
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    id="progress-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pg: number;
                    if (totalPages <= 5) pg = i + 1;
                    else if (page <= 3) pg = i + 1;
                    else if (page > totalPages - 3) pg = totalPages - 4 + i;
                    else pg = page - 2 + i;
                    return (
                      <Button
                        key={pg}
                        variant={page === pg ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-caption"
                        onClick={() => setPage(pg)}
                        id={`progress-page-${pg}`}
                      >
                        {pg}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    id="progress-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Certificates Viewer Dialog ───────────────────────────────────────── */}
      <Dialog open={certsDialogOpen} onOpenChange={setCertsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Training Certificates</DialogTitle>
            <DialogDescription>
              Certificates uploaded by employee <strong>{viewingEmployeeId.slice(0, 8)}…</strong> for module: <strong>{viewingModuleTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {certsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : certsList.length === 0 ? (
              <p className="text-center text-body text-muted-foreground py-6">
                No certificate uploads found for this module.
              </p>
            ) : (
              <div className="space-y-3">
                {certsList.map((cert) => (
                  <Card key={cert.employeeTrainingCertificateId} className="border border-border/80 shadow-none">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-body font-medium truncate" title={cert.originalFileName}>
                          {cert.originalFileName}
                        </p>
                        <p className="text-caption text-muted-foreground mt-0.5">
                          Size: {(cert.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB · Uploaded: {formatDate(cert.uploadedAt)}
                        </p>
                      </div>
                      <a
                        href={cert.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center justify-center h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-caption font-medium transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCertsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

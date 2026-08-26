"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Thermometer, Calendar, FileText } from "lucide-react";
import { parseISO, format, isWithinInterval, startOfDay } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppSelector } from "@/stores/store";
import { canSubmitFridgeReport, canAccessAllBranches } from "@/lib/rbac";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { useGetFridgeReportsQuery, useCreateFridgeReportMutation } from "@/stores/api/fridgeApi";
import { formatDate } from "@/lib/utils";
import { UserRole } from "@/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const FRIDGE_UNITS = [
  "Main Fridge",
  "Milk Fridge",
  "Pastry Display Fridge",
  "Walk-in Cooler",
];

export default function FridgeStockPage() {
  const { currentRole: uiRole, selectedBranchId, assignedBranchId, dateRange } = useAppSelector((state) => state.ui);
  const authRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const currentRole = uiRole || authRole;
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [temperatureValues, setTemperatureValues] = useState<Record<string, number>>({});
  const [reportDate, setReportDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportBranchId, setReportBranchId] = useState("");
  const [notes, setNotes] = useState("");

  const effectiveBranchId = selectedBranchId || assignedBranchId;
  const canSubmit = canSubmitFridgeReport(currentRole);

  const { data: branchesData, isLoading: branchesLoading } = useGetBranchesQuery({ pageSize: 100 });
  const branches = branchesData?.items || [];

  const { data: reportsData, isLoading: reportsLoading, refetch } = useGetFridgeReportsQuery({
    branchId: effectiveBranchId || undefined,
    startDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    page: 1,
    pageSize: 100,
  });

  const reports = reportsData?.items || [];
  const [createFridgeReport, { isLoading: isSubmitting }] = useCreateFridgeReportMutation();

  // Set default branch when branches load
  useEffect(() => {
    if (branches.length > 0 && !reportBranchId) {
      setReportBranchId(effectiveBranchId || branches[0].branchId);
    }
  }, [branches, effectiveBranchId, reportBranchId]);

  const getBranchName = (branchId: string) => {
    return branches.find((b) => b.branchId === branchId)?.branchName.replace("Caffissimo", "").trim() || "Unknown";
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 33 || temp > 40) return "text-destructive bg-destructive/10";
    if (temp < 34 || temp > 38) return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30";
    return "text-primary bg-primary/10";
  };

  const handleSubmit = async () => {
    const targetBranch = reportBranchId || effectiveBranchId || (branches.length > 0 ? branches[0].branchId : "");
    if (!targetBranch) {
      toast.error("Please select a branch");
      return;
    }

    const temps: Record<string, number> = {};
    Object.entries(temperatureValues).forEach(([key, val]) => {
      if (val !== undefined && val !== null && !isNaN(val)) {
        temps[key] = val;
      }
    });

    if (Object.keys(temps).length === 0) {
      toast.error("Please enter temperature for at least one fridge unit");
      return;
    }

    try {
      await createFridgeReport({
        branchId: targetBranch,
        date: reportDate,
        temperatures: temps,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success("Fridge temperature report submitted successfully");
      setSubmitDialogOpen(false);
      setTemperatureValues({});
      setNotes("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit temperature report");
    }
  };

  const isLoading = branchesLoading || reportsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fridge Temperature Report"
        description="Track daily fridge temperatures"
        actions={
          canSubmit && (
            <Dialog open={submitDialogOpen} onOpenChange={(open) => {
              setSubmitDialogOpen(open);
              if (open) {
                setReportDate(format(new Date(), "yyyy-MM-dd"));
                setReportBranchId(effectiveBranchId || (branches.length > 0 ? branches[0].branchId : ""));
                setTemperatureValues({});
                setNotes("");
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Submit Daily Temperature Report</DialogTitle>
                  <DialogDescription>
                    Enter today&apos;s fridge temperatures (°F)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                    </div>
                    {canAccessAllBranches(currentRole) && (
                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Select value={reportBranchId} onValueChange={setReportBranchId}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.branchId} value={branch.branchId}>
                                {branch.branchName.replace("Caffissimo", "").trim()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Fridge Temperatures (°F)</Label>
                    {FRIDGE_UNITS.map((unit) => (
                      <div key={unit} className="flex items-center gap-3">
                        <span className="flex-1 text-body">{unit}</span>
                        <div className="relative w-24">
                          <Input
                            type="number"
                            step="0.1"
                            className="pr-7"
                            placeholder="36.0"
                            value={temperatureValues[unit] || ""}
                            onChange={(e) =>
                              setTemperatureValues((prev) => ({
                                ...prev,
                                [unit]: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                          <span className="absolute right-2.5 top-2.5 text-caption text-muted-foreground">°F</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Thermometer}
              title="No reports found"
              description="Submit a temperature report to track fridge conditions"
              action={
                canSubmit && (
                  <Button onClick={() => setSubmitDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Report
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report, index) => {
            const tempArray = Object.entries(report.temperatures || {}).map(([name, temp]) => ({
              name,
              temperature: Number(temp),
            }));

            return (
              <motion.div
                key={report.reportId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-body">
                            {formatDate(report.date)}
                          </CardTitle>
                          <CardDescription>
                            {getBranchName(report.branchId)} &bull; Submitted by {report.submittedByName}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {tempArray.map((entry) => (
                        <div
                          key={entry.name}
                          className={`text-center p-3 rounded-lg ${getTemperatureColor(entry.temperature)}`}
                        >
                          <p className="text-h2 font-bold">{entry.temperature}°F</p>
                          <p className="text-caption line-clamp-2 mt-1">
                            {entry.name}
                          </p>
                        </div>
                      ))}
                    </div>
                    {report.notes && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/50">
                        <p className="text-body text-muted-foreground">
                          <FileText className="h-4 w-4 inline mr-1" />
                          {report.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}


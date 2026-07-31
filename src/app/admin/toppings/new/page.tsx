"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { useAppSelector } from "@/stores/store";
import { isSuperAdmin, canManageProducts } from "@/lib/rbac";
import { 
  useGetToppingCategoriesQuery, 
  useCreateToppingMutation,
  useCreateBranchToppingMutation
} from "@/stores/api/toppingApi";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { UserRole, ToppingCategory } from "@/types";
import { toast } from "sonner";

interface ToppingFormData {
  toppingName: string;
  toppingCategoryId: string;
  price: number;
  isActive: boolean;
}

const toppingSchema = z.object({
  toppingName: z.string().min(2, "Name must be at least 2 characters"),
  toppingCategoryId: z.string().min(1, "Please select a category"),
  price: z.number().min(0, "Price must be positive"),
  isActive: z.boolean(),
});

type BranchToppingConfig = {
  branchId: string;
  isAvailable: boolean;
  overrideToppingPrice: number | null;
};

export default function NewToppingPage() {
  const router = useRouter();
  const currentRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const assignedBranchId = useAppSelector((state) => state.auth.user?.branchId);
  const isSuper = isSuperAdmin(currentRole as UserRole);
  
  const { data: categoriesData } = useGetToppingCategoriesQuery();
  const categories = categoriesData?.items || [];

  const { data: branchesData } = useGetBranchesQuery();
  const branches = branchesData?.items || [];
  
  const [createTopping] = useCreateToppingMutation();
  const [createBranchTopping] = useCreateBranchToppingMutation();

  const [activeTab, setActiveTab] = useState("base");
  const [branchConfigs, setBranchConfigs] = useState<BranchToppingConfig[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  useEffect(() => {
    if (!isSuper && assignedBranchId && branchConfigs.length === 0) {
      setBranchConfigs([{
        branchId: assignedBranchId,
        isAvailable: true,
        overrideToppingPrice: null,
      }]);
    }
  }, [isSuper, assignedBranchId, branchConfigs.length]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ToppingFormData>({
    resolver: zodResolver(toppingSchema),
    defaultValues: {
      toppingName: "",
      toppingCategoryId: "",
      price: 0,
      isActive: true,
    }
  });

  const addBranchConfig = (branchId: string) => {
    setBranchConfigs(prev => [
      ...prev,
      {
        branchId,
        isAvailable: true,
        overrideToppingPrice: null,
      }
    ]);
    setActiveTab(`branch-${branchId}`);
  };

  const removeBranchConfig = (branchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBranchConfigs(prev => prev.filter(b => b.branchId !== branchId));
    if (activeTab === `branch-${branchId}`) {
      setActiveTab("base");
    }
  };

  const updateBranchConfig = (branchId: string, updates: Partial<BranchToppingConfig>) => {
    setBranchConfigs(prev => prev.map(b => b.branchId === branchId ? { ...b, ...updates } : b));
  };

  const onSubmit = async (data: ToppingFormData) => {
    setIsSubmittingForm(true);
    try {
      // 1. Create Base Topping
      const newTopping = await createTopping({
        toppingName: data.toppingName,
        toppingCategoryId: data.toppingCategoryId,
        toppingPrice: Number(data.price),
        isActive: data.isActive,
      } as never).unwrap();

      const toppingId = newTopping.toppingId;

      // 2. Create Branch Overrides
      for (const branchConf of branchConfigs) {
        await createBranchTopping({
          branchId: branchConf.branchId,
          toppingId: toppingId,
          isAvailable: branchConf.isAvailable,
          overrideToppingPrice: branchConf.overrideToppingPrice !== null ? Number(branchConf.overrideToppingPrice) : null,
        }).unwrap();
      }

      toast.success("Topping created successfully with branch overrides");
      router.push("/admin/toppings");
    } catch (err) {
      console.error("Failed to create topping:", err);
      toast.error("Failed to create topping. Check console for details.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.warn("Form validation errors:", errors);
    const errorMessages = Object.entries(errors)
      .map(([field, err]: [string, any]) => {
        const message = err?.message || "Invalid value";
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return `${fieldName}: ${message}`;
      })
      .join(", ");
    toast.error(`Please fix validation errors: ${errorMessages || "Check all fields"}`);
  };

  const canEdit = canManageProducts(currentRole);
  const unconfiguredBranches = branches.filter(b => !branchConfigs.find(c => c.branchId === b.branchId));
  const basePriceValue = watch("price") || 0;

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title="Access Denied" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You do not have permission to create toppings.
            </p>
            <Button onClick={() => router.push("/admin/toppings")} className="mt-4">
              Return to Toppings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Add New Topping"
          description="Create a new topping customization and configure branch overrides"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center border-b border-border">
            <TabsList className="bg-transparent h-auto p-0 gap-0 justify-start flex-1">
              <TabsTrigger 
                value="base" 
                className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary"
              >
                Base
              </TabsTrigger>
              {branchConfigs.map(config => {
                const b = branches.find(br => br.branchId === config.branchId);
                return (
                  <TabsTrigger 
                    key={config.branchId} 
                    value={`branch-${config.branchId}`}
                    className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary flex items-center gap-1.5"
                  >
                    {b?.branchName.replace("Caffissimo", "").trim() || "Branch"}
                    {isSuper && <X className="h-3 w-3 hover:text-destructive z-10" onClick={(e) => removeBranchConfig(config.branchId, e)} />}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {isSuper && unconfiguredBranches.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="mb-1 h-8">
                    <Plus className="h-4 w-4 mr-2" />
                    Add branch override
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {unconfiguredBranches.map(b => (
                    <DropdownMenuItem key={b.branchId} onClick={() => addBranchConfig(b.branchId)}>
                      {b.branchName.replace("Caffissimo", "").trim()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <TabsContent value="base" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Topping Information</CardTitle>
                    <CardDescription>Core details of the topping</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="toppingName">Topping Name</Label>
                      <Input
                        id="toppingName"
                        placeholder="e.g. Soy Milk, Vanilla Syrup"
                        {...register("toppingName")}
                      />
                      {errors.toppingName && (
                        <p className="text-sm text-destructive">{errors.toppingName.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={watch("toppingCategoryId")}
                          onValueChange={(value) => setValue("toppingCategoryId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat: ToppingCategory) => (
                              <SelectItem key={cat.toppingCategoryId} value={cat.toppingCategoryId}>
                                {cat.categoryName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.toppingCategoryId && (
                          <p className="text-sm text-destructive">{errors.toppingCategoryId.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Base Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 0.80"
                            {...register("price", { valueAsNumber: true })}
                            className="pl-7"
                          />
                        </div>
                        {errors.price && (
                          <p className="text-sm text-destructive">{errors.price.message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Active Status</Label>
                        <p className="text-xs text-muted-foreground">Overall availability</p>
                      </div>
                      <Switch
                        checked={watch("isActive")}
                        onCheckedChange={(checked) => setValue("isActive", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {branchConfigs.map(branchConf => {
            const b = branches.find(br => br.branchId === branchConf.branchId);
            return (
              <TabsContent key={branchConf.branchId} value={`branch-${branchConf.branchId}`} className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Branch Topping Override</CardTitle>
                        <CardDescription>
                          Configure specific pricing and availability for {b?.branchName || "this branch"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 flex flex-col justify-center">
                            <Label className="mb-2">Branch Availability</Label>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={branchConf.isAvailable} 
                                onCheckedChange={(val) => updateBranchConfig(branchConf.branchId, { isAvailable: val })} 
                              />
                              <span className="text-sm text-muted-foreground">
                                {branchConf.isAvailable ? "Available in this branch" : "Unavailable in this branch"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Price Override (Optional)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="pl-7" 
                                placeholder={basePriceValue.toFixed(2)}
                                value={branchConf.overrideToppingPrice !== null ? branchConf.overrideToppingPrice : ""} 
                                onChange={(e) => {
                                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                                  updateBranchConfig(branchConf.branchId, { overrideToppingPrice: val });
                                }} 
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Leave empty to use base price: ${basePriceValue.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmittingForm}>Cancel</Button>
          <Button type="submit" disabled={isSubmittingForm}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmittingForm ? "Creating..." : "Create Topping"}
          </Button>
        </div>
      </form>
    </div>
  );
}

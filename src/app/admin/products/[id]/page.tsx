"use client";

import { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, Plus, X, Save, Lock } from "lucide-react";
import { TbEdit } from "react-icons/tb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PageHeader } from "@/components/shared/page-header";
import { EditBar } from "@/components/shared/edit-bar";
import { useAppSelector } from "@/stores/store";
import { isSuperAdmin, canManageProducts } from "@/lib/rbac";
import { 
  useGetProductByIdQuery, 
  useGetCategoriesQuery, 
  useUpdateProductMutation 
} from "@/stores/api/productApi";
import { useGetBranchesQuery } from "@/stores/api/branchApi";
import { 
  useGetBranchProductsQuery,
  useCreateBranchProductMutation,
  useUpdateBranchProductMutation,
  useDeleteBranchProductMutation
} from "@/stores/api/branchProductApi";
import {
  useCreateBranchProductVariantMutation,
  useUpdateBranchProductVariantMutation,
  useDeleteBranchProductVariantMutation
} from "@/stores/api/variantApi";
import { 
  useGetToppingsQuery,
  useGetProductToppingsQuery,
  useCreateProductToppingMutation,
  useDeleteProductToppingMutation
} from "@/stores/api/toppingApi";
import { Category, Branch, UserRole, BranchProductResponse } from "@/types";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/image-uploader";
import { CharacterCounter } from "@/components/ui/character-counter";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name must not exceed 200 characters"),
  description: z.string().max(1000, "Description must not exceed 1000 characters").or(z.literal("")),
  categoryId: z.string().min(1, "Please select a category"),
  price: z.number().positive("Price must be greater than 0"),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

type VariantConfig = {
  id: string;
  originalId?: string;
  variantName: string;
  price: number;
  isAvailable: boolean;
};

type BranchConfig = {
  branchId: string;
  originalId?: string;
  isActive: boolean;
  overridePosImage: File | string | null;
  overrideEcomImages: (File | string)[];
  variants: VariantConfig[];
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * An image slot holds already-saved URLs (strings) mixed with newly picked files.
 * The API keeps the URLs it is given and appends uploads for the files, so both
 * halves have to be sent: strings on the URL field, files on the *Files field.
 */
function keptUrls(value: File | string | (File | string)[] | null): string[] {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items.filter((i): i is string => typeof i === "string");
}

function newFiles(value: File | string | (File | string)[] | null): File[] | undefined {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  const files = items.filter((i): i is File => i instanceof File);
  return files.length > 0 ? files : undefined;
}



interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const currentRole = useAppSelector((state) => state.auth.user?.role) || UserRole.Cashier;
  const assignedBranchId = useAppSelector((state) => state.auth.user?.branchId);
  const isSuper = isSuperAdmin(currentRole as UserRole);
  const canEdit = canManageProducts(currentRole);

  const { data: product, isLoading: productLoading } = useGetProductByIdQuery(resolvedParams.id);
  const { data: branchProductsData, isLoading: branchProductsLoading } = useGetBranchProductsQuery({ productId: resolvedParams.id, pageSize: 100 });
  const branchProducts = branchProductsData?.items || [];

  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.items || [];
  
  const { data: branchesData } = useGetBranchesQuery();
  const branches = branchesData?.items || [];

  const { data: toppingsData } = useGetToppingsQuery();
  const allToppings = toppingsData?.items || [];
  const { data: productToppings, isLoading: productToppingsLoading } = useGetProductToppingsQuery(resolvedParams.id, {
    skip: !resolvedParams.id || resolvedParams.id === "new"
  });

  const [updateProduct] = useUpdateProductMutation();
  const [createBranchProduct] = useCreateBranchProductMutation();
  const [updateBranchProduct] = useUpdateBranchProductMutation();
  const [deleteBranchProduct] = useDeleteBranchProductMutation();
  const [createBranchProductVariant] = useCreateBranchProductVariantMutation();
  const [updateBranchProductVariant] = useUpdateBranchProductVariantMutation();
  const [deleteBranchProductVariant] = useDeleteBranchProductVariantMutation();
  const [createProductTopping] = useCreateProductToppingMutation();
  const [deleteProductTopping] = useDeleteProductToppingMutation();

  const [activeTab, setActiveTab] = useState("base");
  const [branchConfigs, setBranchConfigs] = useState<BranchConfig[]>([]);
  const [activeVariantTabs, setActiveVariantTabs] = useState<Record<string, string>>({});

  const [basePosImage, setBasePosImage] = useState<File | string | null>(null);
  const [baseEcomImages, setBaseEcomImages] = useState<(File | string)[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      price: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (product && branchProductsData && productToppings !== undefined && !isInitialized) {
      reset({
        name: product.productName,
        description: product.productDescription || "",
        categoryId: product.productCategoryId,
        price: product.productPrice ?? 0,
        isActive: !!product.isActive,
      });
      setBasePosImage(product.posImage?.[0] || null);
      setBaseEcomImages(product.ecomImages || []);

      const initialConfigs: BranchConfig[] = branchProducts.map(bp => {
        const bpVariants = bp.variants?.map(v => ({
          id: generateId(),
          originalId: v.branchProductVariantId,
          variantName: v.variantName || v.sizeName || "",
          price: v.price,
          isAvailable: v.isAvailable
        })) || [];

        return {
          branchId: bp.branchId,
          originalId: bp.branchProductId,
          isActive: bp.isAvailable !== undefined ? bp.isAvailable : bp.isActive,
          overridePosImage: bp.overridePosImage?.[0] || null,
          overrideEcomImages: bp.overrideEcomImages || [],
          variants: bpVariants
        };
      });

      if (!isSuper && assignedBranchId && !initialConfigs.find(c => c.branchId === assignedBranchId)) {
        const variantId = generateId();
        initialConfigs.push({
          branchId: assignedBranchId,
          isActive: true,
          overridePosImage: null,
          overrideEcomImages: [],
          variants: [{ id: variantId, variantName: "Normal", price: product.productPrice ?? 0, isAvailable: true }]
        });
      }

      let filteredConfigs = initialConfigs;
      if (!isSuper && assignedBranchId) {
        filteredConfigs = initialConfigs.filter(c => c.branchId === assignedBranchId);
      }

      setBranchConfigs(filteredConfigs);

      const variantTabs: Record<string, string> = {};
      filteredConfigs.forEach(c => {
        if (c.variants.length > 0) {
          variantTabs[c.branchId] = c.variants[0].id;
        }
      });
      setActiveVariantTabs(variantTabs);
      if (!isSuper && assignedBranchId) {
        setActiveTab(`branch-${assignedBranchId}`);
      }
      setSelectedToppingIds(productToppings.map(pt => pt.toppingId));
      setIsInitialized(true);
    }
  }, [product, branchProductsData, productToppings, isInitialized, reset, isSuper, assignedBranchId, branchProducts]);

  useEffect(() => {
    if (!isEditing && product && branchProductsData && productToppings !== undefined && isInitialized) {
      reset({
        name: product.productName,
        description: product.productDescription || "",
        categoryId: product.productCategoryId,
        price: product.productPrice ?? 0,
        isActive: !!product.isActive,
      });
      setBasePosImage(product.posImage?.[0] || null);
      setBaseEcomImages(product.ecomImages || []);

      const initialConfigs: BranchConfig[] = branchProducts.map(bp => {
        const bpVariants = bp.variants?.map(v => ({
          id: generateId(),
          originalId: v.branchProductVariantId,
          variantName: v.variantName || v.sizeName || "",
          price: v.price,
          isAvailable: v.isAvailable
        })) || [];

        return {
          branchId: bp.branchId,
          originalId: bp.branchProductId,
          isActive: bp.isAvailable !== undefined ? bp.isAvailable : bp.isActive,
          overridePosImage: bp.overridePosImage?.[0] || null,
          overrideEcomImages: bp.overrideEcomImages || [],
          variants: bpVariants
        };
      });

      if (!isSuper && assignedBranchId && !initialConfigs.find(c => c.branchId === assignedBranchId)) {
        const variantId = generateId();
        initialConfigs.push({
          branchId: assignedBranchId,
          isActive: true,
          overridePosImage: null,
          overrideEcomImages: [],
          variants: [{ id: variantId, variantName: "Normal", price: product.productPrice ?? 0, isAvailable: true }]
        });
      }

      let filteredConfigs = initialConfigs;
      if (!isSuper && assignedBranchId) {
        filteredConfigs = initialConfigs.filter(c => c.branchId === assignedBranchId);
      }

      setBranchConfigs(filteredConfigs);
      setSelectedToppingIds(productToppings.map(pt => pt.toppingId));
    }
  }, [isEditing, product, branchProductsData, productToppings, isInitialized, reset, isSuper, assignedBranchId, branchProducts]);

  const addBranchConfig = (branchId: string) => {
    const variantId = generateId();
    setBranchConfigs(prev => [
      ...prev,
      {
        branchId,
        isActive: true,
        overridePosImage: null,
        overrideEcomImages: [],
        variants: [{ id: variantId, variantName: "Normal", price: 0, isAvailable: true }]
      }
    ]);
    setActiveVariantTabs(prev => ({ ...prev, [branchId]: variantId }));
    setActiveTab(`branch-${branchId}`);
  };

  const removeBranchConfig = (branchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBranchConfigs(prev => prev.filter(b => b.branchId !== branchId));
    if (activeTab === `branch-${branchId}`) {
      setActiveTab("base");
    }
  };

  const updateBranchConfig = (branchId: string, updates: Partial<BranchConfig>) => {
    setBranchConfigs(prev => prev.map(b => b.branchId === branchId ? { ...b, ...updates } : b));
  };

  const addVariant = (branchId: string) => {
    const branch = branchConfigs.find(b => b.branchId === branchId);
    if (!branch) return;
    const newVariantId = generateId();
    const newVariants = [...branch.variants, { id: newVariantId, variantName: "New Size", price: 0, isAvailable: true }];
    updateBranchConfig(branchId, { variants: newVariants });
    setActiveVariantTabs(prev => ({ ...prev, [branchId]: newVariantId }));
  };

  const updateVariant = (branchId: string, variantId: string, updates: Partial<VariantConfig>) => {
    const branch = branchConfigs.find(b => b.branchId === branchId);
    if (!branch) return;
    const newVariants = branch.variants.map(v => v.id === variantId ? { ...v, ...updates } : v);
    updateBranchConfig(branchId, { variants: newVariants });
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmittingForm(true);
    try {
      if (isSuper) {
        // 1. Update Base Product
        await updateProduct({
          id: resolvedParams.id,
          data: {
            productName: data.name,
            productDescription: data.description,
            productCategoryId: data.categoryId,
            productPrice: Number(data.price),
            isActive: data.isActive,
            posImage: keptUrls(basePosImage),
            ecomImages: keptUrls(baseEcomImages),
            posImageFiles: newFiles(basePosImage),
            ecomImageFiles: newFiles(baseEcomImages),
          }
        }).unwrap();
      }

      // 2. Handle Branch Products
      if (isSuper) {
        // Find deleted branches
        const branchIdsInState = new Set(branchConfigs.map(b => b.branchId));
        const deletedBranches = branchProducts.filter(bp => !branchIdsInState.has(bp.branchId));
        
        for (const db of deletedBranches) {
          await deleteBranchProduct(db.branchProductId).unwrap();
        }
      }

      for (const branchConf of branchConfigs) {
        if (!isSuper && branchConf.branchId !== assignedBranchId) {
          continue;
        }

        if (!branchConf.originalId) {
          // CREATE Branch Product
          await createBranchProduct({
            branchId: branchConf.branchId,
            productId: resolvedParams.id,
            isAvailable: branchConf.isActive,
            overridePosImage: keptUrls(branchConf.overridePosImage),
            overrideEcomImages: keptUrls(branchConf.overrideEcomImages),
            overridePosImageFiles: newFiles(branchConf.overridePosImage),
            overrideEcomImageFiles: newFiles(branchConf.overrideEcomImages),
            variants: branchConf.variants.map(v => ({
              sizeName: v.variantName,
              variantName: v.variantName,
              price: Number(v.price),
              isAvailable: v.isAvailable
            }))
          }).unwrap();
        } else {
          // UPDATE Branch Product
          const originalBranchProduct = branchProducts.find(b => b.branchProductId === branchConf.originalId);
          await updateBranchProduct({
            id: branchConf.originalId,
            data: {
              isAvailable: branchConf.isActive,
              isActive: originalBranchProduct?.isActive ?? true,
              overridePosImage: keptUrls(branchConf.overridePosImage),
              overrideEcomImages: keptUrls(branchConf.overrideEcomImages),
              overridePosImageFiles: newFiles(branchConf.overridePosImage),
              overrideEcomImageFiles: newFiles(branchConf.overrideEcomImages),
            }
          }).unwrap();

          // Compare Variants
          const originalVariants = originalBranchProduct?.variants || [];
          const currentVariantIds = new Set(branchConf.variants.map(v => v.originalId).filter(Boolean));
          
          // Delete removed variants
          const deletedVariants = originalVariants.filter(v => !currentVariantIds.has(v.branchProductVariantId));
          for (const dv of deletedVariants) {
            await deleteBranchProductVariant(dv.branchProductVariantId).unwrap();
          }

          for (const v of branchConf.variants) {
            if (!v.originalId) {
              await createBranchProductVariant({
                branchProductId: branchConf.originalId,
                sizeName: v.variantName,
                price: Number(v.price),
                isAvailable: v.isAvailable
              } as any).unwrap();
            } else {
              await updateBranchProductVariant({
                id: v.originalId,
                data: {
                  sizeName: v.variantName,
                  price: Number(v.price),
                  isAvailable: v.isAvailable,
                  isActive: true
                } as any
              }).unwrap();
            }
          }
        }
      }

      if (isSuper) {
        // Handle Toppings
        const originalToppingIds = new Set(productToppings?.map(pt => pt.toppingId) || []);
        const currentToppingIds = new Set(selectedToppingIds);
        
        const addedToppings = selectedToppingIds.filter(id => !originalToppingIds.has(id));
        const removedToppings = (productToppings || []).filter(pt => !currentToppingIds.has(pt.toppingId));
        
        for (const rt of removedToppings) {
          await deleteProductTopping(rt.productToppingId).unwrap();
        }
        for (const at of addedToppings) {
          await createProductTopping({
            productId: resolvedParams.id,
            toppingId: at,
            isActive: true
          }).unwrap();
        }
      }

      toast.success("Product updated successfully");
      setIsEditing(false); // return to read-only mode after save
    } catch (err) {
      console.error("Failed to update product:", err);
      toast.error("Failed to update product. Check console for details.");
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

  const unconfiguredBranches = branches.filter(b => !branchConfigs.find(c => c.branchId === b.branchId));

  if (productLoading || branchProductsLoading || productToppingsLoading || !isInitialized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <PageHeader title="Product Not Found" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/admin/products")} className="mt-4">Back to Products</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFormDisabled = !canEdit || !isEditing;
  const isBaseFormDisabled = !isSuper || !isEditing;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          className="flex-1"
          title={product.productName}
          description={isEditing ? "Edit product details and pricing" : "Product details and pricing"}
          actions={
            canEdit && !isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <TbEdit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>
            ) : null
          }
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center border-b border-border">
            <TabsList className="bg-transparent h-auto p-0 gap-0 justify-start flex-1">
              <TabsTrigger 
                value="base" 
                className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-body font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary"
              >
                Base
              </TabsTrigger>
              {branchConfigs.map(config => {
                const b = branches.find(br => br.branchId === config.branchId);
                return (
                  <TabsTrigger 
                    key={config.branchId} 
                    value={`branch-${config.branchId}`}
                    className="relative rounded-none bg-transparent border-0 shadow-none px-4 pb-3 pt-2 text-body font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary flex items-center gap-1.5"
                  >
                    {b?.branchName.replace("Caffissimo", "").trim() || "Branch"}
                    {isSuper && isEditing && <X className="h-3 w-3 hover:text-destructive z-10" onClick={(e) => removeBranchConfig(config.branchId, e)} />}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {isSuper && isEditing && unconfiguredBranches.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="mb-1 h-8" disabled={isFormDisabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add a branch variant
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

          <TabsContent value="base" className="mt-6 space-y-6">
            {!isSuper && (
              <div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-body text-muted-foreground flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <span className="font-semibold text-foreground">Base product specifications are read-only.</span> Base catalog details are centrally managed by Super Admins. To configure pricing, images, and availability for your branch, switch to your branch tab above.
                </div>
              </div>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                    <CardDescription>Basic details about the product</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="name">Product Name</Label>
                        <CharacterCounter current={(watch("name") || "").length} max={200} />
                      </div>
                      <Input id="name" maxLength={200} disabled={isBaseFormDisabled} {...register("name")} />
                      {errors.name && <p className="text-body text-destructive">{errors.name.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description">Description</Label>
                        <CharacterCounter current={(watch("description") || "").length} max={1000} />
                      </div>
                      <Textarea id="description" maxLength={1000} disabled={isBaseFormDisabled} rows={4} {...register("description")} />
                      {errors.description && <p className="text-body text-destructive">{errors.description.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select disabled={isBaseFormDisabled} value={watch("categoryId")} onValueChange={(value) => setValue("categoryId", value)}>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat: Category) => (
                            <SelectItem key={cat.productCategoryId} value={cat.productCategoryId}>{cat.categoryName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.categoryId && <p className="text-body text-destructive">{errors.categoryId.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Base Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          className="pl-7"
                          disabled={isBaseFormDisabled}
                          placeholder="e.g. 4.50"
                          {...register("price", { valueAsNumber: true })}
                        />
                      </div>
                      {errors.price && <p className="text-body text-destructive">{errors.price.message as string}</p>}
                    </div>
                     <div className="space-y-2 flex flex-col justify-center mt-4 pt-4 border-t">
                       <Label>Active</Label>
                       <Switch disabled={isBaseFormDisabled} checked={watch("isActive")} onCheckedChange={(val) => setValue("isActive", val)} />
                     </div>
                  </CardContent>
                </Card>

                {/* Toppings Section kept in base */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      Toppings
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isBaseFormDisabled || allToppings.length === selectedToppingIds.length}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Topping
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {allToppings.filter(t => !selectedToppingIds.includes(t.toppingId)).map(t => (
                            <DropdownMenuItem key={t.toppingId} onClick={() => setSelectedToppingIds(prev => [...prev, t.toppingId])}>
                              {t.toppingName}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardTitle>
                    <CardDescription>Select which toppings can be added to this product</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedToppingIds.length === 0 ? (
                      <p className="text-body text-muted-foreground">No toppings assigned.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedToppingIds.map(id => {
                          const topping = allToppings.find(t => t.toppingId === id);
                          if (!topping) return null;
                          return (
                            <Badge key={id} variant="secondary" className="flex items-center gap-1 text-body py-1 px-3">
                              {topping.toppingName}
                              {!isBaseFormDisabled && (
                                <X className="h-3 w-3 cursor-pointer hover:text-destructive ml-1" onClick={() => setSelectedToppingIds(prev => prev.filter(tid => tid !== id))} />
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                    <CardDescription>Upload base product images</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>POS Image (Single)</Label>
                      <ImageUploader disabled={isBaseFormDisabled} multiple={false} value={basePosImage} onChange={(val) => isSuper && setBasePosImage(val as File | string | null)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Ecommerce Images (Multiple)</Label>
                      <ImageUploader disabled={isBaseFormDisabled} multiple={true} value={baseEcomImages} onChange={(val) => isSuper && setBaseEcomImages(val as (File|string)[])} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {branchConfigs.map(branchConf => (
            <TabsContent key={branchConf.branchId} value={`branch-${branchConf.branchId}`} className="mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        Branch Settings
                        <div className="flex items-center gap-2">
                          <Label className="text-body font-normal">Active</Label>
                          <Switch disabled={isFormDisabled} checked={branchConf.isActive} onCheckedChange={(val) => updateBranchConfig(branchConf.branchId, { isActive: val })} />
                        </div>
                      </CardTitle>
                      <CardDescription>Visibility and overrides for this branch</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Override POS Image (Single)</Label>
                        <ImageUploader disabled={isFormDisabled} multiple={false} value={branchConf.overridePosImage} onChange={(val) => canEdit && updateBranchConfig(branchConf.branchId, { overridePosImage: val as File | string | null })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Override Ecommerce Images (Multiple)</Label>
                        <ImageUploader disabled={isFormDisabled} multiple={true} value={branchConf.overrideEcomImages} onChange={(val) => canEdit && updateBranchConfig(branchConf.branchId, { overrideEcomImages: val as (File|string)[] })} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row justify-between items-center pb-2">
                      <div>
                        <CardTitle>Branch Variants</CardTitle>
                        <CardDescription>Configure sizes and prices</CardDescription>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => addVariant(branchConf.branchId)} disabled={isFormDisabled}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {branchConf.variants.length > 0 ? (
                        <Tabs 
                          value={activeVariantTabs[branchConf.branchId]} 
                          onValueChange={(val) => setActiveVariantTabs(prev => ({ ...prev, [branchConf.branchId]: val }))}
                          className="w-full"
                        >
                          <TabsList className="w-full flex justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0 overflow-x-auto">
                            {branchConf.variants.map((v, idx) => (
                              <TabsTrigger key={v.id} value={v.id} className="relative rounded-none bg-transparent border-0 shadow-none px-3 pb-2.5 pt-1.5 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-transparent data-[state=active]:after:bg-primary min-w-[70px]">
                                {v.variantName || `Variant ${idx + 1}`}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          
                          {branchConf.variants.map((v) => (
                            <TabsContent key={v.id} value={v.id} className="pt-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Size / Variant Name</Label>
                                  <Input disabled={isFormDisabled} value={v.variantName} onChange={(e) => updateVariant(branchConf.branchId, v.id, { variantName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Price</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input disabled={isFormDisabled} type="number" step="0.01" className="pl-7" value={v.price} onChange={(e) => updateVariant(branchConf.branchId, v.id, { price: parseFloat(e.target.value) || 0 })} />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between border-t pt-4">
                                <div className="flex items-center gap-2">
                                  <Switch disabled={isFormDisabled} checked={v.isAvailable} onCheckedChange={(val) => updateVariant(branchConf.branchId, v.id, { isAvailable: val })} />
                                  <Label>Available</Label>
                                </div>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    const newVariants = branchConf.variants.filter(varnt => varnt.id !== v.id);
                                    updateBranchConfig(branchConf.branchId, { variants: newVariants });
                                    if (activeVariantTabs[branchConf.branchId] === v.id && newVariants.length > 0) {
                                      setActiveVariantTabs(prev => ({ ...prev, [branchConf.branchId]: newVariants[0].id }));
                                    }
                                  }}
                                  disabled={isFormDisabled || branchConf.variants.length === 1}
                                >
                                  Remove Variant
                                </Button>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : (
                        <p className="text-body text-muted-foreground">No variants added.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <EditBar
          isVisible={isEditing}
          saveButtonType="submit"
          onCancel={() => setIsEditing(false)}
          label="Unsaved changes"
          saveLabel="Save Changes"
          cancelLabel="Cancel"
          isSaving={isSubmittingForm}
        />
      </form>
    </div>
  );
}

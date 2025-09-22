"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { headers } from "next/headers";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon, ImageIcon, XIcon, UploadIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Zod validation schema
const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.number().min(1, "Category is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity must be >= 0"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  cost: z.coerce.number().optional(),
  is_service: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

type Product = {
  id: number;
  name: string;
  category: number;
  description?: string;
  quantity: number;
  price: number;
  cost?: number;
  is_service: boolean;
  created_at: string;
  updated_at: string;
};

type ProductImage = {
  id: number;
  product: number;
  image: string;
  created_at: string;
  updated_at: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | "images" | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [button_clicked, setButtonClicked] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search (1s after typing stops)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch products (with search + pagination)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_products?page=${page}&search=${encodeURIComponent(
        debouncedSearch
      )}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data = await res.json();
      if (res.status === 200) {
        setProducts(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load products");
      }
    } catch {
      toast.error("Couldn't fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page or debouncedSearch changes
  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/get_categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data = await res.json();
      if (res.status === 200) {
        setCategories(data.data || []);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Couldn't fetch categories");
    } finally {
      setLoading(false);
    }
  };

  // Fetch product images
  const fetchProductImages = async (productId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/get_product_images?product__id=${productId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data = await res.json();
      if (res.status === 200) {
        setProductImages(data.data || []);
      } else {
        toast.error(data.error || "Failed to load images");
      }
    } catch (error) {
      toast.error("Couldn't fetch product images");
    }
  };

  // Upload product image
  const uploadProductImage = async (productId: number, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("product", productId.toString());
      formData.append("image", file);

      const res = await fetch(`${BASE_URL}/post_product_image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.status === 201) {
        toast.success("Image uploaded successfully");
        await fetchProductImages(productId);
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Couldn't upload image");
    } finally {
      setUploading(false);
    }
  };

  // Delete product image
  const deleteProductImage = async (imageId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/delete_product_image/${imageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (res.status === 200 || res.status === 204) {
        toast.success("Image deleted successfully");
        if (selected) {
          await fetchProductImages(selected.id);
        }
      } else {
        toast.error("Failed to delete image");
      }
    } catch (error) {
      toast.error("Couldn't delete image");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const handleOpen = async (type: typeof modalType, product?: Product) => {
    setModalType(type);
    setSelected(product || null);
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        description: product.description,
        quantity: product.quantity,
        price: product.price,
        cost: product.cost,
        is_service: product.is_service,
      });
      
      if (type === "images") {
        await fetchProductImages(product.id);
      }
    } else {
      reset({});
    }
  };

  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    reset({});
    setProductImages([]);
    setDragOver(false);
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    if (!selected) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      uploadProductImage(selected.id, files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !e.target.files) return;
    
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      uploadProductImage(selected.id, file);
    }
    
    // Reset the input
    e.target.value = "";
  };

  // Create / Update
  const onSubmit = async (data: ProductFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        let result = await fetch(BASE_URL + "/post_product", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 201) toast.success("created product successfully");
        else toast.error("failed to create product");
      } catch (error) {
        toast.error("couldn't create product");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        let result = await fetch(`${BASE_URL}/update_product/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 200) toast.success("updated product succesfully");
      } catch (error) {
        toast.error("failed to update product");
      } finally {
        setButtonClicked(false);
      }
    }
    await fetchProducts();
    handleClose();
  };

  // Delete
  const handleDelete = async () => {
    if (selected) {
      await fetch(`${BASE_URL}/delete_product/${selected.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      await fetchProducts();
      handleClose();
    }
  };

  // Pagination buttons (max 5, current centered)
  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    if (page <= 2) end = Math.min(5, totalPages);
    if (page >= totalPages - 1) start = Math.max(totalPages - 4, 1);

    return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">Products</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 cursor-pointer shadow-lg py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setPage(1); // reset to page 1 when search changes
            setSearch(e.target.value);
          }}
          className="border px-3 py-2 rounded-lg w-1/3 text-xs focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
        />
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full justify-center items-center">
          <table className="min-w-full border border-gray-300 rounded shadow-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-900">
                <th className="p-2 text-xs px-7">Name</th>
                <th className="p-2 text-xs px-7">Category</th>
                <th className="p-2 text-xs px-7">Quantity</th>
                <th className="p-2 text-xs px-7">Price</th>
                <th className="p-2 text-xs px-7">Service</th>
                <th className="p-2 text-xs px-7">Actions</th>
              </tr>
            </thead>

            {products.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {products?.map((p) => (
                  <tr key={p.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">{p.name}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{p.category}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{p.quantity}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{p.price}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{p.is_service ? "Yes" : "No"}</td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("view", p)}
                      >
                        <EyeIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("edit", p)}
                      >
                        <PencilIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("images", p)}
                      >
                        <ImageIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("delete", p)}
                      >
                        <TrashIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50 text-xs cursor-pointer"
            >
              Prev
            </button>

            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 cursor-pointer border text-xs rounded ${
                  p === page ? "bg-blue-600 text-white" : ""
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50 text-xs cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalType && (
        <div className="shadow-2xl rounded-xl fixed inset-0 bg-black/50 bg-opacity-500 flex items-center justify-center z-50">
          <div className={`bg-gray-50 p-6 rounded-lg relative overflow-y-auto items-center justify-center ${
            modalType === "images" ? "w-3/4 max-w-4xl" : "w-1/2"
          }`}>
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              ×
            </button>

            {modalType === "view" && selected && (
              <div className="flex flex-col justify-center gap-y-4">
                <h2 className="text-lg font-bold mb-4">Product details</h2>
                <p className="text-sm"><strong>Name:</strong> {selected.name}</p>
                <p className="text-sm"><strong>Category:</strong> {selected.category}</p>
                <p className="text-sm"><strong>Description:</strong> {selected.description}</p>
                <p className="text-sm"><strong>Quantity:</strong> {selected.quantity}</p>
                <p className="text-sm"><strong>Price:</strong> {selected.price}</p>
                <p className="text-sm"><strong>Cost:</strong> {selected.cost}</p>
                <p className="text-sm"><strong>Service:</strong> {selected.is_service ? "Yes" : "No"}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full p-2 justify-center items-center">
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Product" : "Edit Product"}
                </h2>

                <div className="flex items-center gap-7">
                  <div className="focus:ring-blue-500">
                    <label className="text-xs">Name</label>
                    <input
                      {...register("name")}
                      placeholder="product name"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="w-[30%]">
                    <label htmlFor="category" className="text-xs">Category</label>
                    <select
                      id="category"
                      {...register("category", { valueAsNumber: true })}
                      className="w-full text-xs border p-2 rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      defaultValue=""
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-xs">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs">Description</label>
                  <textarea
                    {...register("description")}
                    placeholder="description..."
                    rows={5}
                    className="w-full focus:outline-2 text-xs focus:-outline-offset-2 focus:outline-indigo-600 border p-1 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("quantity")}
                      placeholder="quantity"
                      className="w-full text-xs focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 border p-2 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-xs">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="price"
                      {...register("price")}
                      className="w-full border text-xs focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 p-2 rounded-lg"
                    />
                  </div>
                </div>

                <div className="w-[30%]">
                  <label className="text-xs">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cost")}
                    placeholder="cost"
                    className="w-full border text-xs p-2 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" className="cursor-pointer" {...register("is_service")} />
                  <label className="text-xs">is service?</label>
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-900 cursor-pointer"
                >
                  {button_clicked===false?(modalType === "add" ? "Add" : "Update"):"loading..."}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div className="flex flex-col">
                <h2 className="text-md font-bold mb-4">Delete Product</h2>
                <p className="text-sm">
                  Are you sure you want to delete <strong>{selected.name}</strong>?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    {button_clicked===false?"Yes, Delete":"loading..."}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1 text-xs bg-gray-400 text-white rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {modalType === "images" && selected && (
              <div className="flex flex-col space-y-4">
                <h2 className="text-xl font-bold mb-4">Manage Images for {selected.name}</h2>
                
                {/* Upload area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <UploadIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 mb-1">
                    Drag and drop images here, or click to select
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports JPG, PNG, GIF up to 10MB
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {uploading && (
                  <div className="text-xs text-blue-600 text-center">Uploading image...</div>
                )}

                {/* Image gallery */}
                {productImages.length > 0 ? (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2">Product Images</h3>
                    <div className="flex overflow-x-auto space-x-4 pb-4">
                      {productImages.map((image) => (
                        <div key={image.id} className="relative group flex-shrink-0">
                          <img
                            src={image.image}
                            alt={`Product image ${image.id}`}
                            className="h-20 w-20 object-cover rounded border"
                          />
                          <button
                            onClick={() => deleteProductImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XIcon size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center mt-4">No images yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
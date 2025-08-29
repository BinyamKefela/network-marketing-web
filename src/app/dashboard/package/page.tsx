"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ✅ Zod validation schema for Package
const packageSchema = z.object({
  name: z.string().min(2, "Name is required"),
  package_type: z.enum(["product", "service"], "Package type is required"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
});

type PackageFormData = z.infer<typeof packageSchema>;

type Package = {
  id: number;
  name: string;
  package_type: "product" | "service";
  price: number;
  created_at: string;
  updated_at: string;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Package | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

  // 🔎 Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ⏱️ Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  // ✅ Fetch packages
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_packages?page=${page}&search=${encodeURIComponent(
        debouncedSearch
      )}`;
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (res.status === 200) {
        setPackages(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else toast.error(data.error || "Failed to load packages");
    } catch {
      toast.error("Couldn't fetch packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
  });

  const handleOpen = (type: typeof modalType, pkg?: Package) => {
    setModalType(type);
    setSelected(pkg || null);
    if (pkg) reset({ name: pkg.name, package_type: pkg.package_type, price: pkg.price });
    else reset({});
  };
  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    reset({});
  };

  // ✅ Create / Update
  const onSubmit = async (data: PackageFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        const result = await fetch(BASE_URL + "/post_package", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify(data),
        });
        if (result.status === 201) toast.success("Package created successfully");
        else toast.error("Failed to create package");
      } catch {
        toast.error("Couldn't create package");
      } finally { setButtonClicked(false); }
    } else if (modalType === "edit" && selected) {
      try {
        const result = await fetch(`${BASE_URL}/update_package/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify(data),
        });
        if (result.status === 200) toast.success("Package updated successfully");
      } catch {
        toast.error("Failed to update package");
      } finally { setButtonClicked(false); }
    }
    await fetchPackages();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        await fetch(`${BASE_URL}/delete_package/${selected.id}`, { method: "DELETE" });
        toast.success("Package deleted");
      } catch {
        toast.error("Failed to delete package");
      }
      await fetchPackages();
      handleClose();
    }
  };

  // 🔢 Pagination buttons
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
        <h1 className="text-2xl font-bold">Packages</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 shadow-lg py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Package
        </button>
      </div>

      {/* 🔎 Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search packages..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="border px-3 py-2 rounded-lg w-1/3"
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
              <tr className="bg-gray-100 text-center">
                <th className="p-2 px-7">Name</th>
                <th className="p-2 px-7">Type</th>
                <th className="p-2 px-7">Price</th>
                <th className="p-2 px-7">Actions</th>
              </tr>
            </thead>

            {packages.length === 0 ? (
              <tbody>
                <tr><td colSpan={4} className="text-center py-3">No packages...</td></tr>
              </tbody>
            ) : (
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="text-center">
                    <td className="px-7 py-3">{pkg.name}</td>
                    <td className="px-7 py-3">{pkg.package_type}</td>
                    <td className="px-7 py-3">{pkg.price}</td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button onClick={() => handleOpen("view", pkg)}><EyeIcon size={20} /></button>
                      <button onClick={() => handleOpen("edit", pkg)}><PencilIcon size={20} /></button>
                      <button onClick={() => handleOpen("delete", pkg)}><TrashIcon size={20} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* 🔢 Pagination */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            {getPageNumbers().map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 border rounded ${p === page ? "bg-blue-600 text-white" : ""}`}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* ✅ Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative h-[70%] overflow-y-auto">
            <button onClick={handleClose} className="absolute top-5 right-2 text-xl font-bold text-gray-600 hover:text-black">x</button>

            {modalType === "view" && selected && (
              <div className="flex flex-col gap-y-4">
                <h2 className="text-xl font-bold mb-4">Package details</h2>
                <p><strong>Name:</strong> {selected.name}</p>
                <p><strong>Type:</strong> {selected.package_type}</p>
                <p><strong>Price:</strong> {selected.price}</p>
                <p><strong>Created:</strong> {selected.created_at}</p>
                <p><strong>Updated:</strong> {selected.updated_at}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full p-2">
                <h2 className="text-xl font-bold mb-4">{modalType === "add" ? "Add Package" : "Edit Package"}</h2>

                <div>
                  <label className="text-sm">Name</label>
                  <input {...register("name")} className="w-full border p-1 rounded-lg"/>
                  {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="text-sm">Package Type</label>
                  <select {...register("package_type")} className="w-full border p-2 rounded-lg">
                    <option value="">Select type</option>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                  {errors.package_type && <p className="text-red-500 text-sm">{errors.package_type.message}</p>}
                </div>

                <div>
                  <label className="text-sm">Price</label>
                  <input type="number" step="0.01" {...register("price")} className="w-full border p-1 rounded-lg"/>
                  {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                </div>

                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-lg">{button_clicked ? "Loading..." : modalType === "add" ? "Add" : "Update"}</button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div>
                <h2 className="text-xl font-bold mb-4">Delete Package</h2>
                <p>Are you sure you want to delete <strong>{selected.name}</strong>?</p>
                <div className="flex gap-4 mt-4">
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">{button_clicked ? "Loading..." : "Yes, Delete"}</button>
                  <button onClick={handleClose} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

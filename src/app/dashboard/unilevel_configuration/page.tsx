"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { headers } from "next/headers";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ✅ Zod validation schema for UnilevelConfiguration
const unilevelSchema = z.object({
  level: z.coerce.number().min(1, "Level must be at least 1"),
  category: z.number().min(1, "Category is required"),
  percentage: z.coerce.number().min(0, "Percentage must be >= 0").max(100, "Percentage cannot exceed 100"),
});

type UnilevelFormData = z.infer<typeof unilevelSchema>;

type UnilevelConfiguration = {
  id: number;
  level: number;
  category: number;
  category_name: string;
  percentage: number;
  created_at: string;
  updated_at: string;
};

export default function UnilevelConfigurationPage() {
  const [configurations, setConfigurations] = useState<UnilevelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UnilevelConfiguration | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [button_clicked, setButtonClicked] = useState(false);

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

  // Fetch unilevel configurations (with search + pagination)
  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_unilevel_configurations?page=${page}&search=${encodeURIComponent(
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
        setConfigurations(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load unilevel configurations");
      }
    } catch {
      toast.error("Couldn't fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
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
    }
  };

  // Fetch when page or debouncedSearch changes
  useEffect(() => {
    fetchConfigurations();
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnilevelFormData>({
    resolver: zodResolver(unilevelSchema),
  });

  const handleOpen = (type: typeof modalType, config?: UnilevelConfiguration) => {
    setModalType(type);
    setSelected(config || null);
    if (config) {
      reset({
        level: config.level,
        category: config.category,
        percentage: config.percentage,
      });
    } else {
      reset({
        level: 1,
        category: 0,
        percentage: 0,
      });
    }
  };

  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    reset({});
  };

  // ✅ Create / Update
  const onSubmit = async (data: UnilevelFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        let result = await fetch(BASE_URL + "/post_unilevel_configuration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 201) toast.success("Created unilevel configuration successfully");
        else toast.error("Failed to create unilevel configuration");
      } catch (error) {
        toast.error("Couldn't create unilevel configuration");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        let result = await fetch(`${BASE_URL}/update_unilevel_configuration/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 200) toast.success("Updated unilevel configuration successfully");
      } catch (error) {
        toast.error("Failed to update unilevel configuration");
      } finally {
        setButtonClicked(false);
      }
    }
    await fetchConfigurations();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        let result = await fetch(`${BASE_URL}/delete_unilevel_configuration/${selected.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        if (result.status == 200) toast.success("Deleted unilevel configuration successfully");
        else toast.error("Failed to delete unilevel configuration");
      } catch (error) {
        toast.error("Couldn't delete unilevel configuration");
      }
      await fetchConfigurations();
      handleClose();
    }
  };

  // 🔢 Pagination buttons (max 5, current centered)
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
        <h1 className="text-lg font-bold">Unilevel Configurations</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 cursor-pointer shadow-lg py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          + Add Configuration
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search configurations..."
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
              <tr className="bg-gray-100">
                <th className="p-2 text-xs px-7">Level</th>
                <th className="p-2 text-xs px-7">Category</th>
                <th className="p-2 text-xs px-7">Percentage</th>
                <th className="p-2 text-xs px-7">Actions</th>
              </tr>
            </thead>

            {configurations.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {configurations?.map((config) => (
                  <tr key={config.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">Level {config.level}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{config.category_name}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">{config.percentage}%</td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("view", config)}
                      >
                        <EyeIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("edit", config)}
                      >
                        <PencilIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("delete", config)}
                      >
                        <TrashIcon size={15} className="hover:text-indigo-600 cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* 🔢 Pagination controls */}
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

      {/* ✅ Modal */}
      {modalType && (
        <div className="shadow-2xl rounded-xl fixed inset-0 bg-black/50 bg-opacity-500 flex items-center justify-center z-50">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 max-h-screen overflow-y-auto relative">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              x
            </button>

            {modalType === "view" && selected && (
              <div className="grid grid-cols-2 gap-4">
                <h2 className="text-lg font-bold mb-4 col-span-2">Unilevel Configuration Details</h2>
                <p className="text-sm"><strong>Level:</strong> {selected.level}</p>
                <p className="text-sm"><strong>Category:</strong> {selected.category_name}</p>
                <p className="text-sm"><strong>Percentage:</strong> {selected.percentage}%</p>
                <p className="text-sm col-span-2"><strong>Created At:</strong> {new Date(selected.created_at).toLocaleString()}</p>
                <p className="text-sm col-span-2"><strong>Updated At:</strong> {new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Unilevel Configuration" : "Edit Unilevel Configuration"}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs">Level</label>
                    <input
                      type="number"
                      {...register("level")}
                      placeholder="Level"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.level && (
                      <p className="text-red-500 text-xs">{errors.level.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Category</label>
                    <select
                      {...register("category", { valueAsNumber: true })}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value="" selected>Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-xs">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs">Percentage</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("percentage")}
                      placeholder="Percentage"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.percentage && (
                      <p className="text-red-500 text-xs">{errors.percentage.message}</p>
                    )}
                  </div>
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
                <h2 className="text-md font-bold mb-4">Delete Unilevel Configuration</h2>
                <p className="text-sm">
                  Are you sure you want to delete the configuration for Level {selected.level} - {selected.category_name}?
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
          </div>
        </div>
      )}
    </div>
  );
}
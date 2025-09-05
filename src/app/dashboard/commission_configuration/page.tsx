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

// ✅ Zod validation schema for CommissionConfiguration
const commissionSchema = z.object({
  direct_bonus: z.coerce.number().min(0, "Direct bonus must be >= 0"),
  indirect_bonus: z.coerce.number().min(0, "Indirect bonus must be >= 0"),
  rank_achievement: z.coerce.number().min(0, "Rank achievement must be >= 0"),
  unilevel_bonus: z.coerce.number().min(0, "Unilevel bonus must be >= 0"),
  loyality_bonus: z.coerce.number().min(0, "Loyalty bonus must be >= 0"),
  fast_track_bonus: z.coerce.number().min(0, "Fast track bonus must be >= 0"),
  display_bonus: z.coerce.number().min(0, "Display bonus must be >= 0"),
  incentive_bonus: z.coerce.number().min(0, "Incentive bonus must be >= 0"),
  profit_share_bonus: z.coerce.number().min(0, "Profit share bonus must be >= 0"),
});

type CommissionFormData = z.infer<typeof commissionSchema>;

type CommissionConfiguration = {
  id: number;
  direct_bonus: number;
  indirect_bonus: number;
  rank_achievement: number;
  unilevel_bonus: number;
  loyality_bonus: number;
  fast_track_bonus: number;
  display_bonus: number;
  incentive_bonus: number;
  profit_share_bonus: number;
  created_at: string;
  updated_at: string;
};

export default function CommissionConfigurationPage() {
  const [configurations, setConfigurations] = useState<CommissionConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CommissionConfiguration | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
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

  // Fetch commission configurations (with search + pagination)
  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_commission_configurations?page=${page}&search=${encodeURIComponent(
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
        toast.error(data.error || "Failed to load commission configurations");
      }
    } catch {
      toast.error("Couldn't fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page or debouncedSearch changes
  useEffect(() => {
    fetchConfigurations();
  }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommissionFormData>({
    resolver: zodResolver(commissionSchema),
  });

  const handleOpen = (type: typeof modalType, config?: CommissionConfiguration) => {
    setModalType(type);
    setSelected(config || null);
    if (config) {
      reset(config);
    } else {
      reset({});
    }
  };

  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    reset({});
  };

  // ✅ Create / Update
  const onSubmit = async (data: CommissionFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        let result = await fetch(BASE_URL + "/post_commission_configuration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 201) toast.success("Created commission configuration successfully");
        else toast.error("Failed to create commission configuration");
      } catch (error) {
        toast.error("Couldn't create commission configuration");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        let result = await fetch(`${BASE_URL}/update_commission_configuration/${selected.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 200) toast.success("Updated commission configuration successfully");
      } catch (error) {
        toast.error("Failed to update commission configuration");
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
        let result = await fetch(`${BASE_URL}/delete_commission_configuration/${selected.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        if (result.status == 200) toast.success("Deleted commission configuration successfully");
        else toast.error("Failed to delete commission configuration");
      } catch (error) {
        toast.error("Couldn't delete commission configuration");
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
        <h1 className="text-lg font-bold">Commission Configurations</h1>
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
                <th className="p-2 text-xs px-7">Direct Bonus</th>
                <th className="p-2 text-xs px-7">Indirect Bonus</th>
                <th className="p-2 text-xs px-7">Rank Achievement</th>
                <th className="p-2 text-xs px-7">Unilevel Bonus</th>
                <th className="p-2 text-xs px-7">Loyalty Bonus</th>
                <th className="p-2 text-xs px-7">Actions</th>
              </tr>
            </thead>

            {configurations.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {configurations?.map((config) => (
                  <tr key={config.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">${config.direct_bonus}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">${config.indirect_bonus}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">${config.rank_achievement}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">${config.unilevel_bonus}</td>
                    <td className="px-7 py-3 text-xs text-gray-500">${config.loyality_bonus}</td>
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
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative overflow-y-auto">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              x
            </button>

            {modalType === "view" && selected && (
              <div className="grid grid-cols-2 gap-4">
                <h2 className="text-lg font-bold mb-4 col-span-2">Commission Configuration Details</h2>
                <p className="text-sm"><strong>Direct Bonus:</strong> ${selected.direct_bonus}</p>
                <p className="text-sm"><strong>Indirect Bonus:</strong> ${selected.indirect_bonus}</p>
                <p className="text-sm"><strong>Rank Achievement:</strong> ${selected.rank_achievement}</p>
                <p className="text-sm"><strong>Unilevel Bonus:</strong> ${selected.unilevel_bonus}</p>
                <p className="text-sm"><strong>Loyalty Bonus:</strong> ${selected.loyality_bonus}</p>
                <p className="text-sm"><strong>Fast Track Bonus:</strong> ${selected.fast_track_bonus}</p>
                <p className="text-sm"><strong>Display Bonus:</strong> ${selected.display_bonus}</p>
                <p className="text-sm"><strong>Incentive Bonus:</strong> ${selected.incentive_bonus}</p>
                <p className="text-sm"><strong>Profit Share Bonus:</strong> ${selected.profit_share_bonus}</p>
                <p className="text-sm col-span-2"><strong>Created At:</strong> {new Date(selected.created_at).toLocaleString()}</p>
                <p className="text-sm col-span-2"><strong>Updated At:</strong> {new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Commission Configuration" : "Edit Commission Configuration"}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs">Direct Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("direct_bonus")}
                      placeholder="Direct bonus"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.direct_bonus && (
                      <p className="text-red-500 text-xs">{errors.direct_bonus.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Indirect Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("indirect_bonus")}
                      placeholder="Indirect bonus"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.indirect_bonus && (
                      <p className="text-red-500 text-xs">{errors.indirect_bonus.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Rank Achievement</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("rank_achievement")}
                      placeholder="Rank achievement"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.rank_achievement && (
                      <p className="text-red-500 text-xs">{errors.rank_achievement.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Unilevel Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("unilevel_bonus")}
                      placeholder="Unilevel bonus"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.unilevel_bonus && (
                      <p className="text-red-500 text-xs">{errors.unilevel_bonus.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Loyalty Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("loyality_bonus")}
                      placeholder="Loyalty bonus"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.loyality_bonus && (
                      <p className="text-red-500 text-xs">{errors.loyality_bonus.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Fast Track Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("fast_track_bonus")}
                      placeholder="Fast track bonus"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.fast_track_bonus && (
                      <p className="text-red-500 text-xs">{errors.fast_track_bonus.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Display Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("display_bonus")}
                      placeholder="Display bonus"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.display_bonus && (
                      <p className="text-red-500 text-xs">{errors.display_bonus.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Incentive Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("incentive_bonus")}
                      placeholder="Incentive bonus"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.incentive_bonus && (
                      <p className="text-red-500 text-xs">{errors.incentive_bonus.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Profit Share Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("profit_share_bonus")}
                      placeholder="Profit share bonus"
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.profit_share_bonus && (
                      <p className="text-red-500 text-xs">{errors.profit_share_bonus.message}</p>
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
                <h2 className="text-md font-bold mb-4">Delete Commission Configuration</h2>
                <p className="text-sm">
                  Are you sure you want to delete this commission configuration?
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
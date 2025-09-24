"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ✅ Schema
const mlmSettingSchema = z.object({
  max_level: z.coerce.number().min(1, "Must be at least 1"),
  min_withdrawal_amount: z.coerce.number().min(0.01, "Must be at least 0.01"),
  payout_frequency: z.coerce.number().min(1, "Must be at least 1").optional().nullable(),
});

type MlmSettingFormData = z.infer<typeof mlmSettingSchema>;

type MlmSetting = {
  id: number;
  max_level: number;
  min_withdrawal_amount: number;
  payout_frequency: number | null;
  created_at: string;
  updated_at: string;
};

export default function MlmSettingsPage() {
  const [settings, setSettings] = useState<MlmSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MlmSetting | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

  // Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch MLM settings
  const fetchMlmSettings = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_mlm_settings?page=${page}&search=${encodeURIComponent(
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
        setSettings(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load MLM settings");
      }
    } catch {
      toast.error("Couldn't fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMlmSettings();
  }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MlmSettingFormData>({
    resolver: zodResolver(mlmSettingSchema) as any,
  });

  const handleOpen = (type: typeof modalType, setting?: MlmSetting) => {
    setModalType(type);
    setSelected(setting || null);
    if (setting) {
      reset({
        max_level: setting.max_level,
        min_withdrawal_amount: setting.min_withdrawal_amount,
        payout_frequency: setting.payout_frequency || undefined,
      });
    } else {
      reset({
        max_level: 5,
        min_withdrawal_amount: 10,
        payout_frequency: 30,
      });
    }
  };

  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    reset({});
  };

  // ✅ Create / Update
  const onSubmit = async (data: MlmSettingFormData) => {
    setButtonClicked(true);
    
    // Prepare the data to send (handle null/undefined payout_frequency)
    const submitData = {
      ...data,
      payout_frequency: data.payout_frequency || null
    };
    
    if (modalType === "add") {
      try {
        let result = await fetch(BASE_URL + "/post_mlm_setting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(submitData),
        });
        if (result.status == 201)
          toast.success("Created MLM setting successfully");
        else toast.error("Failed to create MLM setting");
      } catch {
        toast.error("Couldn't create MLM setting");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        let result = await fetch(
          `${BASE_URL}/update_mlm_setting/${selected.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(submitData),
          }
        );
        if (result.status == 200)
          toast.success("Updated MLM setting successfully");
      } catch {
        toast.error("Failed to update MLM setting");
      } finally {
        setButtonClicked(false);
      }
    }
    await fetchMlmSettings();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        await fetch(`${BASE_URL}/delete_mlm_setting/${selected.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        toast.success("MLM setting deleted");
      } catch {
        toast.error("Failed to delete MLM setting");
      }
      await fetchMlmSettings();
      handleClose();
    }
  };

  // 🔢 Pagination
  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    if (page <= 2) end = Math.min(5, totalPages);
    if (page >= totalPages - 1) start = Math.max(totalPages - 4, 1);

    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, i) => start + i
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">MLM Settings</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 cursor-pointer shadow-lg py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          + Add MLM Setting
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search MLM settings..."
          value={search}
          onChange={(e) => {
            setPage(1);
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
                <th className="p-2 text-xs px-7">Max Level</th>
                <th className="p-2 text-xs px-7">Min Withdrawal Amount</th>
                <th className="p-2 text-xs px-7">Payout Frequency (Days)</th>
                <th className="p-2 text-xs px-7">Created At</th>
                <th className="p-2 text-xs px-7">Updated At</th>
                <th className="p-2 text-xs px-7">Actions</th>
              </tr>
            </thead>

            {settings.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {settings?.map((s) => (
                  <tr key={s.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.max_level}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.min_withdrawal_amount}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.payout_frequency || "N/A"}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("view", s)}
                      >
                        <EyeIcon
                          size={15}
                          className="hover:text-indigo-600 cursor-pointer"
                        />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("edit", s)}
                      >
                        <PencilIcon
                          size={15}
                          className="hover:text-indigo-600 cursor-pointer"
                        />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("delete", s)}
                      >
                        <TrashIcon
                          size={15}
                          className="hover:text-indigo-600 cursor-pointer"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {/* Pagination */}
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
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative overflow-y-auto items-center justify-center">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              ×
            </button>

            {modalType === "view" && selected && (
              <div className="flex flex-col justify-center gap-y-4">
                <h2 className="text-lg font-bold mb-4">MLM Setting Details</h2>
                <p className="text-sm"><strong>ID:</strong> {selected.id}</p>
                <p className="text-sm"><strong>Max Level:</strong> {selected.max_level}</p>
                <p className="text-sm"><strong>Min Withdrawal Amount:</strong> {selected.min_withdrawal_amount}</p>
                <p className="text-sm"><strong>Payout Frequency:</strong> {selected.payout_frequency || "N/A"} days</p>
                <p className="text-sm"><strong>Created At:</strong> {new Date(selected.created_at).toLocaleString()}</p>
                <p className="text-sm"><strong>Updated At:</strong> {new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 w-full p-2 justify-center items-center"
              >
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add MLM Setting" : "Edit MLM Setting"}
                </h2>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs">Max Level</label>
                    <input
                      type="number"
                      {...register("max_level")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.max_level && (
                      <p className="text-red-500 text-xs">{errors.max_level.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Min Withdrawal Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("min_withdrawal_amount")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.min_withdrawal_amount && (
                      <p className="text-red-500 text-xs">{errors.min_withdrawal_amount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Payout Frequency (Days) - Optional</label>
                    <input
                      type="number"
                      {...register("payout_frequency")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.payout_frequency && (
                      <p className="text-red-500 text-xs">{errors.payout_frequency.message}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-900 cursor-pointer"
                >
                  {button_clicked === false
                    ? modalType === "add"
                      ? "Add"
                      : "Update"
                    : "Loading..."}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div className="flex flex-col">
                <h2 className="text-md font-bold mb-4">Delete MLM Setting</h2>
                <p className="text-sm">
                  Are you sure you want to delete the MLM setting with{" "}
                  <strong>{selected.max_level}</strong> max levels and{" "}
                  <strong>{selected.min_withdrawal_amount}</strong> minimum withdrawal amount?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    {button_clicked === false ? "Yes, Delete" : "Loading..."}
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
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
const configurationSchema = z.object({
  investment_amount: z.coerce.number().min(0, "Required"),
  housing_or_car_investment: z.coerce.number().min(0, "Required"),
  sacco: z.coerce.number().min(0, "Required"),
  company_revenue_product_percentage: z.coerce.number().min(0).max(100),
  company_revenue_product: z.coerce.number().min(0, "Required"),
  product_disrtribution_reward_percentage: z.coerce.number().min(0, "Required"),
  product_distribution_reward: z.coerce.number().min(0, "Required"),
  company_revenue_training_percentage: z.coerce.number().min(0, "Required"),
  company_revenue_training: z.coerce.number().min(0, "Required"),
  training_distribution_reward_percentage: z.coerce.number().min(0, "Required"),
  training_distribution_reward: z.coerce.number().min(0, "Required"),
  service_charge: z.coerce.number().min(0, "Required"),
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

type Configuration = {
  id: number;
  investment_amount: number;
  housing_or_car_investment: number;
  sacco: number;
  company_revenue_product_percentage: number;
  company_revenue_product: number;
  product_disrtribution_reward_percentage: number;
  product_distribution_reward: number;
  company_revenue_training_percentage: number;
  company_revenue_training: number;
  training_distribution_reward_percentage: number;
  training_distribution_reward: number;
  service_charge: number;
  created_at: string;
  updated_at: string;
};

export default function ConfigurationPage() {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Configuration | null>(null);
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

  // Fetch configurations
  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_configurations?page=${page}&search=${encodeURIComponent(
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
        toast.error(data.error || "Failed to load configurations");
      }
    } catch {
      toast.error("Couldn't fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
  });

  const handleOpen = (type: typeof modalType, config?: Configuration) => {
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
  const onSubmit = async (data: ConfigurationFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        let result = await fetch(BASE_URL + "/post_configuration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 201)
          toast.success("created configuration successfully");
        else toast.error("failed to create configuration");
      } catch {
        toast.error("couldn't create configuration");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        let result = await fetch(
          `${BASE_URL}/update_configuration/${selected.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify(data),
          }
        );
        if (result.status == 200)
          toast.success("updated configuration succesfully");
      } catch {
        toast.error("failed to update configuration");
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
      await fetch(`${BASE_URL}/delete_configuration/${selected.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      await fetchConfigurations();
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
        <h1 className="text-lg font-bold">Configurations</h1>
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
                <th className="p-2 text-xs px-7">Investment</th>
                <th className="p-2 text-xs px-7">Housing/Car</th>
                <th className="p-2 text-xs px-7">Sacco</th>
                <th className="p-2 text-xs px-7">Product %</th>
                <th className="p-2 text-xs px-7">Training %</th>
                <th className="p-2 text-xs px-7">Service Charge</th>
                <th className="p-2 text-xs px-7">Actions</th>
              </tr>
            </thead>

            {configurations.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {configurations?.map((c) => (
                  <tr key={c.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {c.investment_amount}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {c.housing_or_car_investment}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {c.sacco}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {c.company_revenue_product_percentage}%
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {c.company_revenue_training_percentage}%
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {c.service_charge}
                    </td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("view", c)}
                      >
                        <EyeIcon
                          size={15}
                          className="hover:text-indigo-600 cursor-pointer"
                        />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("edit", c)}
                      >
                        <PencilIcon
                          size={15}
                          className="hover:text-indigo-600 cursor-pointer"
                        />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("delete", c)}
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
          <div className="bg-gray-50 p-6 rounded-lg w-3/4 max-h-screen overflow-y-auto relative">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              ×
            </button>

            {modalType === "view" && selected && (
              <div className="grid grid-cols-2 gap-4">
                <h2 className="text-lg font-bold mb-4 col-span-2">Configuration Details</h2>
                {Object.entries(selected)
                  .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-xs font-semibold capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm">
                        {typeof value === 'number' 
                          ? key.includes('percentage') 
                            ? `${value}%` 
                            : value 
                          : value}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 w-full p-2"
              >
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Configuration" : "Edit Configuration"}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs">Investment Amount</label>
                    <input
                      placeholder="Investment amount"
                      type="number"
                      step="0.01"
                      {...register("investment_amount")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.investment_amount && (
                      <p className="text-red-500 text-xs">
                        {errors.investment_amount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Housing or Car Investment</label>
                    <input
                      placeholder="Housing or car investment"
                      type="number"
                      step="0.01"
                      {...register("housing_or_car_investment")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.housing_or_car_investment && (
                      <p className="text-red-500 text-xs">
                        {errors.housing_or_car_investment.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Sacco</label>
                    <input
                      placeholder="SACCO"
                      type="number"
                      step="0.01"
                      {...register("sacco")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.sacco && (
                      <p className="text-red-500 text-xs">
                        {errors.sacco.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Company Revenue Product %</label>
                    <input
                      placeholder="Company revenue product %"
                      type="number"
                      step="0.01"
                      {...register("company_revenue_product_percentage")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.company_revenue_product_percentage && (
                      <p className="text-red-500 text-xs">
                        {errors.company_revenue_product_percentage.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Company Revenue Product</label>
                    <input
                      placeholder="Company revenue product"
                      type="number"
                      step="0.01"
                      {...register("company_revenue_product")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.company_revenue_product && (
                      <p className="text-red-500 text-xs">
                        {errors.company_revenue_product.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Product Distribution Reward %</label>
                    <input
                      placeholder="Product distribution reward %"
                      type="number"
                      step="0.01"
                      {...register("product_disrtribution_reward_percentage")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.product_disrtribution_reward_percentage && (
                      <p className="text-red-500 text-xs">
                        {errors.product_disrtribution_reward_percentage.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Product Distribution Reward</label>
                    <input
                      placeholder="Product distribution reward"
                      type="number"
                      step="0.01"
                      {...register("product_distribution_reward")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.product_distribution_reward && (
                      <p className="text-red-500 text-xs">
                        {errors.product_distribution_reward.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Company Revenue Training %</label>
                    <input
                      placeholder="Company revenue training %"
                      type="number"
                      step="0.01"
                      {...register("company_revenue_training_percentage")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.company_revenue_training_percentage && (
                      <p className="text-red-500 text-xs">
                        {errors.company_revenue_training_percentage.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Company Revenue Training</label>
                    <input
                      placeholder="Company revenue training"
                      type="number"
                      step="0.01"
                      {...register("company_revenue_training")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.company_revenue_training && (
                      <p className="text-red-500 text-xs">
                        {errors.company_revenue_training.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Training Distribution Reward %</label>
                    <input
                      placeholder="Training distribution reward %"
                      type="number"
                      step="0.01"
                      {...register("training_distribution_reward_percentage")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.training_distribution_reward_percentage && (
                      <p className="text-red-500 text-xs">
                        {errors.training_distribution_reward_percentage.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Training Distribution Reward</label>
                    <input
                      placeholder="Training distribution reward"
                      type="number"
                      step="0.01"
                      {...register("training_distribution_reward")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.training_distribution_reward && (
                      <p className="text-red-500 text-xs">
                        {errors.training_distribution_reward.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Service Charge</label>
                    <input
                      placeholder="Service charge"
                      type="number"
                      step="0.01"
                      {...register("service_charge")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.service_charge && (
                      <p className="text-red-500 text-xs">
                        {errors.service_charge.message}
                      </p>
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
                    : "loading..."}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div className="flex flex-col">
                <h2 className="text-md font-bold mb-4">Delete Configuration</h2>
                <p className="text-sm">
                  Are you sure you want to delete configuration{" "}
                  <strong>{selected.id}</strong>?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded"
                  >
                    {button_clicked === false ? "Yes, Delete" : "loading..."}
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
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
const walletTransactionSchema = z.object({
  user: z.coerce.number().min(1, "User is required"),
  amount: z.coerce.number().min(0.01, "Must be at least 0.01"),
  type: z.enum(['credit', 'debit'], {
    required_error: "Type is required",
  }),
  reference: z.coerce.number().optional().nullable(),
});

type WalletTransactionFormData = z.infer<typeof walletTransactionSchema>;

type WalletTransaction = {
  id: number;
  user: { id: number; username: string };
  amount: number;
  type: string;
  reference: { id: number; sale: { product: { name: string } } } | null;
  created_at: string;
  updated_at: string;
};

type User = {
  id: number;
  username: string;
};

type Commission = {
  id: number;
  sale: { product: { name: string } };
};

export default function WalletTransactionsPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WalletTransaction | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);
  
  // Options for dropdowns
  const [users, setUsers] = useState<User[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  // Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch wallet transactions
  const fetchWalletTransactions = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_wallet_transactions?page=${page}&search=${encodeURIComponent(
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
        setTransactions(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load wallet transactions");
      }
    } catch {
      toast.error("Couldn't fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch options for dropdowns
  const fetchOptions = async () => {
    try {
      const [usersRes, commissionsRes] = await Promise.all([
        fetch(`${BASE_URL}/get_users`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }),
        fetch(`${BASE_URL}/get_commissions`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }),
      ]);

      const usersData = await usersRes.json();
      const commissionsData = await commissionsRes.json();

      setUsers(usersData.data || usersData);
      setCommissions(commissionsData.data || commissionsData);
    } catch (error) {
      toast.error("Failed to fetch options");
    }
  };

  useEffect(() => {
    fetchWalletTransactions();
    fetchOptions();
  }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WalletTransactionFormData>({
    resolver: zodResolver(walletTransactionSchema),
  });

  const handleOpen = (type: typeof modalType, transaction?: WalletTransaction) => {
    setModalType(type);
    setSelected(transaction || null);
    if (transaction) {
      reset({
        user: transaction.user.id,
        amount: transaction.amount,
        type: transaction.type as 'credit' | 'debit',
        reference: transaction.reference?.id || null,
      });
    } else {
      reset({
        user: 0,
        amount: 0,
        type: 'credit',
        reference: null,
      });
    }
  };

  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    reset({});
  };

  // ✅ Create / Update
  const onSubmit = async (data: WalletTransactionFormData) => {
    setButtonClicked(true);
    
    // Prepare the data to send (handle null reference)
    const submitData = {
      ...data,
      reference: data.reference || null
    };
    
    if (modalType === "add") {
      try {
        let result = await fetch(BASE_URL + "/post_wallet_transaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(submitData),
        });
        if (result.status == 201)
          toast.success("Created wallet transaction successfully");
        else toast.error("Failed to create wallet transaction");
      } catch {
        toast.error("Couldn't create wallet transaction");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        let result = await fetch(
          `${BASE_URL}/update_wallet_transaction/${selected.id}`,
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
          toast.success("Updated wallet transaction successfully");
      } catch {
        toast.error("Failed to update wallet transaction");
      } finally {
        setButtonClicked(false);
      }
    }
    await fetchWalletTransactions();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        await fetch(`${BASE_URL}/delete_wallet_transaction/${selected.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        toast.success("Wallet transaction deleted");
      } catch {
        toast.error("Failed to delete wallet transaction");
      }
      await fetchWalletTransactions();
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
        <h1 className="text-lg font-bold">Wallet Transactions</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 cursor-pointer shadow-lg py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          + Add Wallet Transaction
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search wallet transactions..."
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
                <th className="p-2 text-xs px-7">User</th>
                <th className="p-2 text-xs px-7">Amount</th>
                <th className="p-2 text-xs px-7">Type</th>
                <th className="p-2 text-xs px-7">Reference</th>
                <th className="p-2 text-xs px-7">Created At</th>
                <th className="p-2 text-xs px-7">Updated At</th>
                <th className="p-2 text-xs px-7">Actions</th>
              </tr>
            </thead>

            {transactions.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {transactions?.map((t) => (
                  <tr key={t.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {t.user?.username}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {t.amount}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        t.type === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {t.reference 
                        ? `Commission #${t.reference.id} (${t.reference.sale?.product?.name})` 
                        : 'N/A'}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {new Date(t.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-7 py-3 flex justify-center gap-2">
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("view", t)}
                      >
                        <EyeIcon
                          size={15}
                          className="hover:text-indigo-600 cursor-pointer"
                        />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("edit", t)}
                      >
                        <PencilIcon
                          size={15}
                          className="hover:text-indigo-600 cursor-pointer"
                        />
                      </button>
                      <button
                        className="text-xs rounded"
                        onClick={() => handleOpen("delete", t)}
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
                <h2 className="text-lg font-bold mb-4">Wallet Transaction Details</h2>
                <p className="text-sm"><strong>ID:</strong> {selected.id}</p>
                <p className="text-sm"><strong>User:</strong> {selected.user?.username}</p>
                <p className="text-sm"><strong>Amount:</strong> {selected.amount}</p>
                <p className="text-sm"><strong>Type:</strong> {selected.type}</p>
                <p className="text-sm"><strong>Reference:</strong> {selected.reference 
                  ? `Commission #${selected.reference.id} (${selected.reference.sale?.product?.name})` 
                  : 'N/A'}</p>
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
                  {modalType === "add" ? "Add Wallet Transaction" : "Edit Wallet Transaction"}
                </h2>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs">User</label>
                    <select
                      {...register("user")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value={0}>Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                    {errors.user && (
                      <p className="text-red-500 text-xs">{errors.user.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("amount")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-xs">{errors.amount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Type</label>
                    <select
                      {...register("type")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </select>
                    {errors.type && (
                      <p className="text-red-500 text-xs">{errors.type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Reference (Commission)</label>
                    <select
                      {...register("reference")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value="">Select Commission (Optional)</option>
                      {commissions.map((commission) => (
                        <option key={commission.id} value={commission.id}>
                          Commission #{commission.id} ({commission.sale?.product?.name})
                        </option>
                      ))}
                    </select>
                    {errors.reference && (
                      <p className="text-red-500 text-xs">{errors.reference.message}</p>
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
                <h2 className="text-md font-bold mb-4">Delete Wallet Transaction</h2>
                <p className="text-sm">
                  Are you sure you want to delete the wallet transaction for user{" "}
                  <strong>{selected.user?.username}</strong> with amount{" "}
                  <strong>{selected.amount}</strong> ({selected.type})?
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
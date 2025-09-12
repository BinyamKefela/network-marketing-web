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
const saleSchema = z.object({
  product: z.coerce.number().min(1, "Product is required"),
  package: z.coerce.number().min(1, "Package is required"),
  seller: z.coerce.number().min(1, "Seller is required"),
  buyer: z.coerce.number().min(1, "Buyer is required"),
  quantity: z.coerce.number().min(0.01, "Must be at least 0.01"),
  price: z.coerce.number().min(0.01, "Must be at least 0.01"),
  sub_total: z.coerce.number().min(0.01, "Must be at least 0.01"),
  payment_date: z.string().min(1, "Payment date is required"),
  status: z.enum(['commision recorded', 'not recorded'], {
    required_error: "Status is required",
  }),
});

type SaleFormData = z.infer<typeof saleSchema>;

type Sale = {
  id: number;
  product: { id: number; name: string };
  package: { id: number; name: string };
  seller: { id: number; username: string };
  buyer: { id: number; username: string };
  quantity: number;
  price: number;
  sub_total: number;
  payment_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: number;
  name: string;
};

type Package = {
  id: number;
  name: string;
};

type User = {
  id: number;
  username: string;
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);
  
  // Options for dropdowns
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Search + Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch sales
  const fetchSales = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_sales?page=${page}&search=${encodeURIComponent(
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
        setSales(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load sales");
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
      const [productsRes, packagesRes, usersRes] = await Promise.all([
        fetch(`${BASE_URL}/get_products`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }),
        fetch(`${BASE_URL}/get_packages`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }),
        fetch(`${BASE_URL}/get_users`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }),
      ]);

      const productsData = await productsRes.json();
      const packagesData = await packagesRes.json();
      const usersData = await usersRes.json();

      setProducts(productsData.data || productsData);
      setPackages(packagesData.data || packagesData);
      setUsers(usersData.data || usersData);
    } catch (error) {
      toast.error("Failed to fetch options");
    }
  };

  useEffect(() => {
    fetchSales();
    fetchOptions();
  }, [page, debouncedSearch]);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
  });

  // Calculate sub_total when quantity or price changes
  const quantity = watch("quantity");
  const price = watch("price");
  
  useEffect(() => {
    const calculatedSubTotal = Number(quantity) * Number(price);
    if (!isNaN(calculatedSubTotal)) {
      setValue("sub_total", calculatedSubTotal);
    }
  }, [quantity, price, setValue]);

  const handleOpen = (type: typeof modalType, sale?: Sale) => {
    setModalType(type);
    setSelected(sale || null);
    if (sale) {
      reset({
        product: sale.product.id,
        package: sale.package.id,
        seller: sale.seller.id,
        buyer: sale.buyer.id,
        quantity: sale.quantity,
        price: sale.price,
        sub_total: sale.sub_total,
        payment_date: sale.payment_date.split('T')[0], // Format date for input
        status: sale.status as 'commision recorded' | 'not recorded',
      });
    } else {
      reset({
        product: 0,
        package: 0,
        seller: 0,
        buyer: 0,
        quantity: 0,
        price: 0,
        sub_total: 0,
        payment_date: new Date().toISOString().split('T')[0],
        status: 'not recorded',
      });
    }
  };

  const handleClose = () => {
    setModalType(null);
    setSelected(null);
    reset({});
  };

  // ✅ Create / Update
  const onSubmit = async (data: SaleFormData) => {
    setButtonClicked(true);
    if (modalType === "add") {
      try {
        let result = await fetch(BASE_URL + "/post_sale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(data),
        });
        if (result.status == 201)
          toast.success("Created sale successfully");
        else toast.error("Failed to create sale");
      } catch {
        toast.error("Couldn't create sale");
      } finally {
        setButtonClicked(false);
      }
    } else if (modalType === "edit" && selected) {
      try {
        let result = await fetch(
          `${BASE_URL}/update_sale/${selected.id}`,
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
          toast.success("Updated sale successfully");
      } catch {
        toast.error("Failed to update sale");
      } finally {
        setButtonClicked(false);
      }
    }
    await fetchSales();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      try {
        await fetch(`${BASE_URL}/delete_sale/${selected.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        toast.success("Sale deleted");
      } catch {
        toast.error("Failed to delete sale");
      }
      await fetchSales();
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
        <h1 className="text-lg font-bold">Sales</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 cursor-pointer shadow-lg py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
        >
          + Add Sale
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex justify-between items-center gap-3">
        <input
          type="text"
          placeholder="Search sales..."
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
                <th className="p-2 text-xs px-7">Product</th>
                <th className="p-2 text-xs px-7">Package</th>
                <th className="p-2 text-xs px-7">Seller</th>
                <th className="p-2 text-xs px-7">Buyer</th>
                <th className="p-2 text-xs px-7">Quantity</th>
                <th className="p-2 text-xs px-7">Price</th>
                <th className="p-2 text-xs px-7">Sub Total</th>
                <th className="p-2 text-xs px-7">Payment Date</th>
                <th className="p-2 text-xs px-7">Status</th>
                
                <th className="p-2 text-xs px-7">Actions</th>
              </tr>
            </thead>

            {sales.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={12} className="text-center text-xs py-3 px-7">
                    No items...
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {sales?.map((s) => (
                  <tr key={s.id} className="text-center">
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.product?.name || "N/A"}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.package?.name || "N/A"}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.seller?.email || "N/A"}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.buyer?.email || "N/A"}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.quantity}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.price}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.sub_total}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {new Date(s.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-7 py-3 text-xs text-gray-500">
                      {s.status}
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
          <div className="bg-gray-50 p-6 rounded-lg w-4/5 max-h-screen overflow-y-auto relative">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 cursor-pointer hover:text-black text-xl right-2 text-gray-600"
            >
              ×
            </button>

            {modalType === "view" && selected && (
              <div className="grid grid-cols-2 gap-4">
                <h2 className="text-lg font-bold mb-4 col-span-2">Sale Details</h2>
                <p className="text-sm"><strong>ID:</strong> {selected.id}</p>
                <p className="text-sm"><strong>Product:</strong> {selected.product?.name || "N/A"}</p>
                <p className="text-sm"><strong>Package:</strong> {selected.package?.name || "N/A"}</p>
                <p className="text-sm"><strong>Seller:</strong> {selected.seller?.username}</p>
                <p className="text-sm"><strong>Buyer:</strong> {selected.buyer?.username}</p>
                <p className="text-sm"><strong>Quantity:</strong> {selected.quantity}</p>
                <p className="text-sm"><strong>Price:</strong> {selected.price}</p>
                <p className="text-sm"><strong>Sub Total:</strong> {selected.sub_total}</p>
                <p className="text-sm"><strong>Payment Date:</strong> {new Date(selected.payment_date).toLocaleDateString()}</p>
                <p className="text-sm"><strong>Status:</strong> {selected.status}</p>
                <p className="text-sm col-span-2"><strong>Created At:</strong> {new Date(selected.created_at).toLocaleString()}</p>
                <p className="text-sm col-span-2"><strong>Updated At:</strong> {new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 w-full p-2 justify-center items-center"
              >
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Sale" : "Edit Sale"}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs">Product</label>
                    <select
                      {...register("product")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value={0}>Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    {errors.product && (
                      <p className="text-red-500 text-xs">{errors.product.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Package</label>
                    <select
                      {...register("package")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value={0}>Select Package</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                    {errors.package && (
                      <p className="text-red-500 text-xs">{errors.package.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Seller</label>
                    <select
                      {...register("seller")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value={0}>Select Seller</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                    {errors.seller && (
                      <p className="text-red-500 text-xs">{errors.seller.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Buyer</label>
                    <select
                      {...register("buyer")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value={0}>Select Buyer</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                    {errors.buyer && (
                      <p className="text-red-500 text-xs">{errors.buyer.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("quantity")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.quantity && (
                      <p className="text-red-500 text-xs">{errors.quantity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-xs">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Sub Total</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      {...register("sub_total")}
                      className="w-full border p-2 text-xs rounded-lg bg-gray-100 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.sub_total && (
                      <p className="text-red-500 text-xs">{errors.sub_total.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Payment Date</label>
                    <input
                      type="date"
                      {...register("payment_date")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                    {errors.payment_date && (
                      <p className="text-red-500 text-xs">{errors.payment_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs">Status</label>
                    <select
                      {...register("status")}
                      className="w-full border p-2 text-xs rounded-lg focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    >
                      <option value="commision recorded">Commission Recorded</option>
                      <option value="not recorded">Not Recorded</option>
                    </select>
                    {errors.status && (
                      <p className="text-red-500 text-xs">{errors.status.message}</p>
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
                <h2 className="text-md font-bold mb-4">Delete Sale</h2>
                <p className="text-sm">
                  Are you sure you want to delete the sale of{" "}
                  <strong>{selected.product?.name || "N/A"}</strong> to{" "}
                  <strong>{selected.buyer?.username}</strong>?
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
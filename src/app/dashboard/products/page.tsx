"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { headers } from "next/headers";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // 🔹 change to your Django endpoint

// ✅ Zod validation schema
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
  category: string;
  description?: string;
  quantity: number;
  price: number;
  cost?: number;
  is_service: boolean;
  created_at: string;
  updated_at: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [categories, setCategories] = useState([]);

  // ✅ Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try{
    const res = await fetch(BASE_URL+"/get_products",{
        method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
        }
    });
    
    const data = await res.json();
    if(res.status===200){
    setProducts(data.data);
    setLoading(false);}
    else{
        toast.error(data.error);
    }
}
catch(error){
    toast.error("couldn't fetch data")
}
finally{
    setLoading(false)
    
}
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL + "/get_categories", { // 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const data = await res.json();
      if (res.status === 200) {
        setCategories(data.data || []); // ⭐ Assuming data.results is the array of categories
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Couldn't fetch categories");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    //toast.error("gevew")
    fetchProducts();
    fetchCategories();
  }, []);

  // ✅ React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const handleOpen = (type: typeof modalType, product?: Product) => {
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
  const onSubmit = async (data: ProductFormData) => {
    if (modalType === "add") {
      try{
        let result=await fetch(BASE_URL+"/post_product", {
        method: "POST",
        headers: { "Content-Type": "application/json","Authorzation":`Bearer ${getAuthToken()}` },
        body: JSON.stringify(data),
      });
      if(result.status==201)
        toast.success("created text successfully")
       else
        toast.error("failed to create product")
    }
    catch(error){
        toast.error("couldn't create product")
    }
    } else if (modalType === "edit" && selected) {
      await fetch(`${BASE_URL}/update_product/${selected.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json","Authorzation":`Bearer ${getAuthToken()}` },
        body: JSON.stringify(data),
      });
    }
    await fetchProducts();
    handleClose();
  };

  // ✅ Delete
  const handleDelete = async () => {
    if (selected) {
      await fetch(`${BASE_URL}/${selected.id}/`, {
        method: "DELETE",
      });
      await fetchProducts();
      handleClose();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => handleOpen("add")}
          className="px-4 shadow-lg py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full justify-center items-center">
        <table className="w-full border border-gray-300 rounded shadow-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-sm px-7">Name</th>
              <th className="p-2 border text-sm px-7">Category</th>
              <th className="p-2 border text-sm px-7">Quantity</th>
              <th className="p-2 border text-sm px-7">Price</th>
              <th className="p-2 border text-sm px-7">Service</th>
              <th className="p-2 border text-sm px-7">Actions</th>
            </tr>
          </thead>
          
            {products.length==0?(<p>No items</p>):
            <tbody> {products?.map((p) => (
              <tr key={p.id} className="text-center">
                <td className="border px-7 text-sm">{p.name}</td>
                <td className="border px-7 text-sm">{p.category}</td>
                <td className="border px-7 text-sm">{p.quantity}</td>
                <td className="border px-7 text-sm">{p.price}</td>
                <td className="border px-7 text-sm">{p.is_service ? "Yes" : "No"}</td>
                <td className="border px-7 flex justify-center gap-2">
                  <button
                    className="px-2 py-1 bg-green-500 text-white rounded"
                    onClick={() => handleOpen("view", p)}
                  >
                    View
                  </button>
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded"
                    onClick={() => handleOpen("edit", p)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded"
                    onClick={() => handleOpen("delete", p)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}</tbody>}
          
        </table>
        </div>
      )}

      {/* ✅ Modal */}
      {modalType && (
        <div className=" shadow-2xl rounded-lg fixed inset-0  bg-opacity-500 flex items-center justify-center">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 relative h-[70%] overflow-y-auto items-center justify-center">
            <button
              onClick={handleClose}
              className="absolute font-bold top-5 hover:text-black text-xl right-2 text-gray-600"
            >
              x
            </button>

            {modalType === "view" && selected && (
              <div>
                <h2 className="text-xl font-bold mb-4">View Product</h2>
                <p><strong>Name:</strong> {selected.name}</p>
                <p><strong>Category:</strong> {selected.category}</p>
                <p><strong>Description:</strong> {selected.description}</p>
                <p><strong>Quantity:</strong> {selected.quantity}</p>
                <p><strong>Price:</strong> {selected.price}</p>
                <p><strong>Cost:</strong> {selected.cost}</p>
                <p><strong>Service:</strong> {selected.is_service ? "Yes" : "No"}</p>
              </div>
            )}

            {(modalType === "add" || modalType === "edit") && (
              <form onSubmit={handleSubmit(onSubmit)} className="  space-y-4 w-full p-2 justify-center items-center">
                <h2 className="text-xl font-bold mb-4">
                  {modalType === "add" ? "Add Product" : "Edit Product"}
                </h2>

                <div className="w-[50%] focus:ring-blue-500">
                  <label className="text-sm">Name</label>
                  <input
                    {...register("name")}
                    className="w-full border p-1 rounded-lg"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name.message}</p>
                  )}
                </div>

                

                <div className="w-[30%]">
                  <label htmlFor="category" className="text-sm">Category</label>
                  <select
                    id="category"
                    {...register("category", { valueAsNumber: true })} // ⭐ Register with valueAsNumber
                    className="w-full border p-2 rounded-lg"
                    defaultValue="" // Set a default empty value
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm">Description</label>
                  <textarea
                    {...register("description")}
                    className="w-full border p-1 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("quantity")}
                      className="w-full border p-1 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price")}
                      className="w-full border p-1 rounded-lg"
                    />
                  </div>
                </div>

                <div className="w-[30%]">
                  <label className="text-sm">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cost")}
                    className="w-full border p-1 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" {...register("is_service")} />
                  <label className="text-sm">Is Service?</label>
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                >
                  {modalType === "add" ? "Add" : "Update"}
                </button>
              </form>
            )}

            {modalType === "delete" && selected && (
              <div>
                <h2 className="text-xl font-bold mb-4">Delete Product</h2>
                <p>
                  Are you sure you want to delete <strong>{selected.name}</strong>?
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-gray-400 text-white rounded"
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

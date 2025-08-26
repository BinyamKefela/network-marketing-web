"use client";

import { SubmitHandler,useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserInput } from "@/schemas/user-schema";
import { LucideLoaderCircle } from "lucide-react";
import z from "zod";
import { getAuthToken, loginUser } from "@/app/auth/login/api";
import { get } from "http";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useEffect } from "react";



const schema = z.object({
  email:z.email().min(3),
  password:z.string().min(4)
})

type formFields = z.infer<typeof schema>


export default function UserForm(){

  const {register, handleSubmit, formState:{errors,isSubmitting}} = useForm<formFields>({resolver:zodResolver(schema)});
  const router = useRouter();

  useEffect(()=>{
    if(getAuthToken()){
      router.push('/dashboard');
    }
  },[])

  const onSubmit:SubmitHandler<formFields> = async (data)=>{
    try{
      if(getAuthToken()){
        console.log("already logged in");
        router.push('/dashboard');
      }
      const response = await loginUser(data.email,data.password);
      
      console.log(response.access+"---------token");
      
      if(response.access){
        toast.success("login successful");
        router.push('/dashboard');
      }


      
    }catch(err){
      toast.error("login failed");
      console.log(err);
      
    }
    
    console.log(data);
  }

  return (
    <form
      className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-lg shadow-lg flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h1 className="font-bold text-center text-xl">Fast Netwrok Marketing</h1>
      <h2 className="text-lg font-bold text-center text-gray-800 mb-4">Sign In</h2>
      <div className="flex flex-col gap-2">
      <label htmlFor="email" className="text-gray-700 font-medium">
        Email
      </label>
      <input
        {...register("email",{required:"email is required",pattern: /^\S+@\S+$/i})}
        id="email"
        type="email"
        placeholder="Enter your email"
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      </div>
      {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      <div className="flex flex-col gap-2">
      <label htmlFor="password" className="text-gray-700 font-medium">
        Password
      </label>
      <input
        {...register("password",{required:"password is required",minLength:{value:6,message:"password must be at least 6 characters"}})}
        id="password"
        type="password"
        placeholder="Enter your password"
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      </div>
      {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
      <button
      type="submit"
      className="w-full py-2 mt-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
      {isSubmitting
      ?"Loading...":"sign in"} 
      </button>
    </form>
  );
}

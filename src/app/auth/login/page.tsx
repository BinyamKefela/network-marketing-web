'use client'
import { useRouter } from "next/navigation";
export default function Login(){
    const router = useRouter();
    return(
    <div className="p-10 w-full">
        <h1 className="justify-self-center font-semibold ">ANT Networking</h1>
        <h2 className="mt-5 font-semibold ">Login</h2>
        <form className="flex flex-col gap-4 mt-3">
            <label className="text-sm">email</label>
            <input type="email" id="email" placeholder="email" name="email" className="text-sm border-1 border-gray-600 rounded-lg p-2" required />
            <label className="text-sm" >password</label>
            <input type="password" id="password" placeholder="password" name="password" className=" text-sm border-1 border-gray-600 rounded-lg p-2" required />
            <button type="submit" className="text-sm bg-gray-400 rounded-sm p-2  border  border-gray-200" onClick={() => router.push('/staff')}>Login</button>
        </form>
    </div>);
}
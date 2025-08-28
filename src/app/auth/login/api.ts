
import Cookies from "js-cookie";


const URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';


export function getAuthToken() {
    
    const token = Cookies.get('token');
    return token || null;
}

export async function  loginUser(email: string, password: string) {
    const result = await fetch(`${URL}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ email:email, password:password }),
    });

    if (!result.ok) {
        throw new Error('Login failed');
    }

    const data = await result.json()
    console.log(data+"-----------");
    if (data && data.access) {
        const futureDate = new Date(9999, 0, 1); // January 1st, 9999
        Cookies.set('token', data.access, { expires: futureDate });
        console.log("cookie set");
        
    }   
    return data;
}

export function logoutUser() {
    Cookies.remove('token');
    
    
}


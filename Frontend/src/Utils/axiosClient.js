import axios from "axios"

const axiosClient =  axios.create({
    baseURL: 'http://localhost:5005',
    // baseURL:'https://coding-platform-4.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;


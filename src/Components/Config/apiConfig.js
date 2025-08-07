// src/api.js or src/API_CONFIG.js

import axios from "axios";

const API_CONFIG = axios.create({
//   baseURL: 'http://13.202.129.139:5000', // ✅ Correct key
  baseURL: 'http://13.202.129.139:5000', // ✅ Correct key
  timeout: 10000,
});


export default API_CONFIG;

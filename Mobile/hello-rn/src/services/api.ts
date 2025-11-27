import axios from 'axios';

const api = axios.create({
  // Substitua pelo SEU IP local quando for testar (ex: 192.168.1.5)
  baseURL: 'http://192.168.100.114:3000/api', 
  timeout: 10000,
});

export default api;
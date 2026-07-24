import axios from "axios";

const Api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export const signup = async (name: string, email: string, password: string) => {
  const response = await Api.post("/auth/sign-up", { name, email, password });
  return response.data;
};

export const signin = async (email: string, password: string) => {
  const response = await Api.post("/auth/sign-in", { email, password });
  return response.data;
};

export const logout = async () => {
  const response = await Api.post("/auth/logout");
  return response.data;
};

export const getMe = async () => {
  const response = await Api.get("/auth/me");
  return response.data;
};

export default Api;

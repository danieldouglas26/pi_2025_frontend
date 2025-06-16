export interface User {
  id: string;
  username: string;
  // Add other user properties as needed
}

export interface LoginCredentials {
  username: string; // Or email
  password: string; // Or just password, backend handles hashing
}

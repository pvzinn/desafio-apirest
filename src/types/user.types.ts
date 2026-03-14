export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
}

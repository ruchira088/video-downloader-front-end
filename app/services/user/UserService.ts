import { axiosClient } from "~/services/http/HttpClient"
import { User } from "~/models/User"
import { zodParse } from "~/types/Zod"

export type CreateUserRequest = {
  readonly email: string
  readonly password: string
  readonly firstName: string
  readonly lastName: string
}

export const createUser = async (request: CreateUserRequest): Promise<User> => {
  const response = await axiosClient.post("/users", request)
  const user = zodParse(User, response.data)

  return user
}

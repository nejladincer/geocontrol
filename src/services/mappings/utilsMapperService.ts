import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { Network as NetworkDTO } from "@dto/Network";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { UserDAO } from "@models/dao/UserDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";
import { Gateway as GatewayDTO } from "@models/dto/Gateway";

export function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0) 
    )
  ) as Partial<T>;
}
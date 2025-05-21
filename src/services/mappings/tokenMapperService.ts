import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { Network as NetworkDTO } from "@dto/Network";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { UserDAO } from "@models/dao/UserDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";
import { Gateway as GatewayDTO } from "@models/dto/Gateway";
import { removeNullAttributes } from "@services/mappings/utilsMapperService";

/* Token DTO */
export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}


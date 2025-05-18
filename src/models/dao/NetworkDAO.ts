import { Entity, PrimaryColumn, Column } from "typeorm";
import { NetworkType } from "@models/NetworkType";
import { Gateway } from "@models/dto/Gateway";

@Entity("networks")
export class NetworkDAO {
  @PrimaryColumn({ nullable: false })
  // TODO: Set max string length to 1
  code: string;

  @Column({ nullable: false })
  name: string;
  
  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false })
  gateways: GatewayType;

}

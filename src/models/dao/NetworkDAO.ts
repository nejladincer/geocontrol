import { Entity, PrimaryColumn, Column } from "typeorm";
//import { GatewayDAO } from "./GatewayDAO";

@Entity("networks")
export class NetworkDAO {
  @PrimaryColumn({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  //added this for gateway relation in the future
  //@OneToMany(() => GatewayDAO, gateway => gateway.network)
  //gateways: GatewayDAO[];
} 
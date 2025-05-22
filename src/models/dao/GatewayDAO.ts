import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne } from "typeorm";
//import { SensorDAO } from "./SensorDAO"; //TODO: SensorDAO will be created
import { NetworkDAO } from "./NetworkDAO"; // Se il gateway appartiene a un network

@Entity("gateways")
export class GatewayDAO {
  @PrimaryColumn({ nullable: false })
  macAddress: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false })
  networkCode: string;
  /*@OneToMany(() => SensorDAO, (sensor) => sensor.gateway)
  sensors: SensorDAO[];
*/
}

import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { NetworkDAO } from "./NetworkDAO";
import { SensorDAO } from "./SensorDAO";

@Entity("gateways")
export class GatewayDAO {
  @PrimaryColumn({ nullable: false })
  macAddress: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  // N Gateways : 1 Network
  @ManyToOne(() => NetworkDAO, (network) => network.gateways, { cascade: true })
  @JoinColumn({ name: "networkCode" })
  network: NetworkDAO;

  // 1 Gateway : N Sensors
  @OneToMany(() => SensorDAO, (sensor) => sensor.gateway)
  sensors: SensorDAO[];
}

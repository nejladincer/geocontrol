import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { SensorDAO } from "./SensorDAO";
import { NetworkDAO } from "./NetworkDAO"; // Se il gateway appartiene a un network

@Entity("gateways")
export class GatewayDAO {
  @PrimaryColumn({ nullable: false })
  macAddress: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @OneToMany(() => SensorDAO, (sensor) => sensor.gateway)
  sensors: SensorDAO[];

  @ManyToOne(() => NetworkDAO, (network) => network.gateways)
  network: NetworkDAO;
}

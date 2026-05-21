import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Vehicle } from "./Vehicle";
import { DiagnosticCode } from "./DiagnosticCode";

@Entity("brands")
export class Brand {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    name!: string; // contoh: "Toyota"

    @Column({ type: "varchar", length: 100, nullable: true })
    country!: string; // contoh: "Jepang"

    // Relasi: Satu merek punya banyak model kendaraan
    @OneToMany(() => Vehicle, (vehicle) => vehicle.brand)
    vehicles!: Vehicle[];

    // Relasi: Satu merek punya banyak kode DTC spesifik
    @OneToMany(() => DiagnosticCode, (diagnosticCode) => diagnosticCode.brand)
    diagnosticCodes!: DiagnosticCode[];
}
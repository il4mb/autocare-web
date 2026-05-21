import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { DiagnosticCode } from "./DiagnosticCode";

@Entity("brands")
export class Brand {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    name!: string;

    // Relasi: Satu merek punya banyak kode DTC spesifik
    @OneToMany(() => DiagnosticCode, (diagnosticCode) => diagnosticCode.brand)
    diagnosticCodes!: DiagnosticCode[];
}
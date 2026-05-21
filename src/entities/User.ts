import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn } from "typeorm";

export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}

@Entity("users")
export class User {
    
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    name!: string;

    @Column({ type: "varchar", length: 100, unique: true })
    email!: string;

    @Column({ type: "varchar", length: 255 })
    password!: string;

    @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
    role!: UserRole;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

}
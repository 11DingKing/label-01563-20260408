import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("operation_logs")
export class OperationLog {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({ name: "user_id", type: "bigint", nullable: true })
  userId: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  username: string;

  @Column({ type: "varchar", length: 50 })
  action: string;

  @Column({ type: "varchar", length: 50 })
  module: string;

  @Column({ type: "varchar", length: 10 })
  method: string;

  @Column({ type: "varchar", length: 255 })
  path: string;

  @Column({ type: "text", nullable: true })
  params: string;

  @Column({ type: "text", nullable: true })
  result: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  ip: string;

  @Column({ name: "user_agent", type: "varchar", length: 255, nullable: true })
  userAgent: string;

  @Column({ type: "int", default: 0 })
  duration: number;

  @Column({ type: "tinyint", default: 1, comment: "状态: 0失败 1成功" })
  status: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

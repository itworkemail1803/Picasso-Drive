"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password) return { error: "Missing fields" };

  // Check email tồn tại
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { error: "Email already exists" };

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Tạo user
  await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  return { success: true };
}

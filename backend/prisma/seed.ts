import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed');
  // Create Departments
  const cse = await prisma.department.upsert({
    where: { name: 'Computer Science & Engineering' },
    update: {},
    create: { name: 'Computer Science & Engineering' },
  });

  console.log('CSE created', cse);

  const ece = await prisma.department.upsert({
    where: { name: 'Electronics & Communication' },
    update: {},
    create: { name: 'Electronics & Communication' },
  });

  console.log('ECE created', ece);

  // Create Principal
  const principalPassword = await bcrypt.hash('principal123', 10);
  console.log('Principal password hashed');

  await prisma.user.upsert({
    where: { email: 'principal@college.edu' },
    update: {},
    create: {
      email: 'principal@college.edu',
      name: 'Dr. Principal',
      role: Role.PRINCIPAL,
      passwordHash: principalPassword,
      isActive: true,
    },
  });

  console.log('Principal created');

  // Create a Student for testing (Enoch Jason)
  const studentPassword = await bcrypt.hash('password123', 10);
  console.log('Student password hashed');

  await prisma.user.upsert({
    where: { email: 'enoch.jason@college.edu' },
    update: {},
    create: {
      email: 'enoch.jason@college.edu',
      name: 'Enoch Jason',
      role: Role.STUDENT,
      passwordHash: studentPassword,
      departmentId: cse.id,
      isActive: true,
    },
  });

  console.log('Student created');

  // Create an HOD
  const hodPassword = await bcrypt.hash('hod123', 10);
  console.log('HOD password hashed');

  await prisma.user.upsert({
    where: { email: 'hod.cse@college.edu' },
    update: {},
    create: {
      email: 'hod.cse@college.edu',
      name: 'Dr. HOD CSE',
      role: Role.HOD,
      passwordHash: hodPassword,
      departmentId: cse.id,
      isActive: true,
    },
  });
  console.log('HOD created');

  // Create a Staff member
  const staffPassword = await bcrypt.hash('staff123', 10);
  console.log('Staff password hashed');

  await prisma.user.upsert({
    where: { email: 'staff.cs@college.edu' },
    update: {},
    create: {
      email: 'staff.cs@college.edu',
      name: 'CS Staff Member',
      role: Role.STAFF,
      passwordHash: staffPassword,
      departmentId: cse.id,
      isActive: true,
    },
  });
  console.log('Staff created');

  // --- Additional Students ---
  const users = [
    { email: 'arun.kumar@college.edu',     name: 'Arun Kumar',      role: Role.STUDENT, dept: cse.id, phone: '+91 98765 11111', batch: '2022-2026', rollNumber: 'CSE-22-001' },
    { email: 'priya.sharma@college.edu',    name: 'Priya Sharma',    role: Role.STUDENT, dept: cse.id, phone: '+91 98765 22222', batch: '2022-2026', rollNumber: 'CSE-22-002' },
    { email: 'deepak.raj@college.edu',      name: 'Deepak Raj',      role: Role.STUDENT, dept: cse.id, phone: '+91 98765 33333', batch: '2023-2027', rollNumber: 'CSE-23-010' },
    { email: 'kavitha.m@college.edu',       name: 'Kavitha M',       role: Role.STUDENT, dept: ece.id, phone: '+91 98765 44444', batch: '2022-2026', rollNumber: 'ECE-22-005' },
    { email: 'sanjay.v@college.edu',        name: 'Sanjay V',        role: Role.STUDENT, dept: ece.id, phone: '+91 98765 55555', batch: '2023-2027', rollNumber: 'ECE-23-012' },
    { email: 'meera.nair@college.edu',      name: 'Meera Nair',      role: Role.STUDENT, dept: cse.id, phone: '+91 98765 66666', batch: '2023-2027', rollNumber: 'CSE-23-015' },
    { email: 'ravi.krishnan@college.edu',   name: 'Ravi Krishnan',   role: Role.STUDENT, dept: ece.id, phone: '+91 98765 77777', batch: '2022-2026', rollNumber: 'ECE-22-008' },
    { email: 'anitha.s@college.edu',        name: 'Anitha S',        role: Role.STUDENT, dept: cse.id, phone: '+91 98765 88888', batch: '2022-2026', rollNumber: 'CSE-22-020' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: studentPassword, // all students use password123
        departmentId: u.dept,
        isActive: true,
        phone: u.phone,
        batch: u.batch,
        rollNumber: u.rollNumber,
      },
    });
    console.log(`Created student: ${u.name}`);
  }

  // --- Additional Staff ---
  const staffUsers = [
    { email: 'dr.ramesh@college.edu',     name: 'Dr. Ramesh Kumar',   role: Role.STAFF, dept: cse.id },
    { email: 'prof.lakshmi@college.edu',  name: 'Prof. Lakshmi R',    role: Role.STAFF, dept: ece.id },
    { email: 'dr.suresh@college.edu',     name: 'Dr. Suresh Babu',    role: Role.STAFF, dept: ece.id },
    { email: 'hod.ece@college.edu',       name: 'Dr. HOD ECE',        role: Role.HOD,   dept: ece.id },
  ];

  for (const s of staffUsers) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        role: s.role,
        passwordHash: staffPassword, // all staff use staff123, HODs use staff123 too
        departmentId: s.dept,
        isActive: true,
      },
    });
    console.log(`Created ${s.role.toLowerCase()}: ${s.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

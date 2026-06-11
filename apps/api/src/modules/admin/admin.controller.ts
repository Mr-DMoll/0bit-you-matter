import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync }      from "../../utils/catchAsync.js";
import { AppError }        from "../../utils/appError.js";
import { sendInviteEmail } from "../../services/mail.service.js";

// Use string literals — not the Role enum — so this works even if @repo/types
// hasn't been rebuilt yet after adding new enum values.
// DATA_VERIFIER removed — reviewers are the single verification authority
const INVITABLE_ROLES = ["MANAGER", "CONTENT_MANAGER", "REVIEWER"] as const;
type InvitableRoleStr = typeof INVITABLE_ROLES[number];

// ── Admin dashboard ────────────────────────────────────────────────────────────

export const adminDashboard = catchAsync(async (_req: Request, res: Response) => {
  const [
    totalLearners,
    totalManagers,
    totalContentManagers,
    totalReviewers,
    totalDataVerifiers,
    pendingInvites,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "LEARNER",         accountStatus: { not: "DELETED" } } }),
    prisma.user.count({ where: { role: "MANAGER",         accountStatus: { not: "DELETED" } } }),
    prisma.user.count({ where: { role: "CONTENT_MANAGER", accountStatus: { not: "DELETED" } } }),
    prisma.user.count({ where: { role: "REVIEWER", accountStatus: { not: "DELETED" } } }),
    Promise.resolve(0), // DATA_VERIFIER removed
    prisma.user.count({ where: { accountStatus: "PENDING", role: { in: [...INVITABLE_ROLES] as any } } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take:    10,
      include: { user: { select: { email: true, displayName: true, firstName: true, lastName: true, role: true } } },
    }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: {
      totalLearners,
      totalManagers,
      totalContentManagers,
      totalReviewers,
      totalDataVerifiers,
      pendingInvites,
      recentActivity,
    },
  });
});

// ── List staff by role ─────────────────────────────────────────────────────────
// GET /admin/staff?role=MANAGER&status=ACTIVE&page=1

export const listStaff = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 50;
  const skip   = (page - 1) * limit;
  const roleQ  = (req.query.role as string)?.toUpperCase() as InvitableRoleStr | undefined;
  const status = req.query.status as string | undefined;

  // Default: show all invitable roles
  if (roleQ && !(INVITABLE_ROLES as readonly string[]).includes(roleQ))
    throw new AppError(`Invalid role filter. Must be one of: ${INVITABLE_ROLES.join(", ")}`, HttpStatus.BAD_REQUEST);

  const where: any = {
    role:          roleQ ? roleQ : { in: [...INVITABLE_ROLES] },
    accountStatus: status ? status : { not: "DELETED" },
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, role: true,
        firstName: true, lastName: true, displayName: true,
        accountStatus: true, createdAt: true, lastActiveAt: true,
        specialisation: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { users, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

// ── List learners ──────────────────────────────────────────────────────────────
// GET /admin/learners?status=ACTIVE&page=1

export const listLearners = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 50;
  const skip   = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const where: any = {
    role:          "LEARNER",
    accountStatus: status ? status : { not: "DELETED" },
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, role: true,
        firstName: true, lastName: true, displayName: true,
        accountStatus: true, createdAt: true, lastActiveAt: true,
        grade: true, province: true, school: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { users, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

// ── Invite staff member ────────────────────────────────────────────────────────
// POST /admin/staff/invite  { email, firstName, lastName, role }

export const inviteStaffMember = catchAsync(async (req: Request, res: Response) => {
  const { email, firstName, lastName, role } = req.body;

  if (!email) throw new AppError("Email is required", HttpStatus.BAD_REQUEST);
  if (!role)  throw new AppError("Role is required",  HttpStatus.BAD_REQUEST);

  const normalised = (role as string).toUpperCase() as InvitableRoleStr;
  if (!(INVITABLE_ROLES as readonly string[]).includes(normalised))
    throw new AppError(
      `Invalid role. Must be one of: ${INVITABLE_ROLES.join(", ")}`,
      HttpStatus.BAD_REQUEST,
    );

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("A user with this email already exists", HttpStatus.CONFLICT);

  const code    = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const user = await prisma.user.create({
    data: {
      email,
      password:            "",
      role:                normalised,
      accountStatus:       "PENDING",
      firstName:           firstName ?? null,
      lastName:            lastName  ?? null,
      invitedById:         req.user!.userId,
      verificationCode:    code,
      verificationExpires: expires,
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${code}&email=${encodeURIComponent(email)}`;
  const roleName   = normalised.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  await sendInviteEmail(email, inviteLink, firstName ?? roleName);

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "STAFF_INVITED", meta: { email, role: normalised } },
  });
  req.auditLogged = true;

  return res.status(HttpStatus.CREATED).json({
    status:  "success",
    message: `${roleName} invited successfully`,
    data:    { id: user.id, email: user.email, role: user.role },
  });
});

// ── Update user status ─────────────────────────────────────────────────────────

export const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id }     = req.params;
  const { status } = req.body;

  const valid = ["ACTIVE", "SUSPENDED", "DELETED"];
  if (!valid.includes(status))
    throw new AppError("Invalid status. Must be ACTIVE, SUSPENDED or DELETED", HttpStatus.BAD_REQUEST);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);

  // Prevent demoting a SUPER_ADMIN via this endpoint
  if (user.role === "SUPER_ADMIN")
    throw new AppError("Cannot modify a Super Admin via this endpoint", HttpStatus.FORBIDDEN);

  await prisma.user.update({ where: { id }, data: { accountStatus: status } });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "USER_STATUS_UPDATED", meta: { targetId: id, status } },
  });
  req.auditLogged = true;

  return res.status(HttpStatus.OK).json({ status: "success", message: "User status updated" });
});

// ── Update user role ───────────────────────────────────────────────────────────

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id }   = req.params;
  const { role } = req.body;

  const normalised = (role as string)?.toUpperCase() as InvitableRoleStr;
  if (!(INVITABLE_ROLES as readonly string[]).includes(normalised))
    throw new AppError(
      `Admins can only assign: ${INVITABLE_ROLES.join(", ")}`,
      HttpStatus.BAD_REQUEST,
    );

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);
  if (user.role === "SUPER_ADMIN")
    throw new AppError("Cannot change a Super Admin's role", HttpStatus.FORBIDDEN);

  await prisma.user.update({ where: { id }, data: { role: normalised } });

  return res.status(HttpStatus.OK).json({ status: "success", message: "User role updated" });
});

// ── Hard delete user ──────────────────────────────────────────────────────────
// For testing only — permanently removes the user so the email can be reused.

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);
  if (user.role === "SUPER_ADMIN")
    throw new AppError("Cannot delete a Super Admin", HttpStatus.FORBIDDEN);
  // Prevent self-delete
  if (user.id === req.user!.userId)
    throw new AppError("You cannot delete your own account", HttpStatus.FORBIDDEN);

  await prisma.user.delete({ where: { id } });

  return res.status(HttpStatus.OK).json({ status: "success", message: "User permanently deleted" });
});

// ── Activity log ───────────────────────────────────────────────────────────────

export const adminActivity = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 30;
  const action = req.query.action as string | undefined;

  const where: any = {};
  if (action) where.action = { contains: action.toUpperCase() };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        user: { select: { email: true, displayName: true, firstName: true, lastName: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { logs, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

// ── Reviewer profile ───────────────────────────────────────────────────────────
// GET  /admin/reviewers/:id/profile
// PATCH /admin/reviewers/:id/profile  { specialisation }

export const getReviewerProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, role: true,
      firstName: true, lastName: true, displayName: true, avatarUrl: true,
      accountStatus: true, createdAt: true, lastActiveAt: true,
      specialisation: true,
    },
  });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);

  // Stats: reviews done, verified vs discarded
  const [totalReviews, verifiedCount, discardedCount, pendingCount] = await Promise.all([
    prisma.contentReview.count({ where: { reviewerId: id } }),
    prisma.auditLog.count({ where: { userId: id, action: "CONTENT_VERIFIED" } }),
    prisma.auditLog.count({ where: { userId: id, action: "CONTENT_DISCARDED" } }),
    prisma.contentReview.count({ where: { reviewerId: id, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: {
      user,
      stats: { totalReviews, verifiedCount, discardedCount, pendingCount },
    },
  });
});

export const updateReviewerProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { specialisation } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.user.update({
    where: { id },
    data:  { specialisation: specialisation ?? null },
    select: { id: true, specialisation: true },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { user: updated } });
});

// ── Legacy compatibility — kept so existing invite routes still work ───────────

export const inviteManager = catchAsync(async (req: Request, res: Response, next: any) => {
  req.body.role = "MANAGER";
  return inviteStaffMember(req, res, next);
});

export const listManagers = catchAsync(async (req: Request, res: Response, next: any) => {
  req.query.role = "MANAGER";
  return listStaff(req, res, next);
});

// Kept for route compatibility
export const listUsers    = listStaff;
export const inviteUser   = inviteStaffMember;

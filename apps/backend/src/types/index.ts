import z from 'zod'
import type { Request } from 'express'

const createOrgSchema = z.object({
    name: z.string(),
    description: z.string()
})

const createMembership = z.object({
    userId: z.string(),
    organizationId: z.string(),
    role: z.string(),
})

const createBoardSchema = z.object({
    title: z.string(),
    organizationId: z.string()
})

const connectRepositorySchema = z.object({
    githubId: z.union([z.string(), z.number()]).transform(String),
    owner: z.string().min(1),
    name: z.string().min(1),
    defaultBranch: z.string().min(1),
})

const createIssueSchema = z.object({
    title: z.string(),
    description: z.string(),
    boardId: z.string(),
    sectionId: z.string(),
    createdBy: z.string()
})

const createSectionSchema = z.object({
    boardId: z.string(),
    title: z.string(),
});

const getIssueSchema = z.string()

const updateIssueSchema = z.object({
    id: z.string(),
    sectionId: z.string()
})

const signInSchema = z.object({
    username: z.string(),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character" })
})

export {
    createMembership,
    createOrgSchema,
    createBoardSchema,
    connectRepositorySchema,
    createIssueSchema,
    createSectionSchema,
    getIssueSchema,
    updateIssueSchema,
    signInSchema
}

export type AuthenticatedRequest = Request & {
    user: {
        id?: string;
        userId: string;
        username: string;
    };
};
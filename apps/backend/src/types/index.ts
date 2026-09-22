import z from 'zod'

const createOrgSchema = z.object({
    userId: z.string(),
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
    sectionId: z.string()
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
    password: z.string()
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

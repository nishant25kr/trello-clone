import z from 'zod'

const createOrgSchema = z.object({
    userId: z.string(),
    name: z.string(),
    descriptin: z.string()
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

const createIssueSchema = z.object({
    title: z.string(),
    description: z.string(),
    boardId: z.string(),
    sectionId: z.string()
})

export { 
    createMembership, 
    createOrgSchema, 
    createBoardSchema,
    createIssueSchema
}

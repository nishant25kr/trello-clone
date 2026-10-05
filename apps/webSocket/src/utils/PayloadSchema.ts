import z from "zod"

const UserSchema = z.object({
    id: z.string().min(1),
    username: z.string().min(1).max(100)
})

const JoinRoomSchema = z.object({
    token: z.string().min(1),
    organizationId: z.string().min(1)
})

const ChangeBoardSchema = z.object({
    currentBoardId: z.string().min(1),
    newBoardId: z.string().min(1),
    user: UserSchema
})

const CreateTaskSchema = z.object({
    title: z.string().trim().min(1).max(200),
    boardId: z.string().min(1),
    createdBy: z.string().min(1).optional(),
    description: z.string().max(2000).default(""),
    sectionId: z.string().min(1),
})

const CreateSectionSchema = z.object({
    title: z.string().trim().min(1).max(100),
    boardId: z.string().min(1)
})

const CreateBoardSchema = z.object({
    title: z.string().trim().min(1).max(100),
    organizationId: z.string().min(1)
})

const DeleteSectionSchema = z.object({
    sectionId: z.string().min(1),
    boardId: z.string().min(1)
})

const MoveTaskSchema = z.object({
    issueId: z.string().min(1),
    updatedSection: z.string().min(1),
    boardId: z.string().min(1)
})

const DeleteTaskSchema = z.object({
    issueId: z.string().min(1),
    boardId: z.string().min(1)
})

export {
    JoinRoomSchema,
    ChangeBoardSchema,
    CreateTaskSchema,
    CreateSectionSchema,
    CreateBoardSchema,
    DeleteSectionSchema,
    MoveTaskSchema,
    DeleteTaskSchema
}
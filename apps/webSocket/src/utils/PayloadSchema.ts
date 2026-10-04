import z from "zod"

const UserSchema = z.object({
    id: z.string(),
    username: z.string()
})

const JoinRoomSchema = z.object({
    token: z.string(),
    organizationId: z.string()
})

const ChangeBoardSchema = z.object({
    currentBoardId: z.string(),
    newBoardId: z.string(),
    user: UserSchema
})

const CreateTaskSchema = z.object({
    title: z.string(),
    boardId: z.string(),
    createdBy: z.string(),
    description: z.string(),
    sectionId: z.string(),
})

const CreateSectionSchema = z.object({
    title: z.string(),
    boardId: z.string()
})

const DeleteSectionSchema = z.object({
    sectionId: z.string(),
    boardId: z.string()
})

const MoveTaskSchema = z.object({
    issueId: z.string(),
    updatedSection: z.string(),
    boardId: z.string()
})

const DeleteTaskSchema = z.object({
    issueId: z.string(),
    boardId: z.string()
})

export {
    JoinRoomSchema,
    ChangeBoardSchema,
    CreateTaskSchema,
    CreateSectionSchema,
    DeleteSectionSchema,
    MoveTaskSchema,
    DeleteTaskSchema
}
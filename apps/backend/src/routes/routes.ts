import router from "express";
import { getUser, createUser, signIn }  from "../controllers/userController";
import { createOrg, getOrg } from "../controllers/orgController";
import { createIssue, getIssue, updateIssue } from "../controllers/issueController";
import { createSection, getSection } from "../controllers/sectionController";
import { connectRepository, createBoard, getRepositoryBranches } from "../controllers/boardController";
import { getAgentJob, startAgentJob } from "../controllers/agentJobController";

const route = router.Router();

route.post("/users", createUser);
route.post("/organization", createOrg);
route.post("/issue",createIssue)
route.post("/section", createSection)
route.post("/board",createBoard)
route.get("/github/repository", getRepositoryBranches)
route.post("/board/:boardId/repository", connectRepository)
route.post("/issue/:issueId/agent-jobs", startAgentJob)
route.get("/agent-jobs/:jobId", getAgentJob)
route.post("/signin",signIn)
route.get("/section", getSection)
route.get("/users/:id", getUser);
route.get("/organization/:id", getOrg);
route.get("/issue/:id",getIssue)
route.put("/issue",updateIssue)

export default route;
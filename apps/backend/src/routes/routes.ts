import router from "express";
import { getUser, createUser, signIn }  from "../controllers/userController";
import { createOrg, getOrg } from "../controllers/orgController";
import { createIssue, getIssue, updateIssue } from "../controllers/issueController";
import { createSection, getSection } from "../controllers/sectionController";
import { connectRepository, createBoard, getRepositoryBranches } from "../controllers/boardController";
import { getAgentJob, startAgentJob } from "../controllers/agentJobController";
import { Middleware } from "../middleware";

const route = router.Router();

route.post("/users", createUser);
route.post("/organization", Middleware, createOrg);
route.post("/issue",Middleware, createIssue)
route.post("/section", Middleware, createSection)
route.post("/board", Middleware, createBoard)
route.get("/github/repository", Middleware, getRepositoryBranches)
route.post("/board/:boardId/repository", Middleware, connectRepository)
route.post("/issue/:issueId/agent-jobs", startAgentJob)
route.get("/agent-jobs/:jobId", getAgentJob)
route.post("/signin",signIn)
route.get("/section", getSection)
route.get("/users/:id", getUser);
route.get("/organization/:id", Middleware, getOrg);
route.get("/issue/:id",getIssue)
route.put("/issue",updateIssue)

export default route;
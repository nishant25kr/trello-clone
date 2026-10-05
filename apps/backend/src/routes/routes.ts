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
route.post("/issue/:issueId/agent-jobs", Middleware, startAgentJob)
route.get("/agent-jobs/:jobId", Middleware, getAgentJob)
route.post("/signin",signIn)
route.get("/section", Middleware, getSection)
route.get("/users/:id", Middleware, getUser);
route.get("/organization/:id", Middleware, getOrg);
route.get("/issue/:id", Middleware, getIssue)
route.put("/issue", Middleware, updateIssue)

export default route;
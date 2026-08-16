import router from "express";
import userController from "../controllers/userController";
import { createOrg, getOrg } from "../controllers/orgController";
import { createIssue, getIssue } from "../controllers/issueController";
import { createSection, getSection } from "../controllers/sectionController";
import { createBoard } from "../controllers/boardController";

const { getUser, createUser } = userController;

const route = router.Router();

route.post("/users", createUser);
route.post("/organization", createOrg);
route.post("/issue",createIssue)
route.post("/section", createSection)
route.post("/board",createBoard)
route.get("/section", getSection)
route.get("/users/:id", getUser);
route.get("/organization/id", getOrg);
route.get("/issue/:id",getIssue)

export default route;
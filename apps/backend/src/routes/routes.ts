import router from "express";
import userController from "../controllers/userController";
import { createOrg, getOrg } from "../controllers/orgController";

const { getUser, createUser } = userController;

const routes = router.Router();

routes.get("/users/:id", getUser);
routes.post("/users", createUser);
routes.post("/organization", createOrg);
routes.get("/organization/id", getOrg);

export default routes;
import router from "express";
import userController from "../controllers/userController";

const { getUser, createUser } = userController;

const userRoutes = router.Router();

userRoutes.get("/users/:id", getUser);
userRoutes.post("/users", createUser);

export default userRoutes;
import { Router } from "express";
import * as controller from "../controllers/index";

export const index = Router();

index.get("/", controller.index);

index.post("/nft-metadata", controller.getMetadata);

index.post("/verify-sig", controller.verifySignature);

index.post("/verify-spl", controller.verifySpl);

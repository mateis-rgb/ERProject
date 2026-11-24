// Types étendus pour Express - déclaration de authUser sur Request
import { AuthUser } from "../types";

declare global {
    namespace Express {
        interface Request {
            authUser?: AuthUser;
        }
    }
}

export {};

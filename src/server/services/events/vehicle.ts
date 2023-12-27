import { Functions } from "server/network";
import { SessionManager } from "../session";

Functions.requestExitVehicle.setCallback((plr) => {
    SessionManager.getSession(plr)!.exitVehicle();

    // show character in workspace
    plr.Character!.Parent = game.Workspace;
});
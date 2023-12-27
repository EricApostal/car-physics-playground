import { Functions } from "client/network";
import { UserInputService, Players, Workspace, ReplicatedStorage } from "@rbxts/services";

Functions.enterVehicle.setCallback((vehicle: Model) => {
    // move camera to follow vehicle
    let camera = Workspace.CurrentCamera!;
    camera.CameraSubject = vehicle!.PrimaryPart as BasePart;

});
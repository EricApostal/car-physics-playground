import { Functions } from "client/network";
import { UserInputService, Players, Workspace, ReplicatedStorage } from "@rbxts/services";

Functions.enterVehicle.setCallback((vehicle: Model) => {
    // move camera to follow vehicle
    let camera = Workspace.CurrentCamera!;
    camera.CameraSubject = vehicle!.PrimaryPart as BasePart;
    // on key e pressed
    let input = UserInputService.InputBegan.Connect((input, gameProcessed) => {
        if (input.KeyCode === Enum.KeyCode.E) {
            Functions.requestExitVehicle.invoke();
            input.Destroy();
        }
    });
});

Functions.exitVehicle.setCallback(() => {
    // move camera to follow player
    let camera = Workspace.CurrentCamera!;
    camera.CameraSubject = Players.LocalPlayer!.Character!.FindFirstChild("Humanoid")! as BasePart;
});
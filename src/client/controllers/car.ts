import { Functions } from "client/network";
import { UserInputService, Players, Workspace, ReplicatedStorage } from "@rbxts/services";

namespace VehicleControls {
    export function init() { }
    export function setThrottle(vehicle: Model, amount: number) {
        let hinges = vehicle!.WaitForChild("MeshPart").WaitForChild("constraints").WaitForChild("motors")!.GetChildren();
        for (let hinge of hinges) {
            let mod = 1;
            if (hinge.Name === "FR" || hinge.Name === "BR") {
                mod = -1;
            }
            (hinge as HingeConstraint).AngularVelocity = amount * mod;
        }
    }

    export function setSteering(vehicle: Model, amount: number) {
        let attachmentParts = vehicle!.WaitForChild("MeshPart").WaitForChild("parts").WaitForChild("attachments")!.GetChildren();
        for (let part of attachmentParts) {
            let attachment = (part.FindFirstChild("Attachment1") as Attachment);
            if (attachment === undefined) continue;
            if (!(part.Name === "FR" || part.Name === "FL")) {
                continue;
            }
            attachment.Orientation = new Vector3(0, amount, 90);
        }
    }
}

Functions.enterVehicle.setCallback((vehicle: Model) => {
    // move camera to follow vehicle
    let camera = Workspace.CurrentCamera!;
    camera.CameraSubject = vehicle!.PrimaryPart as BasePart;
    print(camera.CameraSubject)
    // on key e pressed
    UserInputService.InputBegan.Connect((input, gameProcessed) => {
        if (input.KeyCode === Enum.KeyCode.E) {
            Functions.requestExitVehicle.invoke();
        }

        if (input.KeyCode === Enum.KeyCode.W) {
            VehicleControls.setThrottle(vehicle, 300);
        }

        if (input.KeyCode === Enum.KeyCode.S) {
            VehicleControls.setThrottle(vehicle, -300);
        }

        if (input.KeyCode === Enum.KeyCode.A) {
            VehicleControls.setSteering(vehicle, 20);
        }

        if (input.KeyCode === Enum.KeyCode.D) {
            VehicleControls.setSteering(vehicle, -20);
        }
    });

    UserInputService.InputEnded.Connect((input, gameProcessed) => {
        if (input.KeyCode === Enum.KeyCode.W || input.KeyCode === Enum.KeyCode.S) {
            VehicleControls.setThrottle(vehicle, 0);
        }

        if (input.KeyCode === Enum.KeyCode.A || input.KeyCode === Enum.KeyCode.D) {
            VehicleControls.setSteering(vehicle, 0);
        }
    });
});

Functions.exitVehicle.setCallback(() => {
    // move camera to follow player
    let camera = Workspace.CurrentCamera!;
    camera.CameraSubject = Players.LocalPlayer!.Character!.FindFirstChild("Humanoid")! as BasePart;
});
import { BaseComponent, Component } from "@flamework/components";
import { OnStart, OnTick } from "@flamework/core";
import { Players, Workspace, ReplicatedStorage } from "@rbxts/services";
import { Functions } from "server/network";

@Component({ tag: "vision_car" })
export class HyundaiVision extends BaseComponent implements OnStart, OnTick {
    private enterPrompt: ProximityPrompt = new Instance("ProximityPrompt");

    onStart() {
        let wheels = this.instance.WaitForChild("MeshPart").FindFirstChild("wheels")!.FindFirstChild("motors")!.GetChildren();
        for (let wheel of wheels) {
            (wheel.FindFirstChild("HingeConstraint") as HingeConstraint).AngularVelocity = 10;
        }
        // (this.instance as BasePart).SetNetworkOwner(Players.WaitForChild("SirTZNLive") as Player);
        this.enterPrompt.Parent = this.instance.FindFirstChild("MeshPart")! as BasePart;
        this.enterPrompt.ActionText = "Drive";
        this.enterPrompt.MaxActivationDistance = 10;
        this.enterPrompt.HoldDuration = 0.25;

        this.enterPrompt.Triggered.Connect((plr) => {
            let mesh = this.instance.FindFirstChild("MeshPart")! as BasePart;
            mesh.SetNetworkOwner(plr);
            Functions.enterVehicle.invoke(plr, this.instance as Model)
        });
    }

    onTick() {
    }
}
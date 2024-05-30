import { BaseComponent, Component } from "@flamework/components";
import { OnStart, OnTick } from "@flamework/core";
import { Players, Workspace, ReplicatedStorage } from "@rbxts/services";
import { Functions } from "server/network";
import { SessionManager } from "server/services/session";

@Component({ tag: "vision_car" })
export class HyundaiVision extends BaseComponent implements OnStart, OnTick {
    private enterPrompt: ProximityPrompt = new Instance("ProximityPrompt");
    private steering?: Folder;

    onStart() {
        // let wheels = this.instance.WaitForChild("MeshPart").FindFirstChild("wheels")!.FindFirstChild("motors")!.GetChildren();
        this.steering = (this.instance as BasePart).WaitForChild("MeshPart").FindFirstChild("constraints")!.FindFirstChild("steering")! as Folder;

        // for (let wheel of wheels) {
        //     (wheel.FindFirstChild("HingeConstraint") as HingeConstraint).AngularVelocity = 0;
        // }
        // (this.instance as BasePart).SetNetworkOwner(Players.WaitForChild("SirTZNLive") as Player);
        this.enterPrompt.Parent = this.instance.FindFirstChild("MeshPart")! as BasePart;
        this.enterPrompt.ActionText = "Drive";
        this.enterPrompt.MaxActivationDistance = 10;
        this.enterPrompt.HoldDuration = 0;

        this.enterPrompt.Triggered.Connect((plr) => {
            if (SessionManager.getSession(plr)!.getInVehicle()) return;

            let mesh = this.instance.FindFirstChild("MeshPart")! as BasePart;

            mesh.SetNetworkOwner(plr);
            SessionManager.getSession(plr)!.enterVehicle(this.instance as Model);

            // hide character from workspace
            plr.Character!.Parent = ReplicatedStorage;
            this.enterPrompt.Enabled = false;

            SessionManager.getSession(plr)!.onVehicleExit.Connect(() => {
                mesh.SetNetworkOwner(undefined);
                this.enterPrompt.Enabled = true;
            });
        });
    }

    onTick() {
        let FR = this.steering!.FindFirstChild("FR")!;
        let FL = this.steering!.FindFirstChild("FL")!;
        // (FR.FindFirstChild("HingeConstraint")! as HingeConstraint).TargetAngle = 0;
        // (FL.FindFirstChild("HingeConstraint")! as HingeConstraint).TargetAngle = 0;

    }
}
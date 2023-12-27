import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";

@Component({ tag: "vision_car" })
export class HyundaiVision extends BaseComponent implements OnStart {
    private motorModMap = new Map<string, number>();
    constructor() {
        super();
        this.motorModMap.set("FL", 1);
        this.motorModMap.set("FR", -1);
        this.motorModMap.set("BL", 1);
        this.motorModMap.set("BR", -1);
    }

    onStart() {
        let wheels = this.instance.WaitForChild("MeshPart").FindFirstChild("wheels")!.FindFirstChild("motors")!.GetChildren();
        for (let wheel of wheels) {
            let mod = this.motorModMap.get(wheel.Name)!;
            (wheel.FindFirstChild("HingeConstraint") as HingeConstraint).AngularVelocity = 1 * mod;
        }
    }
}
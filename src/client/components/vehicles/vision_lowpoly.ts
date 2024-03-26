import { Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { VehicleMesh } from "client/game/vehicle/mesh";

@Component({
    tag: "vm_hyundai_vision_lowpoly"
})
export class HyundaiVision extends VehicleMesh implements OnStart {

    constructor() {
        super(0.36, 100); super(0.36, 100);
    }

    onStart() {
        super.onStart();
    }
}
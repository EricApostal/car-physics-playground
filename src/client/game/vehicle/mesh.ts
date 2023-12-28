import { BaseComponent, Component } from "@flamework/components";
import { Controller, OnStart } from "@flamework/core";
import { AssetService } from "@rbxts/services";
import { RunService, Players, Workspace, ReplicatedStorage } from "@rbxts/services";

export class VehicleMesh extends BaseComponent implements OnStart {
    public vertices: Array<number> = [];
    public markerMap = new Map<number, BasePart>();
    public verticesMap = new Map<BasePart, number>();
    public mesh?: EditableMesh;
    public scaling: number = 0.5;
    public damageResistance: number = 1000;

    constructor(scaling: number, damageResistance: number) {
        /*
        TODO:
        - Add arguments to constructor for settings; scaling, damage resistance, etc.
        */
        super();
        this.scaling = scaling;
        this.damageResistance = damageResistance;
    }

    onStart() {
        // (this.instance as BasePart).Anchored = true;
        this.mesh = AssetService.CreateEditableMeshFromPartAsync(this.instance as MeshPart);
        this.mesh.Parent = this.instance;
        this.vertices = this.mesh.GetVertices() as Array<number>;

        for (let i = 0; i < this.vertices.size(); i++) {
            let pos = this.mesh.GetPosition(this.vertices[i]).mul(this.scaling);
            let marker = new Instance("Part");
            let relativeCFrame = (this.instance as BasePart).CFrame.mul(new CFrame(pos));

            marker.Position = relativeCFrame.Position;
            marker.Size = new Vector3(0.1, 0.1, 0.1);
            marker.Anchored = false;
            marker.Transparency = 0;
            marker.CanCollide = true
            marker.CollisionGroup = "car";
            marker.CanTouch = true;
            marker.Parent = game.Workspace;
            marker.Name = "marker";
            marker.Massless = true;
            marker.AddTag("marker")

            let weld = new Instance("WeldConstraint");
            weld.Parent = marker;
            weld.Part0 = marker;
            weld.Part1 = this.instance as BasePart;

            marker.Touched.Connect((part) => {
                task.wait();


                if (((marker.GetAttribute("isTouched") === false) || (marker.GetAttribute("isTouched") === undefined))) {
                    marker.SetAttribute("isTouched", true);

                    let curr = this.verticesMap.get(marker)!;
                    let currPos = this.mesh!.GetPosition(curr)!;

                    let force = math.min(((part.GetVelocityAtPosition(currPos).Magnitude) + (this.instance as BasePart).GetVelocityAtPosition(currPos).Magnitude) / this.damageResistance, 0.5);
                    print(force)
                    let newPos = currPos.sub((part.Position.sub(marker.Position)).mul(force));
                    this.mesh!.SetPosition(curr, newPos);

                    let markerCFrame = (this.instance as BasePart).CFrame.mul(new CFrame(this.mesh!.GetPosition(this.vertices[i]).mul(this.scaling)));
                    marker.Position = markerCFrame.Position;

                    task.wait(2);
                    marker.SetAttribute("isTouched", false);
                }
            });

            // silly, but allows for O(1) lookup
            this.markerMap.set(this.vertices[i], marker);
            this.verticesMap.set(marker, this.vertices[i]);
        }
        print("Generated verticies.");
        // (this.instance as BasePart).Anchored = false;
    }
}
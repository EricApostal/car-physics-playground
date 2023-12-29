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

    private localToGlobalVert(vert: number) {
        return this.mesh!.GetPosition(vert).mul(this.scaling).add((this.instance as BasePart).Position);
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
            marker.Transparency = 1;
            marker.CanCollide = true
            marker.CollisionGroup = "car";
            marker.CanTouch = true;
            marker.Parent = game.Workspace;
            marker.Name = "marker";
            marker.Massless = true;
            marker.Color = Color3.fromRGB(0, 255, 133);

            marker.AddTag("marker")

            let weld = new Instance("WeldConstraint");
            weld.Parent = marker;
            weld.Part0 = marker;
            weld.Part1 = this.instance as BasePart;


            marker.Touched.Connect((part) => {
                if ((part.Parent as BasePart).Name === "wheels") return;
                // if (((part.Parent as BasePart) as BasePart).Name === "baseplate") return;
                task.wait();

                if (((marker.GetAttribute("isTouched") === false) || (marker.GetAttribute("isTouched") === undefined))) {
                    marker.SetAttribute("isTouched", true);

                    let curr = this.verticesMap.get(marker)!;
                    let currPos = this.mesh!.GetPosition(curr)!;

                    let localImpactDirection = part.Position.sub(marker.Position).Unit;
                    let globalImpactDirection = (this.instance as BasePart).CFrame.VectorToWorldSpace(localImpactDirection);

                    let relativeVelocity = (this.instance as BasePart).AssemblyLinearVelocity;
                    let impactSpeed = relativeVelocity.Magnitude;
                    let forceMagnitude = math.min((impactSpeed) / this.damageResistance, 100000);

                    let damageIntensity = math.min((forceMagnitude * 2) * part.GetMass() / 75, 8); // Increase intensity based on speed

                    let newPos = currPos.add(globalImpactDirection.mul(-damageIntensity));

                    if (currPos.sub(newPos).Magnitude >= 5) {
                        marker.SetAttribute("isTouched", false);
                        return;
                    }
                    let adjacents = this.mesh!.GetAdjacentVertices(curr) as Array<number>;
                    let closestVert = undefined;
                    for (let vert of adjacents) {
                        let vertPos = this.mesh!.GetPosition(vert);
                        if (closestVert === undefined) {
                            closestVert = vert;
                            continue;
                        }
                        if (vertPos.sub((this.instance as BasePart).Position).Magnitude < this.mesh!.GetPosition(closestVert).sub((this.instance as BasePart).Position).Magnitude) {
                            closestVert = vert;
                        }
                    }

                    for (let vert of adjacents) {
                        let vertPos = this.mesh!.GetPosition(vert);
                        // let newVertPos = vertPos.add(globalImpactDirection.mul(-damageIntensity / 2));
                        // this.mesh!.SetPosition(vert, newVertPos);
                        if (vertPos.sub(currPos).Magnitude > 20) {
                            // remove current vertex
                            print("too big!")
                            this.mesh!.SetPosition(curr, this.mesh!.GetPosition(closestVert!));
                        }
                    }

                    this.mesh!.SetPosition(curr, newPos);

                    let markerCFrame = (this.instance as BasePart).CFrame.mul(new CFrame(this.mesh!.GetPosition(this.vertices[i]).mul(this.scaling)));
                    marker.Position = markerCFrame.Position;

                    marker.SetAttribute("isTouched", false);
                    marker.Color = Color3.fromRGB(250, 46, 46);
                    task.wait(3);
                    marker.Color = Color3.fromRGB(0, 255, 133);
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
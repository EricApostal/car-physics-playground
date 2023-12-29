import { BaseComponent, Component } from "@flamework/components";
import { Controller, OnStart } from "@flamework/core";
import { AssetService } from "@rbxts/services";
import { HttpService } from "@rbxts/services";

export class VehicleMesh extends BaseComponent implements OnStart {
    public vertices: Array<number> = [];
    public markerMap = new Map<number, BasePart>();
    public verticesMap = new Map<BasePart, number>();
    public constraintMap = new Map<string, boolean>();
    public mesh?: EditableMesh;
    public scaling: number = 0.5;
    public damageResistance: number = 1000;

    constructor(scaling: number, damageResistance: number) {
        super();
        this.scaling = scaling;
        this.damageResistance = damageResistance;
    }

    private localToGlobalVert(vert: number) {
        return (this.instance as BasePart).CFrame.mul(new CFrame(this.mesh!.GetPosition(vert).mul(this.scaling))).Position;
    }

    // Check to see if a constraint already exists between two vertecies
    private constraintExists(attachment1: Attachment, attachment2: Attachment) {
        let id1 = attachment1.GetAttribute("id") as string;
        let id2 = attachment2.GetAttribute("id") as string;

        let check1 = this.constraintMap.get(id1 + id2) !== undefined;
        let check2 = this.constraintMap.get(id2 + id1) !== undefined;
        return check1 || check2;
    }

    // Make constraint between two vertecies
    private makeConstraint(attachment1: Attachment, attachment2: Attachment) {
        // Create a new constraint
        let weld = new Instance("RodConstraint");
        weld.LimitsEnabled = true;
        weld.Length = weld.CurrentDistance;

        weld.Parent = game.Workspace.WaitForChild("constraints");
        weld.Attachment0 = attachment1;
        weld.Attachment1 = attachment2;

        // Add the constraint to the map
        let id1 = attachment1.GetAttribute("id") as string;
        let id2 = attachment2.GetAttribute("id") as string;
        this.constraintMap.set(id1 + id2, true);
    }

    // Recursively constraint all vertecies to their adjacent vertecies
    private constrainVerticies(vertexIndex: number) {
        print("Constraining vertex " + vertexIndex)
        let currentMarker = this.markerMap.get(vertexIndex)!;
        let currentMarkerAttachment = currentMarker.WaitForChild("Attachment")! as Attachment;

        let adjacentVertecies = this.mesh!.GetAdjacentVertices(vertexIndex) as Array<number>;
        print("Adjacent vertecies: " + adjacentVertecies.size())
        for (let vert of adjacentVertecies) {
            print("Constraining vertex " + vertexIndex + " to " + vert)

            if (!this.constraintExists(currentMarkerAttachment, this.markerMap.get(vert)!.WaitForChild("Attachment")! as Attachment)) {
                this.makeConstraint(currentMarkerAttachment, this.markerMap.get(vert)!.WaitForChild("Attachment")! as Attachment);
                this.constrainVerticies(vert);
            } else {
                print("Constraint already exists between " + vertexIndex + " and " + vert);
            }
        }

    }

    // Bind node to vertex by ID
    private makeNode(vertId: number) {

        // Calculate Position
        let pos = this.mesh!.GetPosition(vertId).mul(this.scaling);
        let node = new Instance("Part");
        let relativeCFrame = (this.instance as BasePart).CFrame.mul(new CFrame(pos));

        // Properties
        node.Position = relativeCFrame.Position;
        node.Size = new Vector3(0.1, 0.1, 0.1);
        node.Anchored = false;
        node.Transparency = 0;
        node.CanCollide = true
        node.CollisionGroup = "car";
        node.CanTouch = true;
        node.Parent = game.Workspace;
        node.Name = "node";
        node.CustomPhysicalProperties = new PhysicalProperties(100, 0, 0);
        node.Color = Color3.fromRGB(0, 255, 133);

        // Make attachment with unique ID
        let attachment = new Instance("Attachment");
        attachment.Parent = node;
        attachment.SetAttribute("id", HttpService.GenerateGUID(false));

        // For O(1) lookup
        this.markerMap.set(vertId, node);
        this.verticesMap.set(node, vertId);
    }

    onStart() {
        // (this.instance as BasePart).Anchored = true;
        this.mesh = AssetService.CreateEditableMeshFromPartAsync(this.instance as MeshPart);
        this.mesh.Parent = this.instance;
        this.vertices = this.mesh.GetVertices() as Array<number>;

        let partAttachment = new Instance("Attachment");
        partAttachment.Parent = this.instance as BasePart;

        for (let i = 0; i < this.vertices.size(); i++) {
            this.makeNode(this.vertices[i]);

        }
        print("Generated verticies, generating constraints...");
        // (this.instance as BasePart).Anchored = false;

        this.constrainVerticies((this.mesh.GetVertices() as Array<number>)[0] as number);
        print("Done!");
    }
}
import { BaseComponent, Component } from "@flamework/components";
import { Controller, OnStart } from "@flamework/core";
import { AssetService } from "@rbxts/services";
import { HttpService } from "@rbxts/services";

export class VehicleMesh extends BaseComponent implements OnStart {
    public vertices: Array<number> = [];
    public nodeMap = new Map<number, BasePart>();
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
        let spring = new Instance("SpringConstraint");
        spring.LimitsEnabled = true;

        let a1pos = (attachment1.Parent! as BasePart).Position;
        let a2pos = (attachment2.Parent! as BasePart).Position;

        spring.MinLength = a1pos.sub(a2pos).Magnitude - 0.2;
        spring.MaxLength = a1pos.sub(a2pos).Magnitude + 0.2;
        spring.FreeLength = a1pos.sub(a2pos).Magnitude;
        spring.Stiffness = 500;
        spring.Damping = 0.5;

        spring.Parent = game.Workspace.WaitForChild("constraints");
        spring.Attachment0 = attachment1;
        spring.Attachment1 = attachment2;

        // Add the constraint to the map
        let id1 = attachment1.GetAttribute("id") as string;
        let id2 = attachment2.GetAttribute("id") as string;
        this.constraintMap.set(id1 + id2, true);
    }

    // Iteratively constrain all vertecies to their adjacent vertecies
    private constrainVerticies() {
        let verticies = this.mesh!.GetVertices() as Array<number>;

        for (let vertex of verticies) {
            let nodePart = this.nodeMap.get(vertex)!;
            if (!nodePart) continue;
            let attachment1 = nodePart.WaitForChild("Attachment") as Attachment;

            for (let vertex2 of verticies) {
                if (vertex === vertex2) continue;
                if (!this.nodeMap.get(vertex2)) continue;

                let attachment2 = this.nodeMap.get(vertex2)!.WaitForChild("Attachment") as Attachment;
                if (!this.constraintExists(attachment1, attachment2)) this.makeConstraint(attachment1, attachment2);
            }
            wait();
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
        node.Size = new Vector3(0.3, 0.3, 0.3);
        node.Anchored = true;
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
        this.nodeMap.set(vertId, node);
        this.verticesMap.set(node, vertId);
    }

    private unanchorNodes() {
        for (let [_, node] of this.nodeMap) {
            (node as BasePart).Anchored = false;
        }

    }

    onStart() {
        // (this.instance as BasePart).Anchored = true;
        this.mesh = AssetService.CreateEditableMeshFromPartAsync(this.instance as MeshPart);
        this.mesh.Parent = this.instance;
        let verticies = this.mesh.GetVertices() as Array<number>;

        let partAttachment = new Instance("Attachment");
        partAttachment.Parent = this.instance as BasePart;

        for (let i = 0; i < verticies.size(); i += 10) {
            this.vertices.push(i);
            this.makeNode(verticies[i]);
        }
        print(`Generated ${this.vertices.size()} verticies, generating constraints...`);
        // (this.instance as BasePart).Anchored = false;

        this.constrainVerticies();
        this.unanchorNodes();
        print("Done!");
        print(`Generated ${this.constraintMap.size()} constraints!`)
    }
}
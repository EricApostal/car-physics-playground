# Car Physics Engine for Roblox
NOTE: This is WIP! While some things are partially implemented, some things aren't! Most of these systems work independently of each other, but haven't been integrated quite yet.

# About
Car Physics Playground is an experimental game, utilizing Roblox's experimental beta Meshing API. This game uses a combination of Roblox's physics in conjunction with custom physics to provide realistic crash representations.


https://github.com/EricApostal/car-physics-playground/assets/60072374/4e9f73f7-bfab-4701-8b4e-51bf7d74b8e2


Mesh Wireframe example (constraint representation)
![image](https://github.com/EricApostal/car-physics-playground/assets/60072374/0f70d7b9-bd9b-4f9b-9b29-bd4547eb940d)

By using mutable meshes, I can bind the position of each mesh vertex to its respective node. 

# How it works
To keep lag at a reasonable level, there are a lot of things that have to happen here. The initial implementation (seen in the video) is the best in terms of lag, because calculations aren't being performed very often- they only happen when collisions occur. Furthermore, they have no relation to the surrounding nodes. This is important because calculations are rare, and when they do occur they don't have any "chain reaction". This works, but doesn't allow for realistic physics.

To achieve realistic physics, I am using a `SpringConstraint` for every node. This alone is pretty trivial.

```ts
for (let [id, part] of verticies) {
    let attachment1 = part.WaitForChild("Attachment") as Attachment;

    for (let [id2, part2] of verticies) {
        if (part === part2) continue;

        let attachment2 = part2.WaitForChild("Attachment") as Attachment;
        if (!this.constraintExists(attachment1, attachment2)) {
            this.makeConstraint(attachment1, attachment2);
        }

    }
    wait();
}
```
This will create all of the spring constraints with a self check. While this works, it isn't functionally possible. This is being done on every polygon of the model- the model I made for this project has around 1,100 polygons. Because we are connecting each node to every other node (minus itself), this model has `(1100^2) - 1` constraints, or ~1,209,999 constraints. This isn't viable, as 1.2 million physics calculations *per tick* is completely unreasonable.

The solution to this problem is to create a "Physics Node", which is connected to other nodes that are at an offset. 

![image](https://github.com/EricApostal/car-physics-playground/assets/60072374/26a9c17e-445d-4b33-824e-ab3f72d178b9)

By using this system, I can still include realistic physics, but the amount of required calculations is extremely limited. This can also be extended to use prismatic constraints with spring constraints, to allow for more collision accuracy at playable performance.

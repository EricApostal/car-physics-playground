import { Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { Functions } from "server/network";

class PlayerData {
    private inVehicle: boolean = false;
    public onVehicleExit: Signal = new Signal();
    public player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    exitVehicle() {
        this.onVehicleExit.Fire();
        Functions.exitVehicle.invoke(this.player);
    }

    enterVehicle(vehicle: Model) {
        Functions.enterVehicle.invoke(this.player, vehicle);
    }

    getInVehicle() {
        return this.inVehicle;
    }
}

export namespace SessionManager {
    let _sessions: Map<Player, PlayerData> = new Map();

    export function init() {
        Players.PlayerAdded.Connect((player) => {
            createSession(player);
        });

        Players.PlayerRemoving.Connect((player) => {
            destroySession(player);
        });
    }

    export function getSession(player: Player) {
        return _sessions.get(player);
    }

    export function createSession(player: Player) {
        _sessions.set(player, new PlayerData(player));
    }

    export function destroySession(player: Player) {
        _sessions.delete(player);
    }
}

@Service()
export class SessionService {
    constructor() {
        SessionManager.init();
    }
}
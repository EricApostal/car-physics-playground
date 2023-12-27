import { Service } from "@flamework/core";
import { Players } from "@rbxts/services";

class PlayerData {

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
        _sessions.set(player, new PlayerData());
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
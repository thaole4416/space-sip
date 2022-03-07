import axios, { AxiosResponse } from "axios"
import { log } from "./utils";
import { AUTH_TOKEN, SHIP_ID, WALLET_POSI } from "./data"
import moment from "moment";
import { round } from 'lodash';

export interface ResponseType {
    error?: any;
    pagination?: any;
    result?: any;
}

export interface Ship {
    birthday: { seconds: number };
    birthday_reset: { seconds: number };
    ship_id: string;
    rarity: number;
    name: string;
    hp: number;
    attack: number;
    fuel: number;
    is_genesis: boolean;
    element: number;
}

const RARITY = {
    N: 0,
    R: 1,
    SR: 2,
    SSR: 3,
}

const ELEMENT = {
    FIRE: 0,
    QUAKE: 1,
    THUNDER: 2,
    TSUNAMI: 3,
}

export interface ViewShip {
    id: string,
    name: string,
    hp: number,
    attack: number,
    fuel: number,
    age: number,
    rarity: string,
    element: string
}

export interface Reward {
    reward: number;
    streak: number;
    streakReward: number;
}

const VALID_AGE = 35;
const FULL_ENERGY = 30;

export const getAge = (bd: number): number => moment().diff(moment(bd * 1000), 'days');
export const getRarity = (rarity: number): string => rarity === 1 ? 'R' : 'N';
export const filterValidAge = (ship: Ship): boolean => getAge(ship.birthday_reset.seconds) <= VALID_AGE;
export const sortByRarity = (shipA: Ship, shipB: Ship): number => shipB.rarity - shipA.rarity;
export const mapShipProperties = (ship: Ship) => ({
    id: ship.ship_id,
    name: ship.name,
    hp: round(ship.hp, 2),
    attack: round(ship.attack, 2),
    fuel: round(ship.fuel, 2),
    age: getAge(ship.birthday_reset.seconds),
    rarity: getRarity(ship.rarity),
    element: getElement(ship.element)
});
export const getElement = (element: number) => {
    return Object.keys(ELEMENT)[element];
}
export const countElement = (source: Ship[], element: number) =>
    source.reduce((prev, curr) => {
        if (curr.element === element) {
            return prev + 1;
        }
        return prev
    }, 0)
export const filterIsNotFireTeam = (enemy: any) => countElement(enemy.spaceships, ELEMENT.FIRE) < 3

export const onInit = async () => {

    const Squads = [["68430", "68426"], ["90858", "113024", "122775"]]
    const { enemies, sessionId } = await createEnemies(WALLET_POSI, Squads[0].map(Number))
    const viewEnemies = enemies.map((enemy: any, index: number) => ({
        id: index,
        hp: enemy.fight_hp,
        spaceships: enemy.spaceships
    }))
    const validEnemy = viewEnemies.filter(filterIsNotFireTeam)
    log(validEnemy)
}

export const bulkShip = async (address: string) => {
    try {
        const res: AxiosResponse<ResponseType, any> = await axios({
            url: 'https://api.sip.space/api/spaceship/bulk',
            method: 'post',
            data: { ship_id: SHIP_ID[address] },
            headers: {
                authorization: AUTH_TOKEN[address]
            }
        });
        if (res.data.result) {
            return res.data.result
        }
        return [];
    }
    catch (e) {
        return [];
    }
}

export const getBalance = async (address: string) => {
    try {
        const res: AxiosResponse<ResponseType, any> = await axios({
            url: 'https://api.sip.space/api/user/balance',
            method: 'get',
            headers: {
                authorization: AUTH_TOKEN[address]
            }
        });
        if (res.data.result) {
            return round(Number(res.data.result.pve.balance) / Math.pow(10, 18), 2);
        }
        return 0;
    }
    catch (e) {
        return 0;
    }
}

export const rechargeEnergy = async (address: string) => {
    try {
        const res: AxiosResponse<ResponseType, any> = await axios({
            url: 'https://api.sip.space/api/user/energy/recharge',
            method: 'post',
            headers: {
                authorization: AUTH_TOKEN[address]
            },
            data: {}
        });
        if (res.data.result) {
            return ''
        }
        return '';
    }
    catch (e) {
        return '';
    }
}

export const getUsedEnergy = async (address: string) => {
    try {
        const res: AxiosResponse<ResponseType, any> = await axios({
            url: 'https://api.sip.space/api/user/energy',
            method: 'get',
            headers: {
                authorization: AUTH_TOKEN[address]
            }
        });
        if (res.data.result) {
            return res.data.result.used_energy
        }
        return 30;
    }
    catch (e) {
        return 30;
    }
}

export const createEnemies = async (address: string, shipIds: number[]) => {
    try {
        const res: AxiosResponse<ResponseType, any> = await axios({
            url: 'https://api.sip.space/api/pve/session',
            method: 'post',
            headers: {
                authorization: AUTH_TOKEN[address]
            },
            data: {
                ship_ids: shipIds
            }
        });
        if (res.data.result) {
            return { enemies: res.data.result.enemy, sessionId: res.data.result.session_id }
        }
        return { enemies: [], sessionId: '' };
    }
    catch (e) {
        return { enemies: [], sessionId: '', error: 'out of fuel' };
    }
}

export const getShootPosition = (shoots: number) => {
    let res = [];
    let pos: string[] = [];
    for (let i = 0; i < shoots; i++) {
        let row = Math.round(Math.random() * 4);
        let col = Math.round(Math.random() * 4);
        while (i && pos.includes(`${row}${col}`)) {
            row = Math.round(Math.random() * 4);
            col = Math.round(Math.random() * 4);
        }
        pos.push(`${row}${col}`)
        res.push({ r: row, c: col });
    }
    return res;
}

export const createBattle = async (address: string, enemyTeam: number, sessionId: string, shipIds: number[], shoots: number, reset: boolean = false): Promise<Reward> => {
    let shoot_position = getShootPosition(shoots);
    if (reset) {
        shoot_position = getShootPosition(10);
    }
    let ship_position = shipIds.length === 3 ? [{ r: 0, c: 0 }, { r: 4, c: 0 }, { r: 4, c: 4 }] : shipIds.length === 1 ? getShootPosition(1) : [{ r: 0, c: 1 }, { r: 4, c: 1 }]
    try {
        const res: AxiosResponse<ResponseType, any> = await axios({
            url: 'https://api.sip.space/api/pve/fight/v2',
            method: 'post',
            headers: {
                authorization: AUTH_TOKEN[address]
            },
            data: {
                enemy_team: enemyTeam,
                session_id: sessionId,
                ship_ids: shipIds,
                ship_position,
                shoot_position
            }
        });
        if (res.data.result) {
            const { fight: { reward, win_streak, win_streak_reward } } = res.data.result
            return {
                reward: round(reward / Math.pow(10, 18), 2),
                streak: win_streak,
                streakReward: round(win_streak_reward / Math.pow(10, 18), 2)
            }
        }
        return { reward: 0, streak: 0, streakReward: 0 };
    }
    catch (e) {
        return { reward: 0, streak: 0, streakReward: 0 };
    }
}


/**
 * authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NDg3NTA4NTIsImlkIjoiNDFkNmYzN2QtMmQzYy00Mzg1LWFhZmYtNmI5ZTU2NjVhNDI0Iiwib3JpZ19pYXQiOjE2NDUxNTA4NTIsInZhbGlkVG9rZW4iOiIyMDIxLTExLTE1In0.XNtrtbuvHA4Usf7oDlKXudYPfwZjcIdbVYRzRdYWd58
 * bulk: https://api.sip.space/api/spaceship/bulk
 *  ** payload: {ship_id: string[]}
 *  ** return: {error: null, pagination: null, result: {spaceships: ship[]}}
 * energy: https://api.sip.space/api/user/energy
 * session: https://api.sip.space/api/pve/session
 *  ** payload: {ship_ids: number[]}
 *  ** return: {error: null, pagination: null, result: {enemy: enemy[]}}
 * v2: https://api.sip.space/api/pve/fight/v2
 *  ** payload: {
                enemy_team: enemyTeam,
                session_id: sessionId,
                ship_ids: shipIds,
                ship_position,
                shoot_position
            }
 * https://api.sip.space/api/tournament/match/list
 */ 
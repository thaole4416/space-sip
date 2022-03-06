import { isEmpty, isEqual, round } from "lodash";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  CLAIM_WALLET_ALPACA,
  CLAIM_WALLET_POSI,
  CLAIM_WALLET_SPACE_1,
  CLAIM_WALLET_SPACE_2,
  SQUAD_SHIPS,
  WALLET_ALPACA,
  WALLET_POSI,
  WALLET_SPACE_1,
  WALLET_SPACE_2,
  WALLET_SPACE_3,
} from "./data";
import "./style.css";
import {
  bulkShip,
  createBattle,
  createEnemies,
  getBalance,
  getElement,
  getUsedEnergy,
  mapShipProperties,
  rechargeEnergy,
  Ship,
  sortByRarity,
  ViewShip,
} from "./services";

function App() {
  const [enemies, setEnemies] = useState([]);
  const [address, setAddress] = useState(WALLET_POSI);
  const [sessionId, setSessionId] = useState("");
  const [shipIds, setShipIds] = useState<number[] | []>([]);
  const [ships, setShips] = useState<ViewShip[] | []>([]);
  const [usedEnergy, setUsedEnergy] = useState(0);
  const [balance, setBalance] = useState(0);
  const [teamHp, setTeamHp] = useState(0);
  const onSelectShipForSquad = (id: number) => () => {
    (shipIds as number[]).push(id);
    const { hp } = (ships as ViewShip[]).find(
      (ship) => Number(ship.id) === id
    )!;
    let totalHp = teamHp + hp;
    if (id === 132) totalHp += 0.25;
    setTeamHp(round(totalHp, 2));
    setShipIds([...shipIds]);
  };
  const onClearSquad = () => {
    setTeamHp(0);
    setShipIds([]);
  };
  const onSelectSquad = (squad: string[]) => () => {
    let totalHp = (ships as ViewShip[]).reduce(
      (prev: number, cur: ViewShip) => {
        if (squad.includes(cur.id)) return prev + cur.hp;
        return prev;
      },
      0
    );
    if (squad.includes("132")) totalHp += 0.25;
    setTeamHp(round(totalHp, 2));
    setShipIds(squad.map(Number));
  };
  const onCreateEnemies = async () => {
    const {
      enemies,
      sessionId: id,
      error,
    } = await createEnemies(address, shipIds);
    if (error) {
      alert("out of fuel");
      return [false, ""];
    }
    const viewEnemies = enemies.map((enemy: any, index: number) => ({
      id: index,
      hp: enemy.fight_hp,
      spaceships: enemy.spaceships,
    }));
    setEnemies(viewEnemies);
    setSessionId(id);
    const isContinueReset =
      viewEnemies.reduce(
        (prev: number, cur: any) => (cur.hp > teamHp ? prev + 1 : prev),
        0
      ) === 3;
    if (!isContinueReset) {
    }
    return [isContinueReset, id];
  };
  const onFight =
    (
      enemyTeam: number,
      team3N: boolean = false,
      team1R: boolean = false,
      isReset: boolean = false
    ) =>
    async () => {
      await createBattle(
        address,
        enemyTeam,
        sessionId,
        shipIds,
        team3N,
        team1R,
        isReset
      );
      setEnemies([]);
      if (!isReset) {
        await onInit();
      }
      if (isReset) {
        await loopReset(enemyTeam, sessionId, team3N, team1R, isReset, false);
      }
    };

  const loopReset = async (
    enemyTeam: number,
    id: string,
    team3N: boolean = false,
    team1R: boolean = false,
    isReset: boolean = false,
    fight: boolean = true
  ): Promise<any> => {
    if (fight) {
      await createBattle(
        address,
        enemyTeam,
        id,
        shipIds,
        team3N,
        team1R,
        isReset
      );
      setEnemies([]);
    }
    let [continueReset, _id] = await onCreateEnemies();
    if (continueReset) {
      return new Promise(() => {
        setTimeout(
          () => loopReset(enemyTeam, _id, team3N, team1R, isReset),
          2000
        );
      });
    } else {
      console.log("reset done");
      setSessionId(_id);
      return;
    }
  };

  const onInit = async () => {
    const ships = await bulkShip(address);
    const sortedShips: ViewShip[] = ships.spaceships
      .sort(sortByRarity)
      .map(mapShipProperties);
    setShips(sortedShips);
    const energy = await getUsedEnergy(address);
    setUsedEnergy(energy);
    const bl = await getBalance(address);
    setBalance(bl);
  };
  const onRecharge = async () => {
    await rechargeEnergy(address);
    const energy = await getUsedEnergy(address);
    setUsedEnergy(energy);
  };
  console.log(
    isEqual([14504, 55593, 76245], ["14504", "55593", "76245"].map(Number))
  );
  useEffect(() => {
    if (usedEnergy === 30) alert("out of energy");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedEnergy]);
  useEffect(() => {
    onInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);
  return (
    <div className="App">
      <ul className="list-group">
        <li
          className={
            address === WALLET_POSI
              ? "bg-info-50 list-group-item"
              : "list-group-item"
          }
        >
          <span
            className="text-primary"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setAddress(WALLET_POSI);
              setShipIds([]);
              setShips([]);
              setEnemies([]);
              setBalance(0);
            }}
          >
            Select&nbsp;&nbsp;&nbsp;
          </span>
          <span className="text-info">
            {moment(CLAIM_WALLET_POSI, "DD-MM-YYYY HH:mm")
              .add(5, "days")
              .format("DD-MM-YYYY HH:mm")}
            &nbsp;&nbsp;&nbsp;
          </span>
          {WALLET_POSI}
        </li>
        <li
          className={
            address === WALLET_ALPACA
              ? "bg-info-50 list-group-item"
              : "list-group-item"
          }
        >
          <span
            className="text-primary"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setAddress(WALLET_ALPACA);
              setShipIds([]);
              setShips([]);
              setEnemies([]);
              setBalance(0);
            }}
          >
            Select&nbsp;&nbsp;&nbsp;
          </span>
          <span className="text-info">
            {moment(CLAIM_WALLET_ALPACA, "DD-MM-YYYY HH:mm")
              .add(5, "days")
              .format("DD-MM-YYYY HH:mm")}
            &nbsp;&nbsp;&nbsp;
          </span>
          {WALLET_ALPACA}
        </li>
        <li
          className={
            address === WALLET_SPACE_1
              ? "bg-info-50 list-group-item"
              : "list-group-item"
          }
        >
          <span
            className="text-primary"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setAddress(WALLET_SPACE_1);
              setShipIds([]);
              setShips([]);
              setEnemies([]);
              setBalance(0);
            }}
          >
            Select&nbsp;&nbsp;&nbsp;
          </span>
          <span className="text-info">
            {moment(CLAIM_WALLET_SPACE_1, "DD-MM-YYYY HH:mm")
              .add(5, "days")
              .format("DD-MM-YYYY HH:mm")}
            &nbsp;&nbsp;&nbsp;
          </span>
          {WALLET_SPACE_1}
        </li>
        <li
          className={
            address === WALLET_SPACE_2
              ? "bg-info-50 list-group-item"
              : "list-group-item"
          }
        >
          <span
            className="text-primary"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setAddress(WALLET_SPACE_2);
              setShipIds([]);
              setShips([]);
              setEnemies([]);
              setBalance(0);
            }}
          >
            Select&nbsp;&nbsp;&nbsp;
          </span>
          <span className="text-info">
            {moment(CLAIM_WALLET_SPACE_2, "DD-MM-YYYY HH:mm")
              .add(5, "days")
              .format("DD-MM-YYYY HH:mm")}
            &nbsp;&nbsp;&nbsp;
          </span>
          {WALLET_SPACE_2}
        </li>
        <li
          className={
            address === WALLET_SPACE_3
              ? "bg-info-50 list-group-item"
              : "list-group-item"
          }
        >
          <span
            className="text-primary"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setAddress(WALLET_SPACE_3);
              setShipIds([]);
              setShips([]);
              setEnemies([]);
              setBalance(0);
            }}
          >
            Select&nbsp;&nbsp;&nbsp;
          </span>
          <span className="text-info">
            {moment(CLAIM_WALLET_SPACE_2, "DD-MM-YYYY HH:mm")
              .add(5, "days")
              .format("DD-MM-YYYY HH:mm")}
            &nbsp;&nbsp;&nbsp;
          </span>
          {WALLET_SPACE_3}
        </li>
      </ul>
      <br />
      <h4>
        <span>
          Used Energy: {usedEnergy}{" "}
          {usedEnergy === 30 && (
            <span
              style={{ cursor: "pointer" }}
              className="text-primary"
              onClick={onRecharge}
            >
              Recharge
            </span>
          )}
          &nbsp;&nbsp;&nbsp;
        </span>
        <span>Unclaim: {balance}</span>
      </h4>
      <h4>Ship: {shipIds.join(", ")}</h4>
      <table className="table table-light table-sm table-striped table-hover table-bordered">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Element</th>
            <th>Hp</th>
            <th>Attack</th>
            <th>Fuel</th>
            <th>Age</th>
            <th>Rarity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {ships.map((ship) => (
            <tr
              key={ship.id}
              className={
                // @ts-ignore
                shipIds.includes(Number(ship.id)) ? "bg-info-50" : undefined
              }
            >
              <td>{ship.id}</td>
              <td>{ship.name}</td>
              <td>{ship.element}</td>
              <td>{ship.hp}</td>
              <td>{ship.attack}</td>
              <td
                className={
                  ship.fuel < 5 ? "text-danger fw-bold" : "text-success"
                }
              >
                {ship.fuel}
              </td>
              <td
                className={
                  ship.age >= 35 ? "text-warning fw-bold" : "text-success"
                }
              >
                {ship.age}
              </td>
              <td>{ship.rarity}</td>
              <td>
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  onClick={onSelectShipForSquad(Number(ship.id))}
                >
                  Select Ship
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>
        Squad: {shipIds.join(", ")} {"=>>"} {teamHp}
      </h4>
      <button className="btn btn-sm btn-danger mb-4" onClick={onClearSquad}>
        Clear
      </button>
      <table className="table table-light table-sm table-striped table-hover table-bordered">
        <thead>
          <tr>
            <th>Squad</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {!isEmpty(SQUAD_SHIPS[address]) &&
            SQUAD_SHIPS[address].map((squad) => (
              <tr
                key={squad[0]}
                className={
                  isEqual(shipIds, squad.map(Number)) ? "bg-info-50" : undefined
                }
              >
                <td>{squad.join(", ")}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={onSelectSquad(squad)}
                  >
                    Select Squad
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <button
        className="btn btn-primary btn-sm mb-4"
        type="button"
        onClick={onCreateEnemies}
      >
        Create Enemies
      </button>
      <h4>Enemy:</h4>
      <table className="table table-light table-sm table-striped table-hover table-bordered">
        <thead>
          <tr>
            <th>Id</th>
            <th>Fight Hp</th>
            <th>Elements</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {enemies &&
            enemies.map((enemy: any) => (
              <tr key={enemy.id}>
                <td>{enemy.id}</td>
                <td
                  className={
                    enemy.hp <= teamHp - 4
                      ? "text-success"
                      : enemy.hp <= teamHp
                      ? "text-warning"
                      : "text-danger"
                  }
                >
                  {enemy.hp}
                </td>
                <td>
                  {enemy.spaceships
                    .map((ship: Ship) => getElement(ship.element))
                    .join(", ")}
                </td>
                <td>
                  <button
                    className="btn btn-primary btn-sm me-3"
                    type="button"
                    onClick={onFight(enemy.id)}
                  >
                    fight
                  </button>
                  <button
                    className="btn btn-primary btn-sm me-3"
                    type="button"
                    onClick={onFight(enemy.id, true)}
                  >
                    fight 3N
                  </button>
                  <button
                    className="btn btn-primary btn-sm me-3"
                    type="button"
                    onClick={onFight(enemy.id, false, true)}
                  >
                    fight 1R
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={onFight(enemy.id, false, false, true)}
                  >
                    reset enemy
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

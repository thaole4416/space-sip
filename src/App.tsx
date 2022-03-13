import { add, isEmpty, isEqual, minBy, round, slice, subtract } from "lodash";
import React, { useEffect, useState } from "react";
import {
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
  getUsedEnergy,
  mapShipProperties,
  rechargeEnergy,
  Ship,
  sortByRarity,
  ViewShip,
} from "./services";
import x from "../tsconfig.json";

function App() {
  const [address, setAddress] = useState(WALLET_POSI);
  const [sessionId, setSessionId] = useState("");
  const [shipIds, setShipIds] = useState<number[] | []>([]);
  const [shoots, setShoots] = useState(0);
  const [ships, setShips] = useState<ViewShip[] | []>([]);
  const [usedEnergy, setUsedEnergy] = useState(0);
  const [balance, setBalance] = useState(0);
  const [teamHp, setTeamHp] = useState(0);
  const [bestEnemy, setBestEnemy] = useState({ id: -1, hp: 9999 });
  const onSelectShipForSquad = (id: number) => () => {
    if ((shipIds as number[]).includes(id)) {
      setShipIds([...shipIds.filter((x) => x !== id)]);
      const { hp, rarity } = (ships as ViewShip[]).find(
        (ship) => Number(ship.id) === id
      )!;
      let totalHp = teamHp - hp;
      if (id === 132) totalHp -= 0.25;
      setShoots((s) => subtract(s, rarity === "R" ? 3 : 2));
      setTeamHp(round(totalHp, 2));
    } else {
      (shipIds as number[]).push(id);
      const { hp, rarity } = (ships as ViewShip[]).find(
        (ship) => Number(ship.id) === id
      )!;
      let totalHp = teamHp + hp;
      if (id === 132) totalHp += 0.25;
      setShoots((s) => add(s, rarity === "R" ? 3 : 2));
      setTeamHp(round(totalHp, 2));
      setShipIds([...shipIds]);
    }
  };
  const onClearSquad = () => {
    setTeamHp(0);
    setShoots(0);
    setShipIds([]);
  };
  const onSelectSquad = (squad: string[]) => () => {
    let [totalHp, totalShoots] = (ships as ViewShip[]).reduce(
      (prev: number[], cur: ViewShip) => {
        if (squad.includes(cur.id))
          return [prev[0] + cur.hp, add(prev[1], cur.rarity === "R" ? 3 : 2)];
        return prev;
      },
      [0, 0]
    );
    if (squad.includes("132")) totalHp += 0.25;
    setShoots(totalShoots);
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
    const _bestChoice = minBy(viewEnemies, (o: any) => o.hp);
    setBestEnemy(_bestChoice);
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
    (enemyTeam: number, isReset: boolean = false) =>
    async () => {
      await createBattle(
        address,
        enemyTeam,
        sessionId,
        shipIds,
        shoots,
        isReset
      );
      setBestEnemy({ id: -1, hp: 9999 });
      if (!isReset) {
        await onInit();
      }
      if (isReset) {
        await loopReset(enemyTeam, sessionId, isReset, false);
      }
    };

  const loopReset = async (
    enemyTeam: number,
    id: string,
    isReset: boolean = false,
    fight: boolean = true
  ): Promise<any> => {
    if (fight) {
      await createBattle(address, enemyTeam, id, shipIds, shoots, isReset);
    }
    let [continueReset, _id] = await onCreateEnemies();
    if (continueReset) {
      return new Promise(() => {
        setTimeout(() => loopReset(enemyTeam, _id, isReset), 2000);
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
      .filter((item: Ship) =>
        SQUAD_SHIPS[address].flatMap((x) => x).includes(item.ship_id)
      )
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
  const walletList = (
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
            setBalance(0);
          }}
        >
          Select&nbsp;&nbsp;&nbsp;
        </span>
        {slice(WALLET_POSI, -4)}
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
            setBalance(0);
          }}
        >
          Select&nbsp;&nbsp;&nbsp;
        </span>
        {slice(WALLET_ALPACA, -4)}
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
            setBalance(0);
          }}
        >
          Select&nbsp;&nbsp;&nbsp;
        </span>
        {slice(WALLET_SPACE_1, -4)}
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
            setBalance(0);
          }}
        >
          Select&nbsp;&nbsp;&nbsp;
        </span>

        {slice(WALLET_SPACE_2, -4)}
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
            setBalance(0);
          }}
        >
          Select&nbsp;&nbsp;&nbsp;
        </span>

        {slice(WALLET_SPACE_3, -4)}
      </li>
    </ul>
  );
  const generalInfo = (
    <p>
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
    </p>
  );
  const renderElement = (elem: string) => {
    let className = "";
    if (elem === "FIRE") className = "bg-warning";
    else if (elem === "THUNDER") className = "bg-danger";
    else if (elem === "QUAKE") className = "bg-success";
    else className = "bg-primary";
    return (
      <div
        className={className}
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          display: "inline-block",
        }}
      />
    );
  };
  const baseStation = (
    <>
      <table className="table table-light table-sm table-striped table-hover table-bordered">
        <thead>
          <tr>
            <th>Id</th>
            <th>&nbsp;&nbsp;&nbsp;</th>
            <th>Hp</th>
            <th>Attack</th>
            <th>Fuel</th>
            <th>Age</th>
            <th>Rarity</th>
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
              onClick={onSelectShipForSquad(Number(ship.id))}
              style={{ cursor: "pointer" }}
            >
              <td>{ship.id}</td>
              <td align="center" valign="middle">
                {renderElement(ship.element)}
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
  const battlefield = (
    <>
      <table className="table table-light table-sm table-striped table-hover table-bordered">
        <thead>
          <tr>
            <th>Team</th>
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
                  <div className="btn-group" role="group">
                    {isEqual(shipIds, squad.map(Number)) ? (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          disabled={isEmpty(shipIds)}
                          onClick={onCreateEnemies}
                        >
                          Start
                        </button>
                        <button
                          className={`btn btn-sm ${
                            bestEnemy?.hp < teamHp
                              ? "btn-primary"
                              : "btn-danger"
                          }`}
                          onClick={onFight(
                            bestEnemy?.id,
                            bestEnemy?.hp < teamHp ? false : true
                          )}
                          disabled={bestEnemy?.id === -1}
                        >
                          {bestEnemy?.hp < teamHp ? ">" : "c"}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={onClearSquad}
                          disabled={isEmpty(shipIds)}
                        >
                          Clear
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        type="button"
                        onClick={onSelectSquad(squad)}
                      >
                        v
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
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
    <div className="App" style={{ width: "380px" }}>
      {generalInfo}
      <div className="row">
        <div className="col">
          {walletList}
          <br />
          {baseStation}
        </div>
        <div className="col">{battlefield}</div>
      </div>
    </div>
  );
}

export default App;

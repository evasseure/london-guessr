import { MouseEvent } from "react";
import styles from "./GameFinished.module.css";

type GameFinishedProps = {
  resetGame(e: MouseEvent): void;
};

const GameFinished = (props: GameFinishedProps) => (
  <div className={styles.gameFinishedContainer}>
    <p className={styles.gameFinishedTitle}>Good job!</p>
    <button onClick={props.resetGame} className={styles.gameFinishButton}>
      Start a new game
    </button>
  </div>
);

export default GameFinished;

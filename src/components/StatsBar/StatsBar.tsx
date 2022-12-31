import * as styles from "./StatsBar.module.css";

type StatsBarProps = {
  timer: number;
  triesCounter: number;
  ALLOWED_TRIES: number;
};

const StatsBar = (props: StatsBarProps) => (
  <div className={styles.statsBar}>
    <div>
      <span className={styles.clock}>🕒</span>
      {[Math.floor(props.timer / 60), props.timer % 60 < 10 ? "0" + (props.timer % 60) : props.timer % 60].join(":")}
    </div>
    <div className={styles.lives}>
      {[...Array(props.triesCounter).keys()].map((i) => (
        <span key={"bheart-" + i}>🖤</span>
      ))}
      {[...Array(props.ALLOWED_TRIES - props.triesCounter).keys()].map((i) => (
        <span key={"rheart-" + i}>❤️</span>
      ))}
    </div>
  </div>
);

export default StatsBar;

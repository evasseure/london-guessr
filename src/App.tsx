import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import styles from "./App.module.css";
import { MAP_COLORS } from "./colors";
import StatsBar from "./components/StatsBar";
import BOROUGHS from "./data/boroughs.json";
import LondonMap from "./components/Maps/LondonMap";
import GameFinished from "./components/GameFinished";

type Question = {
  id: number;
  name: string;
  status: "AWAITING" | "CORRECT" | "MEH" | "FAILED";
};

const ALLOWED_TRIES = 3;

export function App() {
  const mapRef = useRef<SVGSVGElement>(null);

  const [onlyInner, setOnlyInner] = useState(localStorage.getItem("onlyInner") !== "false" ?? true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [triesCounter, setTriesCounter] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const gameFinished = questionIndex === questions.length;

  const resetGame = () => {
    setQuestions(
      d3.shuffle(BOROUGHS.filter((b) => (onlyInner ? b.inner : true)).map((q) => ({ ...q, status: "AWAITING" })))
    );
    setTriesCounter(0);
    setTimer(0);
    setQuestionIndex(0);
  };

  const goToNextQuestion = () => {
    setQuestionIndex((idx) => idx + 1);
    setTriesCounter(0);
  };

  const checkAnswer = (id: number) => {
    if (questions.length === 0) return;

    let q = [...questions];
    if (id === questions[questionIndex].id) {
      q[questionIndex].status = triesCounter === 0 ? "CORRECT" : "MEH";
      goToNextQuestion();
      setQuestions(q);
    } else if (triesCounter < ALLOWED_TRIES - 1) {
      setTriesCounter((tries) => tries + 1);
    } else {
      q[questionIndex].status = "FAILED";
      goToNextQuestion();
      setQuestions(q);
    }
  };

  const getZoneStatus = (id: number) => {
    const result = questions.find((a) => a.id === id);
    if (result) return result.status;
    return "IGNORED";
  };

  const showAwserHint = (hint: string, x: number, y: number) => {
    const svgElement = d3.select(mapRef.current);

    // transform to SVG coordinates
    const pt = mapRef.current!.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const svgP = pt.matrixTransform(mapRef.current!.getScreenCTM()!.inverse());

    const container = svgElement
      .append("foreignObject")
      .attr("x", svgP.x)
      .attr("y", svgP.y - 30)
      .attr("width", "100%")
      .attr("height", "64px")
      .style("opacity", 0)
      .style("pointer-events", "none");

    const label = container.append("xhtml:div").attr("class", "hint-label").html(hint);

    // Forcing non null, since there is not reason it could be null.
    const boundingRect = (label!.node()! as Element).getBoundingClientRect();

    container
      .attr("x", svgP.x - boundingRect.width / 2)
      .style("transform", "translateX(" + -boundingRect.width / 2 + "px)")
      .transition()
      .duration(500)
      .style("opacity", 1)
      .transition()
      .duration(1200)
      .attr("y", svgP.y - 40)
      .style("opacity", 0)
      .remove();
  };

  const handleMouseEnter = (e: MouseEvent) => {
    const target = e.target as SVGPathElement;
    const id = parseInt(target.id.replace("zone-", ""));
    if (getZoneStatus(id) === "AWAITING") {
      target.style.fill = MAP_COLORS.HOVER.fill;
      target.style.stroke = MAP_COLORS.HOVER.stroke;
    }
  };

  const handleMouseLeave = (e: MouseEvent) => {
    const target = e.target as SVGPathElement;
    const id = parseInt(target.id.replace("zone-", ""));
    if (getZoneStatus(id) === "AWAITING") {
      target.style.fill = MAP_COLORS[getZoneStatus(id)].fill;
      target.style.stroke = MAP_COLORS[getZoneStatus(id)].stroke;
    }
  };

  const handleClick = (e: MouseEvent) => {
    const target = e.target as SVGPathElement;
    const id = parseInt(target.id.replace("zone-", ""));
    if (getZoneStatus(id) === "AWAITING") {
      checkAnswer(id);

      const result = questions.find((a) => a.id === id);
      if (result) showAwserHint(result.name, e.clientX, e.clientY);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.querySelectorAll("path").forEach((p) => {
        const id = parseInt(p.id.replace("zone-", ""));
        p.style.fill = MAP_COLORS[getZoneStatus(id)].fill;
        p.style.stroke = MAP_COLORS[getZoneStatus(id)].stroke;
        p.addEventListener("mouseenter", handleMouseEnter);
        p.addEventListener("mouseleave", handleMouseLeave);
        p.addEventListener("click", handleClick);
      });
    }

    return () => {
      if (map) {
        map.querySelectorAll("path").forEach((p) => {
          p.removeEventListener("mouseenter", handleMouseEnter);
          p.removeEventListener("mouseleave", handleMouseLeave);
          p.removeEventListener("click", handleClick);
        });
      }
    };
  }, [questions, triesCounter]);

  useEffect(() => {
    if (!gameFinished) {
      const interval = setInterval(() => setTimer(timer + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, gameFinished]);

  useEffect(() => {
    resetGame();
    localStorage.setItem("onlyInner", onlyInner.toString());
  }, [onlyInner]);

  return (
    <div className={styles.app}>
      <div className={styles.sideBar}>
        <h1 className={styles.title}>LondonGuessr</h1>
        <div className={styles.dataOptions}>
          <div className={styles.questionLabel}>Dataset :</div>
          <div className={styles.dataOptionsOptions}>
            <div
              className={`${styles.dataOption} ${onlyInner ? styles.enabled : ""}`}
              onClick={() => setOnlyInner(true)}>
              Inner London
            </div>
            <div
              className={`${styles.dataOption} ${!onlyInner ? styles.enabled : ""}`}
              onClick={() => setOnlyInner(false)}>
              Complete London
            </div>
          </div>
        </div>
        {gameFinished ? (
          <GameFinished resetGame={resetGame} />
        ) : (
          <div className={styles.questions}>
            {questions.length > 0 && questionIndex < questions.length && (
              <>
                <div className={styles.questionLabel}>Where is :</div>
                <div className={styles.question}>{questions[questionIndex].name}</div>
              </>
            )}
            {questions
              .slice(0, questionIndex)
              .reverse()
              .map((answer) => (
                <div
                  key={"answer-" + answer.id}
                  className={styles.answer}
                  style={{
                    color: MAP_COLORS[answer.status].stroke,
                    backgroundColor: MAP_COLORS[answer.status].fill,
                  }}>
                  {answer.name}
                </div>
              ))}
          </div>
        )}
        <div className={styles.answersData}>
          <div>✅ {questions.filter((a) => a.status === "CORRECT").length}</div>
          <div>⚠️ {questions.filter((a) => a.status === "MEH").length}</div>
          <div>❌ {questions.filter((a) => a.status === "FAILED").length}</div>
        </div>
      </div>
      <div className={styles.mapContainer}>
        <StatsBar timer={timer} ALLOWED_TRIES={ALLOWED_TRIES} triesCounter={triesCounter} />
        <LondonMap ref={mapRef} />
      </div>
    </div>
  );
}
